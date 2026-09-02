import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrinho } from "../context/CarrinhoContext";
import { criarVenda } from "../services/api";

function Carrinho() {
  const { itens, remover, alterarQuantidade, limpar, total } = useCarrinho();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleFinalizar = async () => {
    setErro("");
    setCarregando(true);
    try {
      await criarVenda(
        itens.map((i) => ({ produto: i.produto, quantidade: i.quantidade }))
      );
      setFeedback("Compra realizada com sucesso!");
      limpar();
      setTimeout(() => navigate("/usuario"), 2000);
    } catch (error) {
      setErro("Erro na compra: " + error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <section className="pagina">
      <h1>Carrinho</h1>

      {feedback && <p className="feedback ok">{feedback}</p>}
      {erro && <p className="feedback erro">{erro}</p>}

      {itens.length === 0 ? (
        <p className="vazio">Seu carrinho está vazio.</p>
      ) : (
        <>
          <ul className="carrinho-list">
            {itens.map((item) => (
              <li key={item.produto} className="carrinho-item">
                <div className="carrinho-info">
                  <strong>{item.nome}</strong>
                  <span>R$ {Number(item.precoUnitario).toFixed(2)} cada</span>
                </div>
                <div className="carrinho-controles">
                  <button onClick={() => alterarQuantidade(item.produto, item.quantidade - 1)}>
                    -
                  </button>
                  <span className="carrinho-qtd">{item.quantidade}</span>
                  <button onClick={() => alterarQuantidade(item.produto, item.quantidade + 1)}>
                    +
                  </button>
                </div>
                <div className="carrinho-subtotal">
                  R$ {Number(item.precoUnitario * item.quantidade).toFixed(2)}
                </div>
                <button className="btn-deletar" onClick={() => remover(item.produto)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div className="carrinho-total">
            <strong>Total: R$ {Number(total).toFixed(2)}</strong>
          </div>

          <button className="btn-finalizar" onClick={handleFinalizar} disabled={carregando}>
            {carregando ? "Finalizando..." : "Finalizar Compra"}
          </button>
        </>
      )}
    </section>
  );
}

export default Carrinho;
