import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { formatarPreco } from "../constants";
import * as api from "../services/api";

export function EntregadorScreen({ usuario, onSair, onTrocarConta }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .listarPedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCarregando(false));
  }, []);

  const entregues = pedidos.filter((p) => p.status === "entregue").length;
  const pendentes = pedidos.filter((p) => p.status === "pendente").length;
  const totalGeral = pedidos.reduce((soma, p) => soma + (p.total || 0), 0);

  const marcarEntregue = async (id) => {
    try {
      await api.atualizarStatusPedido(id, "entregue");
      setPedidos((prev) => prev.map((p) => (p._id === id ? { ...p, status: "entregue" } : p)));
    } catch (err) {
      alert("Erro ao atualizar entrega: " + err.message);
    }
  };

  return (
    <div className="page">
      <Header usuario={usuario} onSair={onSair} onTrocarConta={onTrocarConta} />
      <main className="shell">
        <h1 className="titulo-pagina">Dashboard — Entregador</h1>
        <p className="subtitulo-pagina">Acompanhe suas entregas do dia.</p>

        <div className="cards-stats">
          {[
            { rotulo: "Entregas do dia", valor: String(pedidos.length) },
            { rotulo: "Concluídas", valor: String(entregues) },
            { rotulo: "Pendentes", valor: String(pendentes) },
            { rotulo: "Total entregue", valor: formatarPreco(totalGeral) },
          ].map((card) => (
            <div key={card.rotulo} className="card-stat">
              <span className="card-stat-rotulo">{card.rotulo}</span>
              <span className="card-stat-valor">{card.valor}</span>
            </div>
          ))}
        </div>

        <h2 className="secao-titulo">Entregas</h2>

        {carregando ? (
          <div className="estado">Carregando entregas...</div>
        ) : pedidos.length === 0 ? (
          <div className="vazio">
            <span style={{ fontSize: 32 }}>📦</span>
            <p>Nenhuma entrega no momento.</p>
          </div>
        ) : (
          <div className="lista-vendas">
            {pedidos.map((pedido) => (
              <div key={pedido._id} className="linha-produto">
                <div className="linha-produto-info">
                  <span className="linha-produto-nome">Entrega p/ {pedido.cliente?.nome}</span>
                  <span className="linha-produto-meta">
                    {new Date(pedido.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                    {pedido.itens.map((i) => i.produto).join(", ")} · {formatarPreco(pedido.total)}
                    <span
                      className={`badge ${pedido.status === "entregue" ? "badge-publicado" : "badge-pendente"}`}
                    >
                      {pedido.status === "entregue" ? "Entregue" : "Pendente"}
                    </span>
                  </span>
                </div>
                {pedido.status === "pendente" && (
                  <button
                    type="button"
                    onClick={() => marcarEntregue(pedido._id)}
                    className="btn btn-primario"
                    style={{ fontSize: 12 }}
                  >
                    ✅ Marcar como entregue
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}