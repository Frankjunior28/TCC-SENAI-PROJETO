import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linksPorPapel = {
  gerente: [
    { to: "/gerente", label: "Produtos", end: true },
    { to: "/gerente/vendas", label: "Vendas", end: false },
  ],
  usuario: [
    { to: "/usuario", label: "Loja", end: true },
    { to: "/usuario/carrinho", label: "Carrinho", end: false },
  ],
  entregador: [{ to: "/entregador", label: "Pedidos", end: true }],
};

function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const links = usuario ? linksPorPapel[usuario.papel] || [] : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        {usuario && (
          <div className="navbar-user">
            <span className="user-nome">{usuario.nome}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        )}
      </nav>
      <main className="conteudo">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
