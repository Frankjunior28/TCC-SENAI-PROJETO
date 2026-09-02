import { useEffect, useState, useCallback } from "react";
import { fetchVendas } from "../services/api";

const statusRotulo = {
  pendente: "Pendente",
  em_entrega: "Em entrega",
  entregue: "Entregue",
};

function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const data = await fetchVendas();
      setVendas(data);
    } catch (error) {
      setErro("Erro ao carregar vendas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

  return (
    <section className="pagina">
      <h1>Histórico de Vendas</h1>
      {erro && <p className="feedback erro">{erro}</p>}
      {loading ? (
        <p className="carregando">Carregando...</p>
      ) : vendas.length === 0 ? (
        <p className="vazio">Nenhuma venda registrada.</p>
      ) : (
        <ul className="venda-list">
          {vendas.map((v) => (
            <li key={v._id} className="venda-item">
              <div className="venda-cabecalho">
                <strong>Pedido #{v._id.slice(-6)}</strong>
                <span className={`status status-${v.status}`}>{statusRotulo[v.status]}</span>
              </div>
              <p className="venda-cliente">
                Cliente: {v.usuario ? v.usuario.nome : "-"} ({v.usuario?.email || "-"})
              </p>
              <ul className="venda-itens">
                {v.itens.map((i, idx) => (
                  <li key={idx}>
                    {i.nome} - {i.quantidade}x R$ {Number(i.precoUnitario).toFixed(2)} = R${" "}
                    {Number(i.subtotal).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="venda-total">
                Total: <strong>R$ {Number(v.total).toFixed(2)}</strong>
              </p>
              {v.entregador && (
                <p className="venda-entregador">Entregador: {v.entregador.nome}</p>
              )}
              <p className="venda-data">
                {new Date(v.createdAt).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Vendas;
