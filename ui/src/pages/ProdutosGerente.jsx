import { useEffect, useState, useCallback } from "react";
import { fetchProdutos, createProduto, updateProduto, deleteProduto } from "../services/api";

function ProdutosGerente() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  const [editarId, setEditarId] = useState(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const carregarProdutos = useCallback(async () => {
    try {
      const data = await fetchProdutos();
      setProdutos(data);
    } catch (error) {
      setErro("Erro ao carregar produtos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarProdutos();
  }, [carregarProdutos]);

  const limparForm = () => {
    setEditarId(null);
    setNome("");
    setPreco("");
    setDescricao("");
    setQuantidade("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const dados = {
        nome,
        preco: Number(preco),
        descricao,
        quantidade: Number(quantidade) || 0,
      };
      if (editarId) {
        await updateProduto(editarId, dados);
        setFeedback("Produto atualizado com sucesso!");
      } else {
        await createProduto(dados);
        setFeedback("Produto criado com sucesso!");
      }
      limparForm();
      carregarProdutos();
      setTimeout(() => setFeedback(""), 3000);
    } catch (error) {
      setErro("Erro: " + error.message);
    }
  };

  const handleEditar = (prod) => {
    setEditarId(prod._id);
    setNome(prod.nome);
    setPreco(prod.preco);
    setDescricao(prod.descricao || "");
    setQuantidade(prod.quantidade || 0);
  };

  const handleDeletar = async (id) => {
    if (!window.confirm("Excluir este produto?")) return;
    setErro("");
    try {
      await deleteProduto(id);
      carregarProdutos();
    } catch (error) {
      setErro("Erro ao excluir: " + error.message);
    }
  };

  return (
    <section className="pagina">
      <h1>Painel do Gerente</h1>

      <form onSubmit={handleSubmit} className="produto-form">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Preço"
          min="0"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantidade"
          min="0"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <button type="submit">{editarId ? "Atualizar Produto" : "Criar Produto"}</button>
        {editarId && (
          <button type="button" className="btn-cancelar" onClick={limparForm}>
            Cancelar edição
          </button>
        )}
      </form>

      {feedback && <p className="feedback ok">{feedback}</p>}
      {erro && <p className="feedback erro">{erro}</p>}

      <h2>Produtos Cadastrados</h2>
      {loading ? (
        <p className="carregando">Carregando...</p>
      ) : produtos.length === 0 ? (
        <p className="vazio">Nenhum produto cadastrado.</p>
      ) : (
        <ul className="produto-list">
          {produtos.map((prod) => (
            <li key={prod._id} className="produto-item">
              <div className="produto-info">
                <strong>{prod.nome}</strong>
                <span className="produto-preco">R$ {Number(prod.preco).toFixed(2)}</span>
                {prod.descricao && <span className="produto-desc">{prod.descricao}</span>}
                <span className="produto-qtd">Estoque: {prod.quantidade}</span>
              </div>
              <div className="produto-acoes">
                <button className="btn-editar" onClick={() => handleEditar(prod)}>
                  Editar
                </button>
                <button className="btn-deletar" onClick={() => handleDeletar(prod._id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProdutosGerente;
