/**
 * ============================================================================
 *  API  →  CONTROLLER DE PRODUTOS (coleção "produtos")
 * ============================================================================
 *  ---------------------------------------------------------------------------
 *  O QUE É UM CONTROLLER
 *  ---------------------------------------------------------------------------
 *    Função que atende uma requisição HTTP: recebe o `req`, conversa com o
 *    banco pelo model Mongoose `Produto`, valida as regras de negócio e
 *    devolve a resposta em JSON pelo `res`. É chamada pelas rotas de
 *    src/routes/produtoRoutes.js.
 *
 *  ---------------------------------------------------------------------------
 *  OS 4 ENDPOINTS (o "CRUD" completo: Create, Read, Update, Delete)
 *  ---------------------------------------------------------------------------
 *    GET    /api/produtos      → listarProdutos       (vitrine e painéis)
 *    GET    /api/produtos/:id  → buscarProdutoPorId   (tela de detalhe)
 *    POST   /api/produtos      → criarProduto         (painel do Gerente)
 *    PUT    /api/produtos/:id  → atualizarProduto     (editar / publicar)
 *    DELETE /api/produtos/:id  → deletarProduto       (excluir)
 *
 *  ---------------------------------------------------------------------------
 *  O FLUXO COMPLETO DE UMA ALTERAÇÃO FEITA PELO GERENTE
 *  ---------------------------------------------------------------------------
 *    1. GerenteScreen.jsx — o gerente preenche o formulário e clica em
 *       "Publicar no site" (ou "Salvar rascunho"). A tela monta o objeto do
 *       produto e chama o callback `onSalvar(dados, id)`.
 *    2. App.jsx — `aoSalvarProduto` decide entre POST (sem id = cadastro
 *       novo) e PUT (com id = edição) e chama o serviço.
 *    3. services/api.js — `createProduto` / `updateProduto` faz o fetch.
 *    4. produtoRoutes.js — a rota encaminha a requisição para este arquivo.
 *    5. ESTE CONTROLLER — valida e grava no MongoDB.
 *    6. App.jsx — `recarregarProdutos()` busca a lista de novo, e a
 *       vitrine passa a mostrar a alteração.
 *
 *  ---------------------------------------------------------------------------
 *  POR QUE ESTE CONTROLLER É MAIS SIMPLES QUE O DE USUÁRIOS
 *  ---------------------------------------------------------------------------
 *    Não há email, senha, perfil nem unicidade a tratar. Produto não tem
 *    identidade sensível: basta validar o que o próprio schema já exige
 *    (nome, tipo e preço são `required`) e gravar. Por isso o tratamento de
 *    erro aqui é mais curto — mas o `try/catch` continua obrigatório em
 *    todos os handlers, para que uma falha do banco vire uma resposta
 *    HTTP em vez de uma requisição pendurada.
 * ============================================================================
 */
import Produto from "../models/produto.js";

// ===========================================================================
// GET /api/produtos — retorna TODOS os produtos
// ===========================================================================
/**
 * PONTO IMPORTANTE PARA A DEFESA:
 *   Esta rota devolve TAMBÉM os rascunhos (publicado: false).
 *   Quem decide o que aparece na vitrine é o FRONTEND, em LojaScreen.jsx:
 *       const publicados = produtos.filter((p) => p.publicado);
 *   O motivo é simples: o painel do Gerente PRECISA enxergar os rascunhos
 *   para poder publicar e editar, e a API tem uma única rota para as duas
 *   finalidades. Separar isso exigiria uma segunda rota (ex.: ?publicados=true).
 */
export const listarProdutos = async (req, res) => {
  try {
    // Produto.find() sem filtro → todos os documentos da coleção
    const produtos = await Produto.find();
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar produtos", error: error.message });
  }
};

// ===========================================================================
// GET /api/produtos/:id — busca um produto pelo identificador
// ===========================================================================
/**
 * COMO FUNCIONA:
 *   req.params.id  → o trecho depois do "/" final na rota (o ":id");
 *   Produto.findById(id) → busca pelo _id (ObjectId do MongoDB);
 *   se não existir → 404 e `return` (evita tentar responder duas vezes);
 *   se existir → 200 com o documento.
 */
export const buscarProdutoPorId = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar produto", error: error.message });
  }
};

// ===========================================================================
// POST /api/produtos — cadastra um produto novo
// ===========================================================================
/**
 * CORPO ESPERADO (montado pelo GerenteScreen.jsx):
 *   { nome, descricao, tipo, preco, foto, fotos: [], estoque, publicado }
 *
 * POR QUE ESTE HANDLER É TÃO CURTO:
 *   A validação de verdade NÃO está aqui — está no schema (produto.js).
 *   O Mongoose já barra, antes de gravar:
 *     • nome vazio      → `nome: { required: true }`
 *     • preço ausente   → `preco: { required: true }`
 *     • categoria vazia → `tipo: { required: true }`
 *   Quando essa validação falha, ela lança uma exceção, e o `catch` abaixo
 *   a converte em HTTP 400 devolvendo `error.message` — que é a mensagem
 *   escrita pelo próprio Mongoose, que explica exatamente qual campo falhou.
 *  Ou seja: a regra está declarada UMA VEZ (no model) e vale para todos os
 *   caminhos de escrita no banco, inclusive o seed.
 *
 * `Produto.create(...)` atalho para `new Produto(...)` + `.save()`, e já
 * devolve o documento inserido.
 */
export const criarProduto = async (req, res) => {
  try {
    const novoProduto = await Produto.create(req.body);
    res.status(201).json(novoProduto); // 201 = Created
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar produto", error: error.message });
  }
};

// ===========================================================================
// PUT /api/produtos/:id — edita um produto existente
// ===========================================================================
/**
 * findByIdAndUpdate(atualiza) devolve o documento ANTES da alteração por
 * padrão. A opção `{ new: true }` inverte isso: faz devolver o estado já
 * atualizado. Sem essa opção, quem chamou receberia os dados velhos e
 * poderia exibir na tela uma informação que não é a que está no banco.
 *
 * A MESMA ROTA SERVE PARA TRÊS COISAS DIFERENTES, e o frontend decide o
 * que envia em cada caso:
 *   • EDIÇÃO completa  → o formulário inteiro (GerenteScreen "Editar");
 *   • PUBLICAR/REMOVER → só o campo `publicado` invertido
 *                        (App.jsx → `aoAlternarPublicacao`);
 *   • O PUT NÃO apaga campos ausentes do corpo: o Mongoose só altera o que
 *     for enviado, o resto do documento permanece como estava.
 */
export const atualizarProduto = async (req, res) => {
  try {
    const produtoAtualizado = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!produtoAtualizado) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json(produtoAtualizado);
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar produto", error: error.message });
  }
};

// ===========================================================================
// DELETE /api/produtos/:id — exclui o produto do banco
// ===========================================================================
/**
 * findByIdAndDelete() apaga em uma única operação e devolve o documento que
 * foi removido (ou null, se não existia) — daí o teste de 404.
 *
 * Na interface, a exclusão só chega aqui depois de uma confirmação do
 * gerente (window.confirm em GerenteScreen.jsx).
 */
export const deletarProduto = async (req, res) => {
  try {
    const produtoDeletado = await Produto.findByIdAndDelete(req.params.id);
    if (!produtoDeletado) return res.status(404).json({ message: "Produto não encontrado" });
    res.status(200).json({ message: "Produto removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar produto", error: error.message });
  }
};
