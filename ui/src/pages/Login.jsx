import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const papeis = [
  { valor: "gerente", rotulo: "Gerente", temTelefone: true },
  { valor: "usuario", rotulo: "Usuário", temTelefone: false },
  { valor: "entregador", rotulo: "Entregador", temTelefone: true },
];

function Login() {
  const { usuario, login, registrar } = useAuth();
  const navigate = useNavigate();

  const [modo, setModo] = useState("login");
  const [papel, setPapel] = useState("gerente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (usuario) {
    return <Navigate to={`/${usuario.papel}`} replace />;
  }

  const papelAtual = papeis.find((p) => p.valor === papel);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      if (modo === "login") {
        await login(papel, email, senha);
      } else {
        const dados = { nome, email, senha };
        if (papelAtual.temTelefone) dados.telefone = telefone;
        await registrar(papel, dados);
      }
      navigate(`/${papel}`);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Gestão de Produtos</h1>
        <p className="login-sub">Entre com a sua conta</p>

        <div className="papel-opcoes">
          {papeis.map((p) => (
            <button
              key={p.valor}
              type="button"
              className={`papel-btn ${papel === p.valor ? "selecionado" : ""}`}
              onClick={() => setPapel(p.valor)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        <div className="modo-opcoes">
          <button
            type="button"
            className={`modo-btn ${modo === "login" ? "ativo" : ""}`}
            onClick={() => setModo("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`modo-btn ${modo === "registro" ? "ativo" : ""}`}
            onClick={() => setModo("registro")}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {modo === "registro" && (
            <>
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              {papelAtual.temTelefone && (
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              )}
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          {erro && <p className="feedback erro">{erro}</p>}
          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando
              ? "Aguarde..."
              : modo === "login"
              ? `Entrar como ${papelAtual.rotulo}`
              : `Criar conta ${papelAtual.rotulo}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
