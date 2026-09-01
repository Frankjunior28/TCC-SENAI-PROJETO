const API_URL = "http://localhost:3000";

export const fetchProdutos = async () => {
  const response = await fetch(`${API_URL}/produtos`);
  return await response.json();
};

export const createProduto = async (produto) => {
  const response = await fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(produto),
  });
  return await response.json();
};