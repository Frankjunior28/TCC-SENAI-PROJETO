/**
 * ============================================================================
 *  API  →  CONTROLLER DE PEDIDOS (coleção "pedidos")
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UM CONTROLLER
 *  ---------------------------------------------------------------------------
 *    Função que atende uma requisição HTTP: recebe o `req`, conversa com o
 *    banco pelo model Mongoose `Pedido`, valida as regras de negócio do
 *    checkout e devolve a resposta em JSON.
 *
 *  ---------------------------------------------------------------------------
 *  O FLUXO DE UMA VENDA, PASSO A PASSO
 *  ---------------------------------------------------------------------------
 *    1. O cliente adiciona itens ao carrinho (o estado mora no App.jsx e é
 *       salvo no localStorage com a chave "tccCarrinho:perfil:id").
 *    2. Na tela CarrinhoScreen.jsx, o total é calculado somando
 *       preço × quantidade de cada item, e o clique em "Finalizar compra"
 *       chama `api.criarPedido(...)`.
 *    3. Este controller valida o que chegou e grava o documento.
 *    4. O status nasce "pendente" — ele NÃO é enviado pelo frontend: quem
 *       define é o `default` do schema (models/pedido.js).
 *    5. Gerente e administrador veem o pedido nos painéis e podem mudar o
 *       status para "entregue" ou "cancelado" via PUT.
 *
 *  ---------------------------------------------------------------------------
 *  4. CONTROLE DE ESTOQUE (a parte mais importante deste controller)
 *  ---------------------------------------------------------------------------
 *    O checkout NÃO pode aceitar uma compra maior do que o que existe em
 *    estoque. Exemplo do enunciado: comprar 12 camas quando há 8 no estoque
 *    precisa falhar; comprar 4 camas com 8 disponíveis precisa passar.
 *
 *    A conferência acontece AQUI, no servidor, e não apenas no navegador,
 *    por um motivo de segurança: o front pode ser burlado. Alguém pode
 *    chamar POST /api/pedidos direto pelo Postman ou pelo console, com
 *    qualquer quantidade. Se a única barreira fosse a interface, a regra
 *    seria contornada em um clique. O backend é a autoridade; a interface
 *    só evita que o cliente chegue a tentar uma compra inválida.
 *
 *    A sequência completa é: resolver → somar → conferir → gravar → baixar.
 *
 *  ---------------------------------------------------------------------------
 *  ENDPOINTS
 *  ---------------------------------------------------------------------------
 *    GET    /api/pedidos      → listarPedidos          (painéis Gerente/Master)
 *    GET    /api/pedidos/:id  → buscarPedidoPorId
 *    POST   /api/pedidos      → criarPedido            (checkout do carrinho)
 *    PUT    /api/pedidos/:id  → atualizarStatusPedido  (entregar / cancelar)
 *    DELETE /api/pedidos/:id  → deletarPedido
 * ============================================================================
 */
import Pedido from "../models/pedido.js";
import Produto from "../models/produto.js";

/**
 * Texto devolvido quando a quantidade pedida passa do estoque disponível.
 * Fica numa constante para que a interface e a documentação usem sempre a
 * mesma redação. O detalhe de qual produto e quanto faltou vai no campo
 * `error` da resposta, que o frontend concatena à mensagem.
 */
const MSG_ESTOQUE = "Limite de estoque atingido";

// ===========================================================================
// GET /api/pedidos — lista as vendas, da mais recente para a mais antiga
// ===========================================================================
/**
 * `.sort({ createdAt: -1 })` ordena de forma DECRESCENTE pelo campo
 * `createdAt`. O sinal de menos é o que inverte a ordem: sem ele, as
 * vendas mais antigas apareceriam primeiro. O campo `createdAt` existe
 * graças ao `{ timestamps: true }` do schema — o Mongoose o preenche
 * sozinho em toda criação, por isso o frontend não precisa enviá-lo.
 *
 * A ordenação já é feita no BANCO (e não no navegador) justamente para
 * que a API entregue a lista pronta, evitando que cada tela precise
 * reordenar os dados.
 */
export const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar pedidos", error: error.message });
  }
};

// ===========================================================================
// GET /api/pedidos/:id — busca um pedido pelo identificador
// ===========================================================================
/**
 * req.params.id → o valor do ":id" na rota.
 * Devolve 404 quando nada é encontrado, encerrando o handler com `return`
 * para que não haja uma segunda tentativa de resposta.
 */
export const buscarPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido não encontrado" });
    res.status(200).json(pedido);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar pedido", error: error.message });
  }
};

// ===========================================================================
// POST /api/pedidos — cria o pedido (chamado pelo checkout)
// ===========================================================================
/**
 * CORPO ESPERADO (montado em CarrinhoScreen.jsx):
 *   {
 *     cliente: { nome, email },              // vêm do usuário logado
 *     itens: [ { produto, produtoId, preco, qtd } ],
 *     total: 2498.90                         // somado no navegador
 *   }
 *
 * VALIDAÇÕES FEITAS AQUI (nenhuma delas chega a gravar algo):
 *   • `cliente?.nome` e `cliente?.email` precisam existir.
 *     O `?.` é o "optional chaining": se `cliente` for undefined, a
 *     expressão vira undefined em vez de estourar um erro — o `if` então
 *     dispara normalmente. Sem ele, o servidor quebraria ao receber um
 *     corpo sem cliente.
 *   • `itens` precisa ser uma lista (`Array.isArray`) e não pode estar
 *     vazia: um pedido sem item não faz sentido comercial.
 *   • cada quantidade precisa ser >= 1;
 *   • cada produto precisa existir ainda no catálogo;
 *   • a quantidade somada de cada produto não pode passar do estoque.
 *
 * O REMAPEAMENTO DOS ITENS (higienização por whitelist):
 *   O frontend envia um objeto maior por item — inclui `id` e `foto`, que
 *   são dados de TELA, não de pedido. O `.map()` constrói um objeto novo
 *   com EXATAMENTE os campos que interessam.
 *   Por que isso importa: se alguém enviar campos extras (ou maliciosos)
 *   na requisição, eles são descartados aqui e nunca chegam ao banco.
 *
 * O STATUS NÃO É ENVIADO DE PROPÓSITO:
 *   deixando o campo de fora do objeto, quem define o valor inicial é o
 *   `default: "pendente"` do schema. Assim, nenhuma requisição externa
 *   consegue criar um pedido já marcado como "entregue".
 *
 * ⚠️ OBSERVAÇÃO SOBRE O TOTAL (pendência conhecida, ver seção 13 da doc.):
 *   o backend confia no `total` enviado pelo cliente. Uma versão mais
 *   segura recalcularia a soma aqui, usando os preços do banco.
 */
export const criarPedido = async (req, res) => {
  try {
    const { cliente, itens, total } = req.body;

    // ------------------------------------------------------------------
    // VALIDAÇÃO 1 — cliente
    // ------------------------------------------------------------------
    if (!cliente?.nome || !cliente?.email) {
      return res.status(400).json({ message: "Informe os dados do cliente" });
    }
    // ------------------------------------------------------------------
    // VALIDAÇÃO 2 — lista de itens
    // ------------------------------------------------------------------
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ message: "O pedido precisa ter pelo menos um item" });
    }

    // ------------------------------------------------------------------
    // ETAPA A — RESOLVER CADA ITEM DO CARRINHO EM UM PRODUTO DO CATÁLOGO
    // ------------------------------------------------------------------
    // Sem isso não haveria como conferir o estoque: é preciso o documento
    // real da coleção "produtos", não só o nome que veio do navegador.
    //   • usa o `produtoId` quando existe (é o caso normal);
    //   • cai para busca por NOME quando o id não veio — assim carrinhos
    //     salvos em versões antigas, que não tinham produtoId, continuam
    //     funcionando em vez de falhar com "produto não encontrado".
    //   • o .catch(() => null) evita que um id malformado (não é um
    //     ObjectId válido) derrube a requisição com um erro de cast.
    const resolvidos = [];
    for (const item of itens) {
      const qtd = Number(item.qtd) || 0;
      if (qtd < 1) {
        return res.status(400).json({ message: `Quantidade inválida para "${item.produto}".` });
      }

      const produto = item.produtoId
        ? await Produto.findById(item.produtoId).catch(() => null)
        : await Produto.findOne({ nome: item.produto });

      if (!produto) {
        return res.status(400).json({
          message: `O produto "${item.produto}" não está mais disponível no catálogo.`,
        });
      }
      resolvidos.push({ produto, qtd });
    }

    // ------------------------------------------------------------------
    // ETAPA B — SOMAR POR PRODUTO E CONFERIR O ESTOQUE
    // ------------------------------------------------------------------
    // Por que somar em vez de conferir item a item: o mesmo produto pode
    // aparecer em duas linhas do mesmo pedido. Com 8 em estoque, "6 + 6"
    // passaria numa checagem linha a linha (6 <= 8 nas duas), mas somando
    // vira 12 e é corretamente recusado. O Map agrupa pelo id do produto.
    const porProduto = new Map();
    for (const { produto, qtd } of resolvidos) {
      const chave = produto._id.toString();
      porProduto.set(chave, { produto, qtd: (porProduto.get(chave)?.qtd || 0) + qtd });
    }

    for (const { produto, qtd } of porProduto.values()) {
      // A regra: pode comprar TUDO o estoque, mas não mais que ele.
      //   4  →  4 <= 8  →  aprovado
      //   12 →  12 > 8  →  recusado
      if (qtd > produto.estoque) {
        return res.status(400).json({
          message: MSG_ESTOQUE,
          // `error` é lido e concatenado pelo frontend (montarMensagem em
          // ui/src/services/api.js), então o usuário vê o texto curto e,
          // entre parênteses, o detalhe de qual produto e quanto faltou.
          error: `"${produto.nome}" — disponível: ${produto.estoque}, solicitado: ${qtd}.`,
        });
      }
    }

    // ------------------------------------------------------------------
    // ETAPA C — GRAVAR O PEDIDO
    // ------------------------------------------------------------------
    const novoPedido = await Pedido.create({
      cliente: { nome: cliente.nome, email: cliente.email },
      itens: resolvidos.map(({ produto, qtd }) => ({
        produto: produto.nome,
        produtoId: produto._id,
        // O preço vem do BANCO, não do navegador. O carrinho pode estar
        // velho (salvo no localStorage antes de o gerente mudar o preço);
        // o que vale é sempre o preço vigente no momento da compra.
        preco: produto.preco,
        qtd,
      })),
      total: Number(total) || 0,
    });

    // ------------------------------------------------------------------
    // ETAPA D — DAR BAIXA NO ESTOQUE
    // ------------------------------------------------------------------
    // $inc soma/ subtrai um valor do campo, direto no banco.
    //
    // O detalhe importante é o filtro `estoque: { $gte: qtd }`: ele só
    // aplica a baixa se, no momento exato da operação, ainda houver essa
    // quantidade. Isso torna a atualização SEGURA (atômica) no nível do
    // documento: duas compras simultâneas do mesmo último item não
    // succeedsão — uma baixa e a outra não altera nada. Sem essa condição,
    // o estoque poderia ficar negativo.
    //
    // Se alguma baixa não entrar (outra compra ganhou a corrida), o pedido
    // é desfeito e o estoque devolvido, para não sobrar venda sem estoque.
    const baixados = [];
    for (const { produto, qtd } of porProduto.values()) {
      const resultado = await Produto.updateOne(
        { _id: produto._id, estoque: { $gte: qtd } },
        { $inc: { estoque: -qtd } }
      );

      if (resultado.modifiedCount === 0) {
        // Outra compra usou as unidades entre a conferência e a baixa.
        // Desfaz o que já foi baixado e apaga o pedido recém-criado.
        for (const feito of baixados) {
          await Produto.updateOne({ _id: feito.id }, { $inc: { estoque: feito.qtd } });
        }
        await Pedido.findByIdAndDelete(novoPedido._id);

        return res.status(409).json({
          message: "O estoque mudou enquanto a compra era concluída",
          error: `Tente novamente: a quantidade de "${produto.nome}" pode ter sido vendida.`,
        });
      }
      baixados.push({ id: produto._id, qtd });
    }

    res.status(201).json(novoPedido);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar pedido", error: error.message });
  }
};

// ===========================================================================
// PUT /api/pedidos/:id — altera SOMENTE o status do pedido
// ===========================================================================
/**
 * ESTE HANDLER É DELIBERADAMENTE RESTRITO:
 *   Ele não aceita o corpo da requisição inteiro. Em vez de gravar o que
 *   chegou (`req.body`), ele monta um objeto novo contendo só o status:
 *       Pedido.findByIdAndUpdate(id, { status }, { new: true })
 *   Consequência prática: um cliente não consegue, por esta rota, alterar
 *   o total, os itens ou o e-mail do comprador de um pedido já registrado.
 *
 * VALIDAÇÃO EM DUAS CAMADAS (e é um bom ponto para a defesa):
 *   • AQUI, no controller: uma LISTA BRANCA de valores aceitos
 *     ["pendente", "entregue", "cancelado"]. Qualquer outro valor → 400.
 *   • NO BANCO, no schema: o `enum` do campo status rejeita o mesmo conjunto.
 *   A validação em uma camada só protegeria o caminho que passa por ela;
 *   nas duas, todos os caminhos de escrita ficam protegidos.
 *
 * `{ new: true }` → devolve o pedido já com o status novo, e é esse
 * documento que o frontend recebe.
 */
export const atualizarStatusPedido = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pendente", "entregue", "cancelado"].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      req.params.id,
      { status }, // objeto montado aqui: nada mais é alterado
      { new: true }
    );
    if (!pedidoAtualizado) return res.status(404).json({ message: "Pedido não encontrado" });
    res.status(200).json(pedidoAtualizado);
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar pedido", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/pedidos/:id — apaga um pedido
// ===========================================================================
/**
 * Usado pelos painéis (gerente e administrador) após uma confirmação.
 * findByIdAndDelete apaga e devolve o documento removido, ou null se não
 * existia — o que permite responder 404 corretamente.
 *
 * DEVOLUÇÃO DO ESTOQUE — POR QUE ESTE HANDLER NÃO É MAIS SÓ UM DELETE:
 *   Quando o pedido é criado, o estoque é abatido (veja ETAPA D em
 *   criarPedido). Se a venda for apagada e o estoque não voltar, o banco
 *   ficaria inconsistente: haveria uma peça faltando que, na verdade,
 *   voltou a estar disponível para venda.
 *   Por isso, antes de apagar, os itens do pedido são lidos e o estoque de
 *   cada produto devolvido.
 *
 *   TRÊS CUIDADOS QUE EVITAM O ESTOQUE FICAR ERRADO:
 *     1) SÓ DEVOLVE O QUE EXISTE no pedido: pedidos antigos, gravados
 *        antes do controle de estoque, não têm `produtoId` — sem ele não
 *        há como saber qual documento em "produtos" devolver, e devolver
 *        por nome poderia atingir o produto errado. Nesses casos a
 *        devolução é ignorada.
 *     2) DEVOLVE UMA VEZ SÓ: se um pedido trouxer o mesmo produto em duas
 *        linhas, a soma é agrupada por produto antes de devolver.
 *     3) NÃO HÁ COMO DEVOLVER DUAS VEZES: o pedido é lido antes de ser
 *        apagado, e a segunda chamada receberia 404 por não encontrá-lo
 *        mais. Por isso não é preciso nenhuma trava extra para Impedir
 *        que o estoque seja inflado.
 *
 * Observação de projeto: apagar um pedido não altera o faturamento já
 * exibido em outro lugar sem um novo carregamento da lista — por isso os
 * painéis atualizam o estado local da lista depois de excluir.
 */
export const deletarPedido = async (req, res) => {
  try {
    // Busca primeiro para poder ler os itens antes de apagar.
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido não encontrado" });

    // Agrupa os itens por produto, ignorando os que não têm produtoId.
    const porProduto = new Map();
    for (const item of pedido.itens || []) {
      if (!item.produtoId) continue; // pedido antigo: sem referência
      const chave = String(item.produtoId);
      porProduto.set(chave, { id: item.produtoId, qtd: (porProduto.get(chave)?.qtd || 0) + item.qtd });
    }

    await Pedido.findByIdAndDelete(req.params.id);

    // Devolve as unidades ao estoque de cada produto.
    for (const { id, qtd } of porProduto.values()) {
      const produto = await Produto.findById(id);
      if (!produto) continue; // produto não existe mais no catálogo
      // $inc soma a quantidade de volta direto no banco, em uma única
      // operação. Evita o padrão arriscado de "ler o valor, somar no
      // JavaScript e gravar", que perderia uma venda feita por outra pessoa
      // entre a leitura e a gravação.
      await Produto.updateOne({ _id: id }, { $inc: { estoque: qtd } });
    }

    res.status(200).json({ message: "Pedido removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar pedido", error: error.message });
  }
};
