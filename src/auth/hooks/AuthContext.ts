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
  empresa: string;
  codigo_ultra: string;
  rol?: string;
  tienda_id?: number;
  policies?: string[];
  requires_password_change?: boolean;
  key_gemini?: string; // API key de Gemini para extracción de facturas (encriptada en Directus)
  modelo_ia?: string; // Modelo de IA a usar para extracción de facturas (ej: gemma-3-27b-it)
} | null;
/**
 *  Tipado de los valores que otorgara el Provider a sus hijos
 */
export type AuthContextType = {
  user: User;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
/**
 *  Contexto que abarca sobre los datos del autenticado
 */
// Creacion de contexto
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
