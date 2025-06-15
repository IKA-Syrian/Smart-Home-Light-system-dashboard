import { createContext } from 'react';
import { User } from '../types/api';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
