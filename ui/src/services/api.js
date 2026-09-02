const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function authToken() {
  return localStorage.getItem("token") || "";
}

async function request(path, options = {}) {
  const token = authToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mensagem = Array.isArray(data.erros) ? data.erros.join(". ") : data.message;
    throw new Error(mensagem || `Erro ${response.status}`);
  }

  return data;
}

export async function login(papel, email, senha) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ papel, email, senha }),
  });
}

export async function registrar(papel, dados) {
  return request("/auth/registro", {
    method: "POST",
    body: JSON.stringify({ ...dados, papel }),
  });
}

export const fetchProdutos = () => request("/produtos");

export const createProduto = (produto) =>
  request("/produtos", { method: "POST", body: JSON.stringify(produto) });

export const updateProduto = (id, produto) =>
  request(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(produto) });

export const deleteProduto = (id) => request(`/produtos/${id}`, { method: "DELETE" });

export const criarVenda = (itens) =>
  request("/vendas", { method: "POST", body: JSON.stringify({ itens }) });

export const fetchVendas = () => request("/vendas");

export const fetchVendasPendentes = () => request("/vendas/pendentes");

export const atualizarStatusVenda = (id, status) =>
  request(`/vendas/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const fetchGerentes = () => request("/gerentes");

export const fetchUsuarios = () => request("/usuarios");
