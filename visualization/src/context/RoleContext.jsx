import { createContext, useContext, useState } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api/api';

const RoleContext = createContext(null);

const ROLES = ['operational', 'analytical', 'management'];
const ROLE_RANK = { operational: 0, analytical: 1, management: 2 };
const STORAGE_KEY = 'iifsa_user';

export function canAccess(userRole, requiredRole) {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function RoleProvider({ children }) {
  const [user, setUser] = useState(readSession);
  const [devRole, setDevRole] = useState(null);

  const effectiveRole = devRole || user?.role || 'operational';
  const isAuthenticated = !!user;

  const login = async (credentials) => {
    const loggedIn = await apiLogin(credentials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    setUser(loggedIn);
    return loggedIn;
  };

  const signup = async (userData) => {
    const newUser = await apiSignup(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setDevRole(null);
  };

  return (
    <RoleContext.Provider value={{
      user, effectiveRole, devRole, setDevRole,
      loading: false, isAuthenticated, login, logout, signup, ROLES,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
