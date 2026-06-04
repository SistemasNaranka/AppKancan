import { API_URL } from '../utils/constants';

interface User {
  tienda: string;
}

interface Empleado {
  id: number | string;
  nombre: string;
  tienda: string;
  estado: string;
}

interface Registro {
  id: number | string;
  empleado: { id: string | number; nombre: string };
  evento: string;
  fecha: string;
  hora: string;
  observaciones?: string;
}

// Obtener token del localStorage (debe guardarse tras login)
const getToken = (): string | null => {
  const auth = localStorage.getItem('directus_auth');
  if (!auth) return null;
  try {
    const parsed = JSON.parse(auth);
    return parsed.access_token || null;
  } catch {
    return null;
  }
};

// Petición genérica
const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.errors?.[0]?.message || `Error ${res.status}`);
  }
  return res.json();
};

// Obtener usuario actual (para la tienda)
export const getCurrentUser = async (): Promise<User> => {
  const data = await request<{ data: User }>('/users/me?fields=tienda');
  return data.data;
};

// Obtener empleados activos de una tienda
export const getEmployees = async (tiendaId: string): Promise<Empleado[]> => {
  const filter = { tienda: { _eq: tiendaId }, estado: { _eq: 'Activo' } };
  const params = new URLSearchParams({
    filter: JSON.stringify(filter),
    fields: 'id,nombre,tienda',
  });
  const data = await request<{ data: Empleado[] }>(`/items/empleados?${params}`);
  return data.data;
};

// Obtener registros de una fecha específica
export const getRegisters = async (fecha: string): Promise<Registro[]> => {
  const filter = { fecha: { _eq: fecha } };
  const params = new URLSearchParams({
    filter: JSON.stringify(filter),
    fields: 'id,evento,hora,observaciones,empleado.id,empleado.nombre',
  });
  const data = await request<{ data: Registro[] }>(`/items/registros?${params}`);
  return data.data;
};

// Crear un registro (marcación)
export const createRegister = async (data: {
  empleado: string | number;
  evento: string;
  tienda: string;
  fecha: string;
  hora: string;
}): Promise<Registro> => {
  const res = await request<{ data: Registro }>('/items/registros', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
};

// Actualizar observación de un registro
export const updateObservation = async (id: string | number, observacion: string): Promise<Registro> => {
  const res = await request<{ data: Registro }>(`/items/registros/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ observaciones: observacion }),
  });
  return res.data;
};