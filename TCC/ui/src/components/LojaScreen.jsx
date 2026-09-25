/**
 * ============================================================================
 *  UI  →  LojaScreen.jsx — VITRINE DA LOJA (tela inicial pós-login)
 * ============================================================================
 *  O QUE ESTA TELA FAZ:
 *    • Mostra o cabeçalho (Header) com o usuário logado e o botão do carrinho;
 *    • Apresenta o banner "hero" com a contagem de produtos disponíveis;
 *    • Renderiza os FILTROS: busca por nome + chips de categoria (CATEGORIAS);
 *    • Lista os produtos em grade usando <ProductCard>.
 *
 *  FILTRO E BUSCA (tudo local, sem chamada ao banco):
 *    1. `publicados` → só produtos com `publicado: true` (rascunhos ficam de fora);
 *    2. `visiveis`   → aplica o filtro de categoria ("Todos" = sem filtro)
 *                       e a busca por nome (ignora maiúsculas/minúsculas).
 *
 *  DADOS VÊM DO PAI (App.jsx): `produtos` já está carregado (MongoDB ou
 *    PRODUTOS_FALLBACK). Se `offline` for true, exibe o aviso de modo
 *    demonstração; se `carregando`, mostra "Carregando produtos...".
 * ============================================================================
 */
import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ProductCard } from "./ProductCard";
import { CATEGORIAS } from "../constants";

export function LojaScreen({
  usuario,
  produtos,
  carrinho,
  onAbrirProduto,
  onAbrirCarrinho,
  onAdicionarCarrinho,
  onEntrar,
  onVoltarPainel,
  onIrParaLoja,
  onSair,
  offline,
  carregando,
  onTrocarConta,
}) {
  const [filtro, setFiltro] = useState("Todos"); // categoria selecionada
  const [busca, setBusca] = useState("");        // texto digitado na busca

  const publicados = produtos.filter((p) => p.publicado); // rascunhos ficam de fora
  const totalItens = carrinho.reduce((soma, item) => soma + item.qtd, 0); // badge do carrinho

  // Aplica categoria + busca (dois filtros em cascata)
  const visiveis = publicados.filter((p) => {
    const okCat = filtro === "Todos" || p.tipo === filtro;
    const okBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return okCat && okBusca;
  });

  return (
    <div className="page">
      <Header
        usuario={usuario}
        onCarrinho={onAbrirCarrinho}
        itensCarrinho={totalItens}
        onEntrar={onEntrar}
        onVoltarPainel={onVoltarPainel}
        onIrParaLoja={onIrParaLoja}
        onSair={onSair}
        onTrocarConta={onTrocarConta}
      />

      <main className="shell">
        {/* Aviso de modo demonstração (API/banco indisponível) */}
        {offline && (
          <div className="aviso-sistema">
            Modo demonstração — o banco de dados está temporariamente indisponível.
          </div>
        )}

        {/* Banner principal + número de produtos publicados */}
        <section className="hero">
          <div className="hero-conteudo">
            <span className="hero-kicker">Casa Aconchego · Coleção 2026</span>
            <h1>Design que transforma ambientes.</h1>
            <p>
              Peças selecionadas para unir conforto, materiais nobres e elegância em cada
              detalhe da sua casa.
            </p>
            <a href="#catalogo" className="hero-acao">
              Explorar catálogo
            </a>
          </div>
          <div className="hero-badge">
            <strong>{publicados.length}</strong>
            <small>peças selecionadas</small>
          </div>
        </section>

        {/* Busca por nome + chips de categoria */}
        <div className="filtros" id="catalogo">
          <div className="busca">
            <input
              type="text"
              placeholder="Buscar móvel..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input"
            />
            <span className="busca-icone" aria-hidden="true">⌕</span>
          </div>

          <button
            type="button"
            className={`chip ${filtro === "Todos" ? "chip-ativo" : ""}`}
            onClick={() => setFiltro("Todos")}
          >
            Todos
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${filtro === cat ? "chip-ativo" : ""}`}
              onClick={() => setFiltro(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grade de produtos (loading → estados vazios → cards) */}
        <div className="grade">
          {carregando ? (
            <div className="estado">Carregando produtos...</div>
          ) : visiveis.length === 0 ? (
            <div className="vazio">Nenhum produto encontrado.</div>
          ) : (
            visiveis.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onAbrir={onAbrirProduto}
                onAdicionar={onAdicionarCarrinho}
              />
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
