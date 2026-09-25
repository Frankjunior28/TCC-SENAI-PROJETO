/**
 * ============================================================================
 *  UI  →  ProductCard.jsx — CARD DE PRODUTO DA VITRINE
 * ============================================================================
 *  O QUE ESTE COMPONENTE FAZ:
 *    Desenha um card na grade da loja (LojaScreen) com:
 *      • foto do produto (FotoProduto, com placeholder se faltar);
 *      • categoria (`tipo`), nome e preço formatado;
 *      • selo "Em estoque" quando `estoque > 0`;
 *      • botão "Adicionar ao carrinho".
 *
 *  CLIQUES:
 *    • no card (ou Enter, por acessibilidade)      → `onAbrir(produto)`
 *      → App.jsx guarda o produto e muda a tela para "produto";
 *    • no botão "Adicionar"                        → `onAdicionar(produto)`.
 *      `e.stopPropagation()` impede que o clique no botão ABRA o card também.
 *
 *  ESTOQUE:
 *    Quando `estoque` é 0, o botão fica desabilitado e passa a dizer
 *    "Indisponível", e o selo do card mostra "Esgotado" — o cliente descobre
 *    a indisponibilidade na vitrine, e não só quando tenta comprar.
 * ============================================================================
 */
import { FotoProduto } from "./FotoProduto";
import { formatarPreco, MSG_ESTOQUE } from "../constants";

export function ProductCard({ produto, onAbrir, onAdicionar }) {
  const semEstoque = (Number(produto.estoque) || 0) < 1;

  return (
    <div
      className="card-produto"
      role="button"      // acessibilidade: anuncia que é um botão
      tabIndex={0}       // permite focar com Tab
      onClick={() => onAbrir(produto)}
      onKeyDown={(e) => e.key === "Enter" && onAbrir(produto)} // abre com Enter
    >
      <FotoProduto foto={produto.foto} alt={produto.nome} className="card-produto-img" altura={180} />

      <div className="card-produto-body">
        <span className="card-produto-tipo">{produto.tipo}</span>
        <span className="card-produto-nome">{produto.nome}</span>
        <span className="card-produto-preco">{formatarPreco(produto.preco)}</span>
        {semEstoque ? (
          // Produto esgotado: o aviso fica visível já na vitrine, para o
          // cliente não descobrir a indisponibilidade só no carrinho.
          <span className="card-produto-estoque sem-estoque">Esgotado</span>
        ) : (
          produto.estoque <= 5 && (
            <span className="card-produto-estoque">Últimas {produto.estoque} unidades</span>
          )
        )}
      </div>

      <div className="card-produto-acoes">
        <button
          type="button"
          className="btn btn-contorno btn-card"
          // Desabilitado quando não há estoque. Mesmo desabilitado, o
          // App.jsx continua conferindo o limite — a validação da interface
          // é conveniência, e a do servidor é a que realmente protege.
          disabled={semEstoque}
          title={
            semEstoque
              ? `${MSG_ESTOQUE}: não há unidades disponíveis deste produto.`
              : "Adicionar ao carrinho"
          }
          onClick={(e) => {
            e.stopPropagation(); // não deixa o clique abrir o card
            onAdicionar(produto);
          }}
        >
          {semEstoque ? "Indisponível" : "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  );
}
