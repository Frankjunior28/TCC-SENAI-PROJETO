import { useEffect, useState, useCallback } from "react";
import { fetchProdutos } from "../services/api";
import { useCarrinho } from "../context/CarrinhoContext";

function Loja() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const { adicionar } = useCarrinho();

  const carregar = useCallback(async () => {
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
    carregar();
  }, [carregar]);

  if (loading) return <p className="carregando">Carregando...</p>;
  if (erro) return <p className="feedback erro">{erro}</p>;

  return (
    <section className="pagina">
      <h1>Loja</h1>
      <p className="loja-sub">Escolha seus produtos e adicione ao carrinho</p>

      {produtos.length === 0 ? (
        <p className="vazio">Nenhum produto disponível.</p>
      ) : (
        <div className="produto-grid">
          {produtos.map((prod) => (
            <div key={prod._id} className="card-produto">
              <div className="card-produto-info">
                <h3>{prod.nome}</h3>
                {prod.descricao && <p className="card-desc">{prod.descricao}</p>}
                <p className="card-preco">R$ {Number(prod.preco).toFixed(2)}</p>
                <p className="card-qtd">Em estoque: {prod.quantidade}</p>
              </div>
              <button
                className="btn-comprar"
                onClick={() => adicionar(prod, 1)}
                disabled={prod.quantidade <= 0}
              >
                {prod.quantidade <= 0 ? "Esgotado" : "Adicionar ao carrinho"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Loja;
