/**
 * ============================================================================
 *  UI  →  GerenteScreen.jsx — PAINEL DO GERENTE (2 abas)
 * ============================================================================
 *  ACESSO: só quem loga com `perfil: "gerente"` (App.jsx muda a view para
 *    "gerente"; a conta foi lida da coleção "gerentes" do banco).
 *
 *  ABA "📦 PRODUTOS" (CRUD completo):
 *    • Formulário cadastra/edita produto (nome, até 3 fotos por URL,
 *      categoria, preço, estoque, descrição);
 *    • "Salvar rascunho"  → grava com publicado: false (não aparece na loja);
 *    • "Publicar no site" → grava com publicado: true;
 *    • Na lista: Editar (preenche o form), Publicar/Remover (alterna
 *      `publicado`) e Excluir (com confirmação).
 *    • Tudo passa pelo App.jsx (onSalvar/onExcluir/onAlternar) → services/api.js
 *      → POST/PUT/DELETE /api/produtos → MongoDB → recarregarProdutos().
 *    • Modo offline: as alterações ficam só em memória (aviso no topo).
 *
 *  ABA "💰 VENDAS":
 *    • Carrega os pedidos (GET /api/pedidos) ao abrir a aba;
 *    • Mostra data, itens, total e status de cada venda;
 *    • "✅ Entregar" → PUT /api/pedidos/:id { status: "entregue" };
 *    • "Excluir"     → DELETE /api/pedidos/:id (com confirmação).
 *
 *  ESTADOS LOCAIS: aba (produtos|vendas), pedidos (null = carregando),
 *    form (campos do produto), editandoId (id do produto em edição).
 * ============================================================================
 */
import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FotoProduto } from "./FotoProduto";
import { CATEGORIAS, formatarPreco } from "../constants";
import * as api from "../services/api";

export function GerenteScreen({ usuario, produtos, onSalvar, onExcluir, onAlternar, onVerLoja, onSair, offline, onTrocarConta }) {
  const [aba, setAba] = useState("produtos"); // aba ativa
  const [pedidos, setPedidos] = useState(null); // null = ainda carregando
  // Formulário de produto (strings, convertidas ao salvar)
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "",
    preco: "",
    foto1: "",
    foto2: "",
    foto3: "",
    estoque: "",
  });
  const [editandoId, setEditandoId] = useState(null); // id em edição (null = criando)

  /** Atualiza o campo digitado no formulário. */
  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fotosPrevias = [form.foto1, form.foto2, form.foto3].filter((foto) => foto.trim());

  /** Limpa o formulário e sai do modo edição. */
  const limparForm = () => {
    setForm({ nome: "", descricao: "", tipo: "", preco: "", foto1: "", foto2: "", foto3: "", estoque: "" });
    setEditandoId(null);
  };

  /** Preenche o formulário com os dados de um produto existente (Editar). */
  const preencher = (produto) => {
    // Usa a galeria (fotos[]) ou, na falta, a foto principal
    const fotos = (produto.fotos && produto.fotos.length > 0)
      ? produto.fotos
      : produto.foto
        ? [produto.foto]
        : [];
    setEditandoId(produto.id);
    setForm({
      nome: produto.nome || "",
      descricao: produto.descricao || "",
      tipo: produto.tipo || "",
      preco: String(produto.preco || ""),
      foto1: fotos[0] || "",
      foto2: fotos[1] || "",
      foto3: fotos[2] || "",
      estoque: String(produto.estoque || ""),
    });
  };

  /**
   * Monta o objeto do produto e envia para o App.jsx salvar.
   * `publicar` define o campo `publicado` (true = visível na loja).
   */
  const salvar = (publicar) => {
    if (!form.nome.trim() || !form.tipo || !form.preco) {
      alert("Preencha nome, tipo e preço do produto.");
      return;
    }
    // Só as fotos preenchidas, no máximo 3, na ordem digitada
    const fotos = [form.foto1, form.foto2, form.foto3]
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 3);
    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      preco: Number(form.preco),
      foto: fotos[0] || "", // primeira foto = principal
      fotos,
      estoque: Number(form.estoque) || 0,
      publicado: publicar,
    };
    onSalvar(dados, editandoId); // editandoId presente → PUT; senão → POST
    limparForm();
  };

  /** Exclui produto (com confirmação) e limpa o form se era ele que estava em edição. */
  const excluir = (id, nome) => {
    if (window.confirm(`Excluir o produto "${nome}"?`)) {
      onExcluir(id);
      if (id === editandoId) limparForm();
    }
  };

  // Carrega os pedidos quando a aba "vendas" é aberta (e não está offline)
  useEffect(() => {
    if (aba !== "vendas" || offline) return;
    api
      .listarPedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, [aba, offline]); // roda de novo se a aba/offline mudar

  /** Marca o pedido como entregue (PUT /api/pedidos/:id). */
  const marcarEntregue = async (id) => {
    try {
      await api.atualizarStatusPedido(id, "entregue");
      // Atualiza a lista na tela sem precisar recarregar tudo
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, status: "entregue" } : p)));
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "atualizar o pedido"));
    }
  };

  /** Exclui um pedido (DELETE /api/pedidos/:id) após confirmação. */
  const excluirPedido = async (id) => {
    if (!window.confirm("Excluir este pedido?")) return;
    try {
      await api.excluirPedido(id);
      setPedidos((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "excluir o pedido"));
    }
  };

  return (
    <div className="page">
      <Header
        usuario={usuario}
        onSair={onSair}
        onTrocarConta={onTrocarConta}
        extra={
          // Botão extra do cabeçalho: volta para a vitrine
          <button type="button" onClick={onVerLoja} className="btn btn-escuro">
            Acessar loja
          </button>
        }
      />

      <main className="shell">
        {offline && (
          <div className="aviso-sistema">
            Modo off-line — as alterações desta sessão ficam somente no navegador.
          </div>
        )}

        <h1 className="titulo-pagina">Painel do Gerente</h1>

        {/* Abas: produtos | vendas */}
        <div className="tabs-gerente">
          <button
            type="button"
            className={`tab-gerente ${aba === "produtos" ? "tab-gerente-ativo" : ""}`}
            onClick={() => setAba("produtos")}
          >
            Produtos
          </button>
          <button
            type="button"
            className={`tab-gerente ${aba === "vendas" ? "tab-gerente-ativo" : ""}`}
            onClick={() => setAba("vendas")}
          >
            Vendas ({pedidos?.length ?? 0})
          </button>
        </div>

        {aba === "produtos" ? (
          <>
            {/* ---------------- FORMULÁRIO DE PRODUTO ---------------- */}
            <div className="form-produto">
          <h3 className="form-titulo">{editandoId ? "Editar produto" : "Cadastrar produto"}</h3>

          <div className="campo-form">
            <label>Nome *</label>
            <input name="nome" placeholder="Ex: Sofá Retrátil" value={form.nome} onChange={handleForm} className="input" />
          </div>

          <div className="campo-form">
            <label>Foto principal (URL)</label>
            <input name="foto1" type="url" placeholder="https://... (imagem principal)" value={form.foto1} onChange={handleForm} className="input" />
          </div>

          <div className="campo-form">
            <label>Foto adicional 2 (URL)</label>
            <input name="foto2" type="url" placeholder="https://..." value={form.foto2} onChange={handleForm} className="input" />
          </div>

          <div className="campo-form">
            <label>Foto adicional 3 (URL)</label>
            <input name="foto3" type="url" placeholder="https://..." value={form.foto3} onChange={handleForm} className="input" />
          </div>

          <div className="previa-midia">
            <span>Prévia das imagens</span>
            {fotosPrevias.length > 0 ? (
              <div className="previa-midia-grade">
                {fotosPrevias.map((foto, indice) => (
                  <FotoProduto key={`${foto}-${indice}`} foto={foto} alt={`Prévia ${indice + 1}`} altura={92} />
                ))}
              </div>
            ) : (
              <small>As URLs preenchidas aparecerão aqui.</small>
            )}
          </div>

          <div className="campo-form">
            <label>Categoria *</label>
            <select name="tipo" value={form.tipo} onChange={handleForm} className="select">
              <option value="">Selecione</option>
              {CATEGORIAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-form">
            <label>Preço (R$) *</label>
            <input name="preco" type="number" min="0" step="0.01" placeholder="0.00" value={form.preco} onChange={handleForm} className="input" />
          </div>

          <div className="campo-form">
            <label>Estoque</label>
            <input name="estoque" type="number" min="0" placeholder="0" value={form.estoque} onChange={handleForm} className="input" />
          </div>

          <div className="campo-form">
            <label>Descrição</label>
            <input name="descricao" placeholder="Descrição do produto" value={form.descricao} onChange={handleForm} className="input" />
          </div>

          <div className="form-acoes">
            <button type="button" onClick={() => salvar(false)} className="btn btn-secundario">
              Salvar rascunho
            </button>
            <button type="button" onClick={() => salvar(true)} className="btn btn-primario">
              Publicar no site
            </button>
            {editandoId && (
              <button type="button" onClick={limparForm} className="btn btn-secundario">
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        {/* ---------------- LISTA DE PRODUTOS ---------------- */}
        <h2 className="secao-titulo">Produtos cadastrados ({produtos.length})</h2>

        <div className="lista-produtos">
          {produtos.length === 0 ? (
            <div className="vazio">Nenhum produto cadastrado.</div>
          ) : (
            produtos.map((produto) => (
              <div key={produto.id} className="linha-produto">
                <FotoProduto foto={produto.foto} alt={produto.nome} largura={52} altura={52} />
                <div className="linha-produto-info">
                  <span className="linha-produto-nome">{produto.nome}</span>
                  <span className="linha-produto-meta">
                    {produto.tipo} — {formatarPreco(produto.preco)}
                    {/* Badge: Publicado (aparece na loja) ou Rascunho */}
                    <span className={`badge ${produto.publicado ? "badge-publicado" : "badge-rascunho"}`}>
                      {produto.publicado ? "Publicado" : "Rascunho"}
                    </span>
                  </span>
                </div>
                <div className="linha-produto-acoes">
                  <button type="button" onClick={() => preencher(produto)} className="btn btn-secundario" style={{ fontSize: 12 }}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlternar(produto)}
                    className="btn btn-secundario"
                    style={{ fontSize: 12 }}
                  >
                    {produto.publicado ? "Remover" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(produto.id, produto.nome)}
                    className="btn btn-perigo"
                    style={{ fontSize: 12 }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </>
        ) : (
          /* ---------------- ABA VENDAS ---------------- */
          <div className="lista-vendas">
            {offline ? (
              <div className="vazio">Modo off-line: as vendas ficam indisponíveis sem o banco de dados.</div>
            ) : pedidos === null ? (
              <div className="estado">Carregando vendas...</div>
            ) : pedidos.length === 0 ? (
              <div className="vazio">
                <p>Nenhuma venda registrada ainda.</p>
              </div>
            ) : (
              pedidos.map((pedido) => (
                <div key={pedido._id} className="linha-produto">
                  <div className="linha-produto-info">
                    <span className="linha-produto-nome">
                      {pedido.cliente?.nome} — {formatarPreco(pedido.total)}
                    </span>
                    <span className="linha-produto-meta">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                      {pedido.itens.length} item(ns) · {pedido.itens.map((i) => i.produto).join(", ")}
                      <span
                        className={`badge ${pedido.status === "entregue" ? "badge-publicado" : pedido.status === "cancelado" ? "badge-rascunho" : "badge-pendente"}`}
                      >
                        {pedido.status === "entregue"
                          ? "Entregue"
                          : pedido.status === "cancelado"
                            ? "Cancelado"
                            : "Pendente"}
                      </span>
                    </span>
                  </div>
                  <div className="linha-produto-acoes">
                    {pedido.status !== "entregue" && (
                      <button
                        type="button"
                        onClick={() => marcarEntregue(pedido._id)}
                        className="btn btn-secundario"
                        style={{ fontSize: 12 }}
                      >
                        ✅ Entregar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => excluirPedido(pedido._id)}
                      className="btn btn-perigo"
                      style={{ fontSize: 12 }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
