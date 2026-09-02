import { useEffect, useState, useCallback } from "react";
import { fetchVendasPendentes, atualizarStatusVenda } from "../services/api";

const statusRotulo = {
  pendente: "Pendente",
  em_entrega: "Em entrega",
  entregue: "Entregue",
};

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [entregues, setEntregues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  const carregar = useCallback(async () => {
    try {
      const data = await fetchVendasPendentes();
      const pendentes = data.filter((v) => v.status !== "entregue");
      setPedidos(pendentes);
      setEntregues(data.filter((v) => v.status === "entregue"));
    } catch (error) {
      setErro("Erro ao carregar pedidos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  const mudarStatus = async (venda, novoStatus) => {
    setErro("");
    try {
      await atualizarStatusVenda(venda._id, novoStatus);
      setFeedback(
        novoStatus === "em_entrega"
          ? "Pedido aceito. Boa entrega!"
          : "Pedido marcado como entregue."
      );
      carregar();
      setTimeout(() => setFeedback(""), 3000);
    } catch (error) {
      setErro("Erro: " + error.message);
    }
  };

  const renderPedido = (v) => (
    <li key={v._id} className="pedido-item">
      <div className="pedido-cabecalho">
        <strong>Pedido #{v._id.slice(-6)}</strong>
        <span className={`status status-${v.status}`}>{statusRotulo[v.status]}</span>
      </div>
      <p className="pedido-cliente">
        Cliente: {v.usuario?.nome} ({v.usuario?.email})
      </p>
      <ul className="venda-itens">
        {v.itens.map((i, idx) => (
          <li key={idx}>
            {i.nome} - {i.quantidade}x R$ {Number(i.precoUnitario).toFixed(2)} = R${" "}
            {Number(i.subtotal).toFixed(2)}
          </li>
        ))}
      </ul>
      <p className="venda-total">Total: R$ {Number(v.total).toFixed(2)}</p>
      <div className="pedido-acoes">
        {v.status === "pendente" && (
          <button className="btn-aceitar" onClick={() => mudarStatus(v, "em_entrega")}>
            Aceitar / Iniciar entrega
          </button>
        )}
        {v.status === "em_entrega" && (
          <button className="btn-aceitar" onClick={() => mudarStatus(v, "entregue")}>
            Marcar como entregue
          </button>
        )}
      </div>
    </li>
  );

  return (
    <section className="pagina">
      <h1>Pedidos para Entrega</h1>

      {feedback && <p className="feedback ok">{feedback}</p>}
      {erro && <p className="feedback erro">{erro}</p>}

      {loading ? (
        <p className="carregando">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <p className="vazio">Nenhum pedido pendente no momento.</p>
      ) : (
        <ul className="pedido-list">{pedidos.map(renderPedido)}</ul>
      )}

      {entregues.length > 0 && (
        <>
          <h2>Entregues recentes</h2>
          <ul className="pedido-list">{entregues.map(renderPedido)}</ul>
        </>
      )}
    </section>
  );
}

export default Pedidos;
