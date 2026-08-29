import { createContext, useContext, useState } from "react";
import { getStoredUser } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "hotelUser";

// Provide the logged-in user and login/logout helpers to the app.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  // Save the user from login/register into localStorage and state.
  function login(nextUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  // Clear the saved user.
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  const value = {
    user,
    login,
    logout,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Read auth state from the nearest AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
