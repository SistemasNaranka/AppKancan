import { createContext } from "react";

export type App = {
  id: string;
  nombre: string;
  ruta: string;
  // otros campos de la colección que quieras tipar
};
//Tipado de objeto con id y email en string o null
export type User = {
  email: string;
  id: string;
  nombre: string;
  apellido: string;
  company: string;
  ultra_code: string;
  rol?: string;
  store_id?: string | number;
  store_name?: string;
  policies?: string[];
  requires_password_change?: boolean;
  ia_key?: string; // API key de Gemini para extracción de facturas (encriptada en Directus)
  models_ia?: any; // Modelos de IA a usar para extracción en formato JSON (ej: [{"name": "gemini-3.6-flash"}, ...])
} | null;

export type AuthContextType = {
  user: User;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Creacion de contexto
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
