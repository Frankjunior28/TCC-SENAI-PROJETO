/**
 * ============================================================================
 *  UI  →  LoginScreen.jsx — TELA DE LOGIN E CADASTRO
 * ============================================================================
 *  O QUE ESTA TELA FAZ:
 *    É a primeira tela do app. Tem DOIS eixos de botões:
 *
 *    1) ABA DE PERFIL (tabs-perfil):  Usuário | Gerente | Administrador
 *       → escolhe EM QUAL COLEÇÃO do banco a conta será procurada/criada
 *         (usuarios | gerentes | administradores).
 *
 *    2) MODO (tabs-modo):  Entrar | Criar conta
 *       → "Entrar"     chama `aoLogin({ email, senha, perfil })`
 *       → "Criar conta" chama `aoCadastro({ ...campos, perfil })`
 *
 *  LOGIN (todos os perfis usam a MESMA credencial: email + senha):
 *    O backend (POST /api/usuarios/login) procura o email na coleção do
 *    perfil escolhido e compara a senha — para gerente e administrador
 *    também é email + senha (antes pedia CPF, o que foi padronizado).
 *
 *  CADASTRO:
 *    Os campos de cada perfil vêm de PERFIS[perfil].campos (constants.js):
 *      usuário → nome, email, senha, telefone
 *      gerente/administrador → + cpf (dado de identificação, não é senha)
 *    Erros chegam por EXCEÇÃO (a API lança Error) → exibidos com
 *    `mensagemClaraDeErro` na caixa `.aviso-erro`.
 *
 *  ESTADOS LOCAIS: `erro` (mensagem vermelha) e `carregando` (desabilita o
 *    botão enquanto a requisição não volta).
 * ============================================================================
 */
import { useState } from "react";
import { PERFIS, TIPOS } from "../constants";
import { mensagemClaraDeErro } from "../services/api";

export function LoginScreen({ perfil, modo, campos, handleChange, mudarPerfil, setModo, aoLogin, aoCadastro, onVoltarLoja }) {
  const [erro, setErro] = useState(""); // mensagem de erro da tela
  const [carregando, setCarregando] = useState(false); // evita cliques duplicados

  const onSubmit = async (e) => {
    e.preventDefault(); // impede o refresh da página no submit do form
    setErro("");
    setCarregando(true);
    try {
      if (modo === "login") {
        // LOGIN: sempre email + senha, enviando o perfil escolhido na aba
        await aoLogin({ email: campos.email, senha: campos.senha, perfil });
      } else {
        // CADASTRO: envia todos os campos digitados + perfil
        await aoCadastro({ ...campos, perfil });
      }
    } catch (err) {
      setErro(mensagemClaraDeErro(err, modo === "login" ? "entrar na sua conta" : "criar sua conta"));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="page-auth">
      <div className="auth-card">
        <a className="brand" href="#top" onClick={(e) => e.preventDefault()}>
          <img className="brand-logo" src="/favicon.svg" alt="Casa Aconchego" width={40} height={40} />
          <span className="brand-nome">
            Casa <span>Aconchego</span>
          </span>
        </a>

        <p className="auth-bemvindo">
          {modo === "login" ? "Entre na sua conta para continuar" : "Crie sua conta gratuita"}
        </p>
        <p className="auth-dica">
          Cada perfil possui uma conta independente. Para trocar, escolha o perfil e informe
          o email e a senha daquela conta.
        </p>

        {/* Abas de PERFIL — decidem em qual coleção do banco buscar/criar */}
        <div className="tabs-perfil">
          {TIPOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => {
                setErro("");
                mudarPerfil(tipo);
              }}
              className={`tab ${perfil === tipo ? "tab-ativo" : ""}`}
            >
              {PERFIS[tipo].label}
            </button>
          ))}
        </div>

        {/* Abas de MODO — entrar com conta existente ou criar conta nova */}
        <div className="tabs-modo">
          {["login", "cadastro"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setErro("");
                setModo(m);
              }}
              className={`tab-modo ${modo === m ? "tab-modo-ativo" : ""}`}
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {erro && (
          <p className="aviso-erro" style={{ margin: "0 0 14px" }}>
            {erro}
          </p>
        )}

        <form onSubmit={onSubmit} className="formulario">
          {modo === "login" ? (
            <>
              {/* ---- MODO LOGIN: email + senha (igual para os 3 perfis) ---- */}
              <div className="campo-form">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={campos.email || ""}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className="campo-form">
                <label>Senha</label>
                <input
                  name="senha"
                  type="password"
                  placeholder="Sua senha"
                  value={campos.senha || ""}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </>
          ) : (
            /* ---- MODO CADASTRO: campos dinâmicos do perfil escolhido ----
               (vêm de PERFIS[perfil].campos no constants.js) */
            PERFIS[perfil].campos.map((campo) => (
              <div key={campo.name} className="campo-form">
                <label>{campo.label}</label>
                {campo.type === "select" ? (
                  <select
                    name={campo.name}
                    value={campos[campo.name] || ""}
                    onChange={handleChange}
                    required
                    className="select"
                  >
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    {campo.options.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={campo.name}
                    type={campo.type}
                    placeholder={campo.placeholder}
                    value={campos[campo.name] || ""}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                )}
              </div>
            ))
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn btn-primario btn-grande"
            style={{ width: "100%", marginTop: 4 }}
          >
            {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : `Cadastrar ${PERFIS[perfil].label}`}
          </button>
        </form>

        <button type="button" onClick={onVoltarLoja} className="btn btn-contorno auth-voltar-loja">
          ← Continuar navegando como visitante
        </button>
      </div>
    </div>
  );
}
