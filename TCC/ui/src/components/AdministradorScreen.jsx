/**
 * ============================================================================
 *  UI  →  AdministradorScreen.jsx — PAINEL MASTER (3 abas + cards de stats)
 * ============================================================================
 *  ACESSO: só quem loga com `perfil: "administrador"` (conta lida da
 *    coleção "administradores" do banco; App.jsx abre esta tela).
 *
 *  CARDS DE STATS (topo) — calculados na hora a partir dos pedidos:
 *    faturamento (soma dos totais), nº de pedidos, entregues, pendentes,
 *    nº de gerentes e sistemas integrados.
 *
 *  ABA "💰 Dados financeiros":
 *    • Lista todos os pedidos (GET /api/pedidos) com cliente, valor, data,
 *      itens e badge de status (somente leitura neste painel).
 *
 *  ABA "👥 Contas de gerentes" (CRUD de gerentes):
 *    • Formulário cria conta → POST /api/gerentes (services/api.js) →
 *      grava NA COLEÇÃO "gerentes" com perfil "gerente" → esse gerente já
 *      consegue entrar no site com email + senha;
 *    • Lista → GET /api/gerentes (mostra nome, email e cargo, SEM senha);
 *    • "Excluir conta" → DELETE /api/gerentes/:id (com confirmação).
 *
 *  ABA "⚙️ Configurações e integrações":
 *    • 6 itens definidos na constante CONFIGURACOES (3 técnicas + 3 integrações);
 *    • Os toggles usam o estado local `configs` — ALTERAÇÕES NÃO PERSISTEM
 *      (reiniciou a página, voltam ao normal): não existe model/endpoint para
 *      isso ainda (pendência conhecida do projeto).
 *
 *  ESTADOS LOCAIS: aba, pedidos, gerentes, carregando*, configs e formGerente.
 * ============================================================================
 */
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { formatarPreco } from "../constants";
import * as api from "../services/api";

/** Catálogo das configurações/integrações exibidas na 3ª aba. */
const CONFIGURACOES = [
  { id: "manutencao", rotulo: "Modo manutenção da plataforma", descricao: "Pausa temporariamente a loja e os cadastros enquanto ajustes técnicos são feitos.", tipo: "tecnica" },
  { id: "certificado", rotulo: "Certificado SSL / Segurança HTTPS", descricao: "Valida o certificado de segurança aplicado em todos os domínios da plataforma.", tipo: "tecnica" },
  { id: "backup", rotulo: "Backup automático do banco de dados", descricao: "Agenda cópias de segurança completas dos dados estratégicos da plataforma.", tipo: "tecnica" },
  { id: "pagamentos", rotulo: "Gateway de pagamento", descricao: "Integra o novo sistema de pagamentos para centralizar os dados financeiros.", tipo: "integracao" },
  { id: "logistica", rotulo: "Sistema de logística externo", descricao: "Integra parceiros logísticos para otimizar entregas em todo o território.", tipo: "integracao" },
  { id: "relatorios", rotulo: "Exportação de relatórios financeiros", descricao: "Habilita a exportação de relatórios estratégicos de vendas e faturamento.", tipo: "integracao" },
];

export function AdministradorScreen({ usuario, onVerLoja, onSair, onTrocarConta }) {
  const [aba, setAba] = useState("financeiro"); // aba ativa
  const [pedidos, setPedidos] = useState([]);
  const [gerentes, setGerentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoGerentes, setCarregandoGerentes] = useState(true);
  // Toggles das configurações — só em memória (sem persistência)
  const [configs, setConfigs] = useState(() => {
    const inicial = {};
    CONFIGURACOES.forEach((c) => (inicial[c.id] = false));
    return inicial;
  });
  // Formulário de nova conta de gerente
  const [formGerente, setFormGerente] = useState({
    nome: "",
    email: "",
    senha: "",
    cpf: "",
    cargo: "Gerente",
  });

  // Carrega os pedidos UMA vez ao abrir o painel (cards + aba financeiro)
  useEffect(() => {
    api
      .listarPedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCarregando(false));
  }, []);

  /** Recarrega a lista de gerentes (usada após criar uma conta). */
  const carregarGerentes = () => {
    setCarregandoGerentes(true);
    api
      .listarGerentes()
      .then(setGerentes)
      .catch(() => setGerentes([]))
      .finally(() => setCarregandoGerentes(false));
  };

  // Carrega os gerentes ao abrir o painel para manter cartões e lista sincronizados.
  useEffect(() => {
    api
      .listarGerentes()
      .then(setGerentes)
      .catch(() => setGerentes([]))
      .finally(() => setCarregandoGerentes(false));
  }, []);

  /** Atualiza o formulário de gerente a cada tecla. */
  const handleGerente = (e) => {
    const { name, value } = e.target;
    setFormGerente((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * CRIA A CONTA DE GERENTE → POST /api/gerentes.
   * O backend grava na coleção "gerentes" com perfil "gerente";
   * depois recarrega a lista exibida.
   */
  const criarGerente = async (e) => {
    e.preventDefault();
    if (!formGerente.nome.trim() || !formGerente.email.trim() || !formGerente.senha.trim()) {
      alert("Preencha nome, email e senha do gerente.");
      return;
    }
    try {
      await api.criarGerente(formGerente);
      alert("Gerente criado com sucesso!");
      setFormGerente({ nome: "", email: "", senha: "", cpf: "", cargo: "Gerente" });
      carregarGerentes();
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "criar o gerente"));
    }
  };

  /** EXCLUI A CONTA DO GERENTE → DELETE /api/gerentes/:id (com confirmação). */
  const excluirGerente = async (id, nome) => {
    if (!window.confirm(`Excluir o gerente "${nome}"?`)) return;
    try {
      await api.deletarGerente(id);
      setGerentes((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert(api.mensagemClaraDeErro(err, "excluir o gerente"));
    }
  };

  /** Liga/desliga um toggle de configuração (estado local apenas). */
  const alternarConfig = (id) => {
    setConfigs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---- Cálculos dos cards de estatísticas (derivados dos pedidos) ----
  const entregues = pedidos.filter((p) => p.status === "entregue").length;
  const pendentes = pedidos.filter((p) => p.status === "pendente").length;
  const faturamento = pedidos.reduce((soma, p) => soma + (p.total || 0), 0);
  const integracoesAtivas = CONFIGURACOES.filter((c) => configs[c.id] && c.tipo === "integracao").length;
  const configsAtivas = CONFIGURACOES.filter((c) => configs[c.id]).length;

  return (
    <div className="page">
      <Header
        usuario={usuario}
        onSair={onSair}
        onTrocarConta={onTrocarConta}
        extra={
          <button type="button" onClick={onVerLoja} className="btn btn-escuro">
            Acessar loja
          </button>
        }
      />

      <main className="shell">
        <h1 className="titulo-pagina">Painel Master — Administrador</h1>
        <p className="subtitulo-pagina">
          Controle total e irrestrito sobre a plataforma: finanças, configurações técnicas, integrações e contas de gerentes.
        </p>

        {/* Cards de estatísticas (valores calculados acima) */}
        <div className="cards-stats">
          {[
            { rotulo: "Faturamento total", valor: formatarPreco(faturamento) },
            { rotulo: "Pedidos", valor: String(pedidos.length) },
            { rotulo: "Entregues", valor: String(entregues) },
            { rotulo: "Pendentes", valor: String(pendentes) },
            { rotulo: "Gerentes", valor: String(gerentes.length) },
            { rotulo: "Sistemas integrados", valor: String(integracoesAtivas) },
          ].map((card) => (
            <div key={card.rotulo} className="card-stat">
              <span className="card-stat-rotulo">{card.rotulo}</span>
              <span className="card-stat-valor">{card.valor}</span>
            </div>
          ))}
        </div>

        {/* Abas do painel */}
        <div className="tabs-gerente">
          <button
            type="button"
            className={`tab-gerente ${aba === "financeiro" ? "tab-gerente-ativo" : ""}`}
            onClick={() => setAba("financeiro")}
          >
            Dados financeiros
          </button>
          <button
            type="button"
            className={`tab-gerente ${aba === "gerentes" ? "tab-gerente-ativo" : ""}`}
            onClick={() => setAba("gerentes")}
          >
            Contas de gerentes
          </button>
          <button
            type="button"
            className={`tab-gerente ${aba === "configuracoes" ? "tab-gerente-ativo" : ""}`}
            onClick={() => setAba("configuracoes")}
          >
            Configurações e integrações
          </button>
        </div>

        {/* ---------------- ABA 1: FINANCEIRO (somente leitura) ---------------- */}
        {aba === "financeiro" && (
          <div className="lista-vendas">
            {carregando ? (
              <div className="estado">Carregando dados financeiros...</div>
            ) : pedidos.length === 0 ? (
              <div className="vazio">
                <p>Nenhum dado financeiro registrado ainda.</p>
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
                      {pedido.itens.map((i) => i.produto).join(", ")}
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
                </div>
              ))
            )}
          </div>
        )}

        {/* ---------------- ABA 2: CONTAS DE GERENTES (CRUD) ---------------- */}
        {aba === "gerentes" && (
          <>
            {/* Formulário de criação (POST /api/gerentes) */}
            <div className="form-produto">
              <h3 className="form-titulo">Cadastrar gerente</h3>
              <div className="campo-form">
                <label>Nome</label>
                <input name="nome" placeholder="Nome do gerente" value={formGerente.nome} onChange={handleGerente} className="input" />
              </div>
              <div className="campo-form">
                <label>Email</label>
                <input name="email" type="email" placeholder="gerente@empresa.com" value={formGerente.email} onChange={handleGerente} className="input" />
              </div>
              <div className="campo-form">
                <label>Senha</label>
                <input name="senha" type="password" placeholder="Sua senha" value={formGerente.senha} onChange={handleGerente} className="input" />
              </div>
              <div className="campo-form">
                <label>CPF</label>
                <input name="cpf" placeholder="000.000.000-00" value={formGerente.cpf} onChange={handleGerente} className="input" />
              </div>
              <div className="form-acoes">
                <button type="button" onClick={criarGerente} className="btn btn-primario">
                  Criar conta de gerente
                </button>
              </div>
            </div>

            {/* Lista de contas existentes */}
            <h2 className="secao-titulo">Gerentes cadastrados ({gerentes.length})</h2>

            {carregandoGerentes ? (
              <div className="estado">Carregando gerentes...</div>
            ) : gerentes.length === 0 ? (
              <div className="vazio">
                <p>Nenhum gerente cadastrado.</p>
              </div>
            ) : (
              <div className="lista-vendas">
                {gerentes.map((gerente) => (
                  <div key={gerente._id} className="linha-produto">
                    <div className="linha-produto-info">
                      <span className="linha-produto-nome">{gerente.nome}</span>
                      <span className="linha-produto-meta">
                        {gerente.email} · {gerente.cargo || "Gerente"}
                      </span>
                    </div>
                    <div className="linha-produto-acoes">
                      <button
                        type="button"
                        onClick={() => excluirGerente(gerente._id, gerente.nome)}
                        className="btn btn-perigo"
                        style={{ fontSize: 12 }}
                      >
                        Excluir conta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------------- ABA 3: CONFIGURAÇÕES (só em memória) ---------------- */}
        {aba === "configuracoes" && (
          <div className="lista-vendas">
            <p className="subtitulo-pagina" style={{ marginBottom: 14 }}>
              Apenas o perfil Administrador (Master) tem permissão para alterar estas configurações técnicas vitais e integrar novos sistemas.
            </p>
            {CONFIGURACOES.map((config) => (
              <div key={config.id} className="linha-produto">
                <div className="linha-produto-info">
                  <span className="linha-produto-nome">{config.rotulo}</span>
                  <span className="linha-produto-meta">
                    {config.descricao}
                    <span className={`badge ${config.tipo === "tecnica" ? "badge-pendente" : "badge-publicado"}`}>
                      {config.tipo === "tecnica" ? "Técnica" : "Integração"}
                    </span>
                  </span>
                </div>
                <div className="linha-produto-acoes">
                  <button
                    type="button"
                    onClick={() => alternarConfig(config.id)}
                    className={`btn ${configs[config.id] ? "btn-primario" : "btn-secundario"}`}
                    style={{ fontSize: 12 }}
                  >
                    {configs[config.id] ? "✓ Ativo" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
            <div className="vazio" style={{ marginTop: 14 }}>
              <p>{configsAtivas} configuração(ões)/integração(ões) ativa(s) nesta sessão.</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
