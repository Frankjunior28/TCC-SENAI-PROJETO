/**
 * ============================================================================
 *  UI  →  ProdutoScreen.jsx — DETALHE DO PRODUTO
 * ============================================================================
 *  O QUE ESTA TELA FAZ:
 *    Abre quando o usuário clica em um card da vitrine (o produto chega pela
 *    prop `produto`, guardada no estado do App.jsx) e mostra:
 *
 *    • Galeria: imagem grande + miniaturas clicáveis (`galeria` vem do campo
 *      `fotos[]` do banco; se não houver, usa `foto`; se não houver nenhuma,
 *      o componente FotoProduto mostra um placeholder 🛋️);
 *    • Categoria (`tipo`), nome, preço formatado e aviso de estoque;
 *    • Descrição;
 *    • Botões de ação:
 *        - "Comprar agora"       → adiciona ao carrinho e vai para o carrinho;
 *        - "Adicionar ao carrinho" → só adiciona (continua na página);
 *        - "← Voltar à loja"     → volta para a vitrine.
 *
 *  ESTADO LOCAL: `imgIdx` — qual das miniaturas está sendo exibida.
 * ============================================================================
 */
import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FotoProduto } from "./FotoProduto";
import { formatarPreco, MSG_ESTOQUE } from "../constants";

export function ProdutoScreen({
  usuario,
  produto,
  onComprar,
  onAdicionar,
  onVoltar,
  onEntrar,
  onVoltarPainel,
  onSair,
  onTrocarConta,
}) {
  const [imgIdx, setImgIdx] = useState(0); // índice da imagem selecionada

  // Sem produto selecionado (ex.: acesso direto à URL) → estado vazio
  if (!produto) {
    return (
      <div className="page">
        <Header
          usuario={usuario}
          onEntrar={onEntrar}
          onVoltarPainel={onVoltarPainel}
          onSair={onSair}
          onTrocarConta={onTrocarConta}
        />
        <main className="shell">
          <div className="vazio">Produto não encontrado.</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Monta a galeria: fotos[] → foto → [] (placeholder)
  const galeria = (produto.fotos && produto.fotos.length > 0)
    ? produto.fotos
    : produto.foto
      ? [produto.foto]
      : [];

  const imagemPrincipal = galeria[imgIdx] || galeria[0] || "";

  // Estoque zerado desabilita as ações de compra na tela de detalhe.
  const semEstoque = (Number(produto.estoque) || 0) < 1;

  return (
    <div className="page">
      <Header
        usuario={usuario}
        onEntrar={onEntrar}
        onVoltarPainel={onVoltarPainel}
        onSair={onSair}
        onTrocarConta={onTrocarConta}
      />
      <main className="shell">
        <button type="button" onClick={onVoltar} className="btn btn-secundario" style={{ marginBottom: 20 }}>
          ← Voltar à loja
        </button>

        <div className="detalhe">
          <div className="detalhe-img-col">
            {/* Imagem principal (FotoProduto tem fallback automático) */}
            <FotoProduto foto={imagemPrincipal} alt={produto.nome} className="detalhe-img" altura={340} />

            {/* Miniaturas: só aparecem se houver mais de uma foto */}
            {galeria.length > 1 && (
              <div className="galeria-miniaturas">
                {galeria.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`miniatura ${i === imgIdx ? "miniatura-ativa" : ""}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <FotoProduto
                      foto={img}
                      alt={`${produto.nome}, imagem ${i + 1}`}
                      className="miniatura-img"
                      largura="100%"
                      altura="100%"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detalhe-info">
            <span className="detalhe-tipo">{produto.tipo}</span>
            <h2 className="detalhe-nome">{produto.nome}</h2>
            <span className="detalhe-preco">{formatarPreco(produto.preco)}</span>
            {/* Estoque real. Sem estoque, os botões de compra ficam
                desabilitados e o cliente é avisado antes de tentar. */}
            {semEstoque ? (
              <span className="detalhe-estoque sem-estoque">✕ Produto esgotado</span>
            ) : (
              <span className="detalhe-estoque">
                ✓ {produto.estoque} unidade(s) em estoque
                {produto.estoque <= 5 && " — últimas unidades!"}
              </span>
            )}
            <p className="detalhe-descricao">{produto.descricao}</p>

            {!usuario && (
              <p className="detalhe-aviso">
                Navegue livremente. Para comprar ou guardar itens, entre ou crie sua conta.
              </p>
            )}

            <div className="detalhe-acoes">
              <button
                type="button"
                onClick={onComprar}
                disabled={semEstoque}
                className="btn btn-primario btn-grande"
                title={semEstoque ? `${MSG_ESTOQUE}: produto sem unidades disponíveis.` : "Comprar agora"}
              >
                {semEstoque ? "Indisponível" : "Comprar agora"}
              </button>
              <button
                type="button"
                onClick={onAdicionar}
                disabled={semEstoque}
                className="btn btn-contorno btn-grande"
                title={semEstoque ? `${MSG_ESTOQUE}: produto sem unidades disponíveis.` : "Adicionar ao carrinho"}
              >
                {semEstoque ? "Indisponível" : "Adicionar ao carrinho"}
              </button>
            </div>
            {semEstoque && (
              <p className="detalhe-aviso">
                {MSG_ESTOQUE}: todas as unidades deste produto foram vendidas.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
