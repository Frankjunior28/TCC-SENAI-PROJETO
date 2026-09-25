/**
 * Modal de troca de conta.
 *
 * Cada perfil é uma conta independente. O usuário pode entrar em uma conta
 * existente informando email e senha ou criar uma nova conta para o perfil
 * desejado sem alterar a conta atualmente ativa.
 */
import { useState } from "react";
import { PERFIS, TIPOS } from "../constants";
import { mensagemClaraDeErro } from "../services/api";

const perfilInicial = (atual) => {
  if (atual === "gerente") return "administrador";
  return "gerente";
};

export function TrocarContaModal({ usuarioAtual, aoTrocar, aoCriar, aoFechar }) {
  const [perfil, setPerfil] = useState(() => perfilInicial(usuarioAtual?.perfil));
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dados, setDados] = useState({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const limparCredenciais = () => {
    setEmail("");
    setSenha("");
    setDados({});
    setErro("");
  };

  const selecionarPerfil = (tipo) => {
    setPerfil(tipo);
    limparCredenciais();
  };

  const selecionarModo = (novoModo) => {
    setModo(novoModo);
    limparCredenciais();
  };

  const handleCadastro = (evento) => {
    const { name, value } = evento.target;
    setDados((anterior) => ({ ...anterior, [name]: value }));
  };

  const submit = async (evento) => {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      if (modo === "login") {
        await aoTrocar({ perfil, email, senha });
      } else {
        await aoCriar({ ...dados, perfil });
      }
    } catch (erroCadastro) {
      setErro(
        mensagemClaraDeErro(
          erroCadastro,
          modo === "login" ? `entrar na conta de ${PERFIS[perfil].label}` : `criar a conta de ${PERFIS[perfil].label}`
        )
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal modal-troca" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecalho">
          <div>
            <span className="modal-kicker">Perfis independentes</span>
            <h3>Trocar de conta</h3>
          </div>
          <button type="button" className="modal-fechar" onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        {usuarioAtual && (
          <div className="conta-atual">
            <span>Conta atual</span>
            <strong>{usuarioAtual.nome}</strong>
            <small>{PERFIS[usuarioAtual.perfil]?.label}</small>
          </div>
        )}

        <p className="modal-descricao">
          Entre em uma conta que já existe ou crie uma nova para o perfil selecionado.
          Sua conta atual não será alterada.
        </p>

        <div className="tabs-perfil">
          {TIPOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => selecionarPerfil(tipo)}
              className={`tab ${perfil === tipo ? "tab-ativo" : ""}`}
            >
              {PERFIS[tipo].label}
            </button>
          ))}
        </div>

        <div className="tabs-modo">
          <button
            type="button"
            onClick={() => selecionarModo("login")}
            className={`tab-modo ${modo === "login" ? "tab-modo-ativo" : ""}`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => selecionarModo("cadastro")}
            className={`tab-modo ${modo === "cadastro" ? "tab-modo-ativo" : ""}`}
          >
            Criar nova conta
          </button>
        </div>

        <form onSubmit={submit} className="formulario">
          {modo === "login" ? (
            <>
              <div className="campo-form">
                <label>Email da conta de {PERFIS[perfil].label}</label>
                <input
                  className="input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="campo-form">
                <label>Senha</label>
                <input
                  className="input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                />
              </div>
            </>
          ) : (
            PERFIS[perfil].campos.map((campo) => (
              <div key={campo.name} className="campo-form">
                <label>{campo.label}</label>
                <input
                  className="input"
                  name={campo.name}
                  type={campo.type}
                  required
                  autoComplete={campo.name === "senha" ? "new-password" : "on"}
                  placeholder={campo.placeholder}
                  value={dados[campo.name] || ""}
                  onChange={handleCadastro}
                />
              </div>
            ))
          )}

          {erro && <p className="aviso-erro modal-erro">{erro}</p>}

          <div className="modal-acoes">
            <button type="button" onClick={aoFechar} className="btn btn-secundario">
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="btn btn-primario btn-grande">
              {carregando
                ? "Aguarde..."
                : modo === "login"
                  ? `Entrar como ${PERFIS[perfil].label}`
                  : `Criar conta de ${PERFIS[perfil].label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
