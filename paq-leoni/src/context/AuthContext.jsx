//Ce fichier sert à gérer l'utilisateur connecté dans toute l'application.

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ✅ Login : stocker user + token
  const login = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setToken(accessToken);
    // Stocker en sessionStorage pour persister au refresh de page
    sessionStorage.setItem("access_token", accessToken);
    sessionStorage.setItem("refresh_token", refreshToken);
    sessionStorage.setItem("user", JSON.stringify(userData));
  };

  // ✅ Logout : tout vider
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
  };

  // ✅ Restaurer la session au rechargement de page
  const restoreSession = () => {
    const storedToken = sessionStorage.getItem("access_token");
    const storedUser  = sessionStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
}
