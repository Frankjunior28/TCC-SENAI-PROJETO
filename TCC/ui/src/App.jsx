import { useEffect, useState } from "react";
import { fetchProdutos, createProduto } from "./services/api";

function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  const carregarProdutos = async () => {
    try {
      const data = await fetchProdutos();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !preco) return;

    await createProduto({ nome, preco: Number(preco) });
    setNome("");
    setPreco("");
    carregarProdutos();
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>Painel do TCC - Gestão de Produtos</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Cadastrar Produto
        </button>
      </form>

      <h2>Produtos Cadastrados</h2>
      <ul>
        {produtos.map((prod) => (
          <li key={prod._id}>
            <strong>{prod.nome}</strong> - R$ {prod.preco}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;