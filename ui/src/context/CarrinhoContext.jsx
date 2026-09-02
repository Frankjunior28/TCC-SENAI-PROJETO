import { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";

const CarrinhoContext = createContext(null);

function carregarCarrinho() {
  try {
    return JSON.parse(localStorage.getItem("carrinho")) || [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState(carregarCarrinho);

  const adicionar = useCallback((produto, quantidade = 1) => {
    setItens((prev) => {
      const existente = prev.find((i) => i.produto === produto._id);
      let novo;
      if (existente) {
        novo = prev.map((i) =>
          i.produto === produto._id ? { ...i, quantidade: i.quantidade + quantidade } : i
        );
      } else {
        novo = [
          ...prev,
          {
            produto: produto._id,
            nome: produto.nome,
            precoUnitario: produto.preco,
            quantidade,
          },
        ];
      }
      localStorage.setItem("carrinho", JSON.stringify(novo));
      return novo;
    });
  }, []);

  const remover = useCallback((produtoId) => {
    setItens((prev) => {
      const novo = prev.filter((i) => i.produto !== produtoId);
      localStorage.setItem("carrinho", JSON.stringify(novo));
      return novo;
    });
  }, []);

  const alterarQuantidade = useCallback((produtoId, quantidade) => {
    setItens((prev) => {
      const novo = prev
        .map((i) =>
          i.produto === produtoId ? { ...i, quantidade: Math.max(1, quantidade) } : i
        )
        .filter((i) => i.quantidade > 0);
      localStorage.setItem("carrinho", JSON.stringify(novo));
      return novo;
    });
  }, []);

  const limpar = useCallback(() => {
    setItens([]);
    localStorage.removeItem("carrinho");
  }, []);

  const total = itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0);

  return (
    <CarrinhoContext.Provider
      value={{ itens, adicionar, remover, alterarQuantidade, limpar, total }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

CarrinhoProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (!context) throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  return context;
}
