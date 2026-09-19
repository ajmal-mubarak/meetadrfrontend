import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, mobile: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  quickLoginAs: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionUser = await authService.getCurrentSession();
        if (sessionUser) {
          setUser(sessionUser);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, mobile: string, role: UserRole = 'patient') => {
    setIsLoading(true);
    try {
      const registeredUser = await authService.register(name, email, password, mobile, role);
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const quickLoginAs = async (role: UserRole): Promise<User> => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      patient: { email: 'patient@meetadr.demo', pass: 'Patient@123' },
      doctor: { email: 'doctor@meetadr.demo', pass: 'Doctor@123' },
      hospital: { email: 'hospital@meetadr.demo', pass: 'Hospital@123' },
      admin: { email: 'admin@meetadr.demo', pass: 'Admin@123' },
    };

    const target = creds[role];
    return await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
