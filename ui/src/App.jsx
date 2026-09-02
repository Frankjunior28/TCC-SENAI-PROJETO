import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CarrinhoProvider } from "./context/CarrinhoContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ProdutosGerente from "./pages/ProdutosGerente";
import Vendas from "./pages/Vendas";
import Loja from "./pages/Loja";
import Carrinho from "./pages/Carrinho";
import Pedidos from "./pages/Pedidos";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarrinhoProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Layout />}>
              <Route element={<ProtectedRoute papel="gerente" />}>
                <Route path="/gerente" element={<ProdutosGerente />} />
                <Route path="/gerente/vendas" element={<Vendas />} />
              </Route>

              <Route element={<ProtectedRoute papel="usuario" />}>
                <Route path="/usuario" element={<Loja />} />
                <Route path="/usuario/carrinho" element={<Carrinho />} />
              </Route>

              <Route element={<ProtectedRoute papel="entregador" />}>
                <Route path="/entregador" element={<Pedidos />} />
              </Route>
            </Route>

            <Route path="*" element={<Login />} />
          </Routes>
        </CarrinhoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
