// hooks/useIsAdmin.js
import { useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { useAuth } from '../context/AuthContext'; // adjust path

export function useIsAdmin() {
  const location = useLocation();
  const { session } = useAuth();
  const isAdminRoute = location.pathname === '/admin';
  return isAdminRoute && !!session;
}
