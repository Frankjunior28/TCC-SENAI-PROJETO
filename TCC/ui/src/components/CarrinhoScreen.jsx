/**
 * ============================================================================
 *  UI  →  CarrinhoScreen.jsx — CARRINHO E CHECKOUT (finalizar compra)
 * ============================================================================
 *  O QUE ESTA TELA FAZ:
 *    • Lista os itens do carrinho (estado que mora no App.jsx e é salvo no
 *      localStorage com a chave "tccCarrinho");
 *    • Permite alterar a quantidade (+/−, some o item se chegar a 0) e
 *      remover item;
 *    • Calcula o TOTAL (preço × quantidade de cada item);
 *    • "Finalizar compra" → cria o pedido no banco.
 *
 *  FLUXO DO CHECKOUT (finalizarCompra):
 *    0. PRIMEIRO é conferido o estoque no próprio carrinho: se algum item
 *       estiver acima do estoque atual, a compra é barrada aqui, com a
 *       mensagem "Limite de estoque atingido", e nada é enviado;
 *    1. modo offline → só limpa o carrinho local e avisa (nada é salvo);
 *    2. online → POST /api/pedidos (services/api.js → criarPedido) com:
 *         cliente: { nome, email }  ← vêm do usuário logado;
 *         itens[]: { produto, produtoId, preco, qtd } ← do carrinho;
 *         total:   soma calculada;
 *       O BACKEND refaz a conferência de estoque (é ele a autoridade),
 *       grava o pedido com `status: "pendente"` e dá baixa nas unidades;
 *    3. sucesso → esvazia o carrinho e mostra alerta de confirmação;
 *    4. erro    → exibe a mensagem em `.aviso-erro` (o carrinho é mantido).
 *
 *  ---------------------------------------------------------------------------
 *  CONTROLE DE ESTOQUE (como o limite é respeitado aqui na tela)
 *  ---------------------------------------------------------------------------
 *    A regra vale em três momentos, e é sempre o MESMO número de estoque
 *    que é usado nos três (o valor atual, consultado em `produtos`):
 *      1. no botão "+" da quantidade — ao chegar no limite, ele para de
 *         somar e mostra o aviso;
 *      2. no "Finalizar compra" — se algum item estiver acima do estoque
 *         (o carrinho ficou aberto e o estoque mudou), a compra nem chega
 *         a ser enviada;
 *      3. no servidor — valida de novo, porque a interface pode ser
 *         contornada chamando a API direto (Postman, console).
 *    A validação do item 3 é a que vale; as dos itens 1 e 2 existem para
 *    dar um retorno imediato e amigável, sem ida e volta ao banco.
 * ============================================================================
 */
import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FotoProduto } from "./FotoProduto";
import { formatarPreco, MSG_ESTOQUE } from "../constants";
import * as api from "../services/api";

export function CarrinhoScreen({ usuario, carrinho, setCarrinho, produtos = [], onPedidoCriado, onVoltar, onVoltarPainel, onSair, onTrocarConta, offline }) {
  const [salvando, setSalvando] = useState(false); // evita cliques duplos no checkout
  const [erroPedido, setErroPedido] = useState(""); // erro da criação do pedido
  const [avisoEstoque, setAvisoEstoque] = useState(""); // aviso de limite de estoque

  /**
   * Estoque REAL de um item do carrinho, neste momento.
   *
   * Por que consultar o catálogo e não usar o "estoque" que foi salvo junto
   * do item: o carrinho vive no localStorage e pode ficar aberto horas.
   * Nesse intervalo, outro cliente pode ter comprado as últimas unidades,
   * ou o gerente pode ter reposto o estoque. Consultar a lista de produtos
   * sempre atualizada evita trabalhar com um número velho.
   * Se o produto tiver sumido do catálogo, o estoque passa a ser 0 — ou
   * seja, ele aparece como indisponível e precisa ser removido.
   */
  const estoqueAtual = (item) => {
    const produto = produtos.find((p) => String(p.id) === String(item.id));
    if (!produto) return 0; // saiu do catálogo
    return Number(produto.estoque) || 0;
  };

  /**
   * AUMENTA OU DIMINUI A QUANTIDADE DE UM ITEM.
   *
   * O botão "+" só deixa passar enquanto a quantidade for MENOR que o
   * estoque. Passando do limite, a quantidade não muda e o cliente recebe
   * o aviso "Limite de estoque atingido", em vez de um número que o
   * servidor recusaria no checkout.
   *
   * O botão "−" continua livre até chegar a zero, e nesse caso o item sai
   * do carrinho (comportamento original, mantido).
   */
  const alterarQtd = (id, delta) => {
    // Procura o item ANTES de atualizar o estado.
    // Fazer a checagem aqui (e não dentro da função passada a
    // setCarrinho) é importante: dentro dela só se pode modificar o estado
    // do carrinho. Chamar setAvisoEstoque ali dentro seria um efeito
    // colateral dentro de um atualizador de estado, algo que o React pode
    // executar mais de uma vez (StrictMode) e que atrapalha o React Hook
    // de regras de lint.
    const item = carrinho.find((i) => String(i.id) === String(id));
    if (!item) return;

    // Subindo (+1): respeita o limite de estoque.
    const disponivel = estoqueAtual(item);
    if (delta > 0 && item.qtd + delta > disponivel) {
      setAvisoEstoque(
        `${MSG_ESTOQUE}: só há ${disponivel} unidade(s) em estoque de "${item.nome}".`
      );
      return; // a quantidade NÃO muda
    }

    setAvisoEstoque("");
    setCarrinho((prev) =>
      prev
        .map((i) => (String(i.id) === String(id) ? { ...i, qtd: i.qtd + delta } : i))
        .filter((i) => i.qtd > 0) // item que caiu a zero é removido
    );
  };

  /** Remove o item do carrinho. */
  const remover = (id) => {
    setAvisoEstoque("");
    setCarrinho((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  /**
   * AVISO ANTES DE FINALIZAR: algum item do carrinho ficou acima do estoque
   * que existe agora. Isso acontece quando o carrinho ficou aberto tempo
   * demais e outro cliente comprou as unidades restantes.
   * Exemplo: o carrinho tem 12 camas, mas o estoque atual é 8.
   * Detectado aqui para dar uma mensagem clara ANTES de chamar a API —
   * o servidor recusaria do mesmo jeito, mas o aviso chega mais rápido e
   * mais direto, e o carrinho é mantido para o cliente corrigir.
   */
  const itemAcimaDoEstoque = carrinho.find((item) => item.qtd > estoqueAtual(item));

  // Total da compra: soma de (preço × quantidade)
  const total = carrinho.reduce((soma, item) => soma + item.preco * item.qtd, 0);

  /** Finaliza a compra: grava o pedido no MongoDB (ou só local se offline). */
  const finalizarCompra = async () => {
    // Barrar no cliente quando já é possível saber que vai falhar.
    if (itemAcimaDoEstoque) {
      setErroPedido(
        `${MSG_ESTOQUE}: você pediu ${itemAcimaDoEstoque.qtd} unidade(s) de "${itemAcimaDoEstoque.nome}", ` +
          `mas há apenas ${estoqueAtual(itemAcimaDoEstoque)} em estoque. Reduza a quantidade para continuar.`
      );
      return;
    }

    if (offline) {
      setCarrinho([]);
      alert("Compra finalizada com sucesso! Obrigado pela preferência.");
      return;
    }
    setSalvando(true);
    setErroPedido("");
    try {
      await api.criarPedido({
        cliente: {
          nome: usuario?.nome || "Cliente",
          email: usuario?.email || "",
        },
        itens: carrinho.map((item) => ({
          produto: item.nome,
          // Enviado para o backend localizar o documento exato em
          // "produtos" e conferir/baixar o estoque.
          produtoId: item.id,
          preco: item.preco,
          qtd: item.qtd,
        })),
        total,
      });
      setCarrinho([]); // esvazia só depois de salvar no banco
      // O servidor deu baixa no estoque. Pedir os produtos de novo faz a
      // vitrine e a tela de detalhe passarem a mostrar o número novo — sem
      // isso, o cliente voltaria à loja e veria o estoque antigo, e poderia
      // tentar comprar de novo algo que já acabou.
      onPedidoCriado?.();
      alert("Compra finalizada com sucesso! Seu pedido foi registrado.");
    } catch (err) {
      // O servidor é a autoridade do estoque. Se ele recusar, a mensagem
      // dele aparece aqui (o texto já vem em português, pelo
      // `mensagemClaraDeErro`), e o carrinho é mantido para o cliente
      // tentar de novo com uma quantidade menor.
      setErroPedido(api.mensagemClaraDeErro(err, "registrar o pedido"));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="page">
      <Header
        usuario={usuario}
        onVoltarPainel={onVoltarPainel}
        onSair={onSair}
        onTrocarConta={onTrocarConta}
      />
      <main className="shell">
        <button type="button" onClick={onVoltar} className="btn btn-secundario" style={{ marginBottom: 20 }}>
          ← Continuar comprando
        </button>

        <h1 className="titulo-pagina">Carrinho de compras</h1>

        {carrinho.length === 0 ? (
          /* ---------- Estado vazio ---------- */
          <div className="vazio">
            <p>Seu carrinho está vazio.</p>
            <button type="button" onClick={onVoltar} className="btn btn-primario" style={{ marginTop: 12 }}>
              Ver produtos
            </button>
          </div>
        ) : (
          <>
            {/* ---------- Itens do carrinho ---------- */}
            <div className="lista-carrinho">
              {carrinho.map((item) => {
                // Estoque vigente e o quanto ainda cabe no carrinho.
                const disponivel = estoqueAtual(item);
                const noLimite = item.qtd >= disponivel;
                const semEstoque = disponivel < 1;

                return (
                  <div key={item.id} className="item-carrinho">
                    <FotoProduto foto={item.foto} alt={item.nome} largura={64} altura={64} />
                    <div className="item-carrinho-info">
                      <span className="item-carrinho-nome">{item.nome}</span>
                      <span className="item-carrinho-preco">{formatarPreco(item.preco)}</span>
                      {/* Mostra o estoque real. Quando a quantidade no
                          carrinho bate com ele, o cliente entende na hora
                          por que não consegue aumentar mais. */}
                      <small className={`item-carrinho-estoque${noLimite ? " no-limite" : ""}`}>
                        {semEstoque
                          ? "Indisponível no momento"
                          : `${disponivel} unidade(s) em estoque${noLimite ? " · limite atingido" : ""}`}
                      </small>
                    </div>
                    {/* Controle de quantidade: − some / + soma / remove ao zerar.
                        O "+" fica desabilitado ao chegar no limite do estoque;
                        se ainda for clicado, alterarQtd mostra o aviso. */}
                    <div className="controle-qtd">
                      <button type="button" onClick={() => alterarQtd(item.id, -1)}>−</button>
                      <span className="qtd">{item.qtd}</span>
                      <button
                        type="button"
                        onClick={() => alterarQtd(item.id, 1)}
                        disabled={noLimite}
                        title={
                          noLimite
                            ? `${MSG_ESTOQUE}: há apenas ${disponivel} unidade(s) em estoque.`
                            : "Adicionar mais uma unidade"
                        }
                      >
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => remover(item.id)} className="btn btn-perigo">
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ---------- Total + ações ---------- */}
            <div className="rodape-carrinho">
              <strong className="total-carrinho">
                Total: <span>{formatarPreco(total)}</span>
              </strong>
              <div className="acoes-carrinho">
                <button type="button" onClick={onVoltar} className="btn btn-secundario">
                  Continuar comprando
                </button>
                <button
                  type="button"
                  onClick={finalizarCompra}
                  disabled={salvando || Boolean(itemAcimaDoEstoque)}
                  title={
                    itemAcimaDoEstoque
                      ? `${MSG_ESTOQUE}: reduza a quantidade de "${itemAcimaDoEstoque.nome}".`
                      : "Confirmar o pedido e dar baixa no estoque"
                  }
                  className="btn btn-primario btn-grande"
                >
                  {salvando ? "Finalizando..." : "Finalizar compra"}
                </button>
              </div>
            </div>

            {/* Aviso de limite de estoque ao tentar aumentar a quantidade.
                Aparece logo abaixo da lista, perto de onde o cliente
                estava clicando, e some assim que a quantidade é corrigida. */}
            {avisoEstoque && (
              <p className="aviso-erro" style={{ marginTop: 12 }}>
                {avisoEstoque}
              </p>
            )}

            {/* Erro do checkout (o carrinho é mantido para tentar de novo) */}
            {erroPedido && (
              <p className="aviso-erro" style={{ marginTop: 12 }}>
                {erroPedido}
              </p>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
