/**
 * ============================================================================
 *  UI  →  services/api.js — CLIENTE HTTP (ponte entre a UI e a API)
 * ============================================================================
 *  O QUE É ESTE ARQUIVO:
 *    Todas as chamadas que o frontend faz ao backend passam por aqui.
 *    Ele usa o `fetch` nativo do navegador (sem axios) e centraliza:
 *
 *      • API_URL = "/api"  → caminho RELATIVO. Isso funciona assim:
 *          - em DESENVOLVIMENTO o Vite cria um proxy: /api → http://localhost:3000
 *            (configurado em vite.config.js);
 *          - em PRODUÇÃO o próprio Express serve o site e a API na mesma porta.
 *
 *      • TIMEOUT de 12 segundos via AbortController — se o servidor não
 *        responder no prazo, a requisição é abortada com uma mensagem amigável.
 *
 *      • TRADUÇÃO DE ERROS: `request()` lança Error com texto em português.
 *        `MENSAGENS_POR_STATUS` traduz códigos HTTP quando o servidor não
 *        envia mensagem; `extrairDetalhe`/`montarMensagem` preferem a mensagem
 *        que veio no corpo da resposta (chaves `message` ou `mensagem`).
 *
 *      • `mensagemClaraDeErro(erro, contexto)` → formato usado pelas telas:
 *        "Não foi possível {contexto}: {causa}".
 *
 *  ENDPOINTS (cada função = um endpoint da API):
 *    fetchProdutos          GET    /api/produtos
 *    createProduto          POST   /api/produtos
 *    updateProduto          PUT    /api/produtos/:id
 *    deleteProduto          DELETE /api/produtos/:id
 *    login                  POST   /api/usuarios/login     (email + senha)
 *    cadastro               POST   /api/usuarios           (cria no perfil enviado)
 *    listarPedidos          GET    /api/pedidos
 *    criarPedido            POST   /api/pedidos             (checkout)
 *    atualizarStatusPedido  PUT    /api/pedidos/:id         (entregar/cancelar)
 *    excluirPedido          DELETE /api/pedidos/:id
 *    listarGerentes         GET    /api/gerentes
 *    criarGerente           POST   /api/gerentes            (painel Master)
 *    deletarGerente         DELETE /api/gerentes/:id
 *
 *  OBS.: ainda não há funções para o CRUD de administradores
 *    (/api/administradores) — a rota existe no backend, mas a UI não usa.
 * ============================================================================
 */

const API_URL = "/api";

// Tradução de códigos HTTP para mensagens amigáveis (usada quando a
// resposta não trouxe `message`/`mensagem` no corpo)
const MENSAGENS_POR_STATUS = {
  400: "Os dados enviados estão inválidos ou incompletos.",
  401: "Credenciais incorretas. Verifique email, senha e CPF e tente novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O recurso solicitado não foi encontrado.",
  409: "Este registro já existe no sistema. Use outro valor ou entre na conta correspondente.",
  500: "O servidor encontrou um erro interno. Tente novamente em instantes.",
};

/** Pega o campo `error` (string ou {message}) da resposta, se houver. */
const extrairDetalhe = (data) => {
  if (!data || data.error == null) return "";
  const detalhe =
    typeof data.error === "string" ? data.error : data.error?.message || String(data.error);
  return detalhe ? ` (${detalhe})` : "";
};

/** Monta a mensagem final: prefere a do corpo da resposta; senão usa a tabela. */
const montarMensagem = (status, data) => {
  const texto = data?.message || data?.mensagem || "";
  if (texto) return texto + extrairDetalhe(data);
  return MENSAGENS_POR_STATUS[status] || `Erro ${status}${data?.statusText ? ` — ${data.statusText}` : ""}`;
};

/**
 * Núcleo de todas as chamadas:
 *   1. cria um AbortController com timeout de 12s;
 *   2. faz o fetch para `${API_URL}${url}` com JSON;
 *   3. se a rede falhar/estourar o tempo → Error amigável;
 *   4. lê o corpo JSON (ou `{}` se não houver) e, se o status indicar erro
 *      (resposta.ok === false), lança Error com a mensagem traduzida;
 *   5. devolve os dados em caso de sucesso.
 */
const request = async (url, options = {}) => {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 12000); // 12s de paciência
  try {
    let response;
    try {
      response = await fetch(`${API_URL}${url}`, {
        headers: { "Content-Type": "application/json" },
        signal: controle.signal,
        ...options, // method, body, etc. vindos do chamador
      });
    } catch (erro) {
      // Rede fora, CORS ou timeout (AbortError)
      const causa =
        erro.name === "AbortError"
          ? "o servidor não respondeu a tempo (mais de 12 segundos)"
          : erro.message;
      throw new Error(
        `Não foi possível falar com o servidor (${causa}). Verifique se o backend está rodando.`,
        { cause: erro }
      );
    }
    const data = await response.json().catch(() => ({})); // corpo vazio → {}
    if (!response.ok) {
      // HTTP 4xx/5xx → transforma em exceção com texto entendível
      throw new Error(montarMensagem(response.status, data), { cause: new Error(`HTTP ${response.status}`) });
    }
    return data;
  } finally {
    clearTimeout(timer); // libera o timer em SUCESSO ou ERRO
  }
};

/** Formato padrão de erro usado pelas telas: "Não foi possível {contexto}: {causa}". */
export const mensagemClaraDeErro = (erro, contexto = "concluir esta operação") => {
  const causa = (erro?.message || "").trim();
  if (!causa) return `Não foi possível ${contexto}. Ocorreu um erro inesperado; tente novamente.`;
  return `Não foi possível ${contexto}: ${causa}`;
};

// ------------------------------ PRODUTOS ------------------------------
export const fetchProdutos = () => request("/produtos");

export const createProduto = (produto) =>
  request("/produtos", { method: "POST", body: JSON.stringify(produto) });

export const updateProduto = (id, produto) =>
  request(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(produto) });

export const deleteProduto = (id) => request(`/produtos/${id}`, { method: "DELETE" });

// ------------------------------ CONTA (usuarios) ------------------------------
/** LOGIN: envia email + senha (+ perfil) para POST /api/usuarios/login */
export const login = ({ email, senha, cpf, perfil }) =>
  request("/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ email, senha, cpf, perfil }),
  });

/** CADASTRO: cria a conta na coleção do `perfil` enviado */
export const cadastro = (dados) =>
  request("/usuarios", { method: "POST", body: JSON.stringify(dados) });

// ------------------------------ PEDIDOS ------------------------------
export const listarPedidos = () => request("/pedidos");

/** Finaliza a compra: cliente + itens + total → status "pendente" no banco */
export const criarPedido = (pedido) =>
  request("/pedidos", { method: "POST", body: JSON.stringify(pedido) });

export const atualizarStatusPedido = (id, status) =>
  request(`/pedidos/${id}`, { method: "PUT", body: JSON.stringify({ status }) });

export const excluirPedido = (id) => request(`/pedidos/${id}`, { method: "DELETE" });

// ------------------------------ GERENTES ------------------------------
export const listarGerentes = () => request("/gerentes");

/** Usado pelo painel Master para criar conta de gerente (coleção "gerentes") */
export const criarGerente = (gerente) =>
  request("/gerentes", { method: "POST", body: JSON.stringify(gerente) });

export const deletarGerente = (id) => request(`/gerentes/${id}`, { method: "DELETE" });
