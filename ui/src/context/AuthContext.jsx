import { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { login as apiLogin, registrar as apiRegistrar } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const nome = localStorage.getItem("nome");
    const papel = localStorage.getItem("papel");
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { nome, papel, id, token };
  });

  const login = useCallback(async (papel, email, senha) => {
    const data = await apiLogin(papel, email, senha);
    localStorage.setItem("token", data.token);
    localStorage.setItem("papel", data.papel);
    localStorage.setItem("nome", data.nome);
    localStorage.setItem("id", data.id);
    setUsuario({ token: data.token, papel: data.papel, nome: data.nome, id: data.id });
  }, []);

  const registrar = useCallback(async (papel, dados) => {
    const data = await apiRegistrar(papel, dados);
    localStorage.setItem("token", data.token);
    localStorage.setItem("papel", data.papel);
    localStorage.setItem("nome", data.nome);
    localStorage.setItem("id", data.id);
    setUsuario({ token: data.token, papel: data.papel, nome: data.nome, id: data.id });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("papel");
    localStorage.removeItem("nome");
    localStorage.removeItem("id");
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
