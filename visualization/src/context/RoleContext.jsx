import { createContext, useContext, useState, useEffect } from 'react';
import { getAuthMe } from '../api/api';

const RoleContext = createContext(null);

const ROLES = ['operational', 'analytical', 'management'];

// Hierarchical access: management > analytical > operational
const ROLE_RANK = { operational: 0, analytical: 1, management: 2 };

export function canAccess(userRole, requiredRole) {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [devRole, setDevRole] = useState(null); // dev-only override
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const effectiveRole = devRole || user?.role || 'operational';

  return (
    <RoleContext.Provider value={{ user, effectiveRole, devRole, setDevRole, loading, ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
