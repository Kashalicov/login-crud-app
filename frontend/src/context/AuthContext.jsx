import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem("usuario");
    return salvo ? JSON.parse(salvo) : null;
  });

  useEffect(() => {
    if (usuario) {
      localStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      localStorage.removeItem("usuario");
    }
  }, [usuario]);

  async function login(email, senha) {
    const { data } = await api.post("/auth/login", { email, senha });
    localStorage.setItem("token", data.token);
    setUsuario(data.usuario);
  }

  async function registrar(nome, email, senha) {
    const { data } = await api.post("/auth/registrar", { nome, email, senha });
    localStorage.setItem("token", data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
