import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Accesses authenticated user state, registration, login, logout, and scan history actions.
 *
 * @returns {object} { user, token, isAuthenticated, login, register, logout, history, addToHistory, removeFromHistory }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
