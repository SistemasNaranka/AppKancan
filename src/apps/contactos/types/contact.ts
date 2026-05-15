// src/apps/contactos/types/types.ts

export interface Contactos {
  id: number;
  date_created?: string;
  date_updated?: string;
  full_name: string;
  phone_number: string;
  email: string;
  department: string;
  visibility_type: 'Public' | 'Private' | 'Internal';
  // Calculados en frontend
  iniciales?: string;
  color?: string;
}

export interface CreateContactoInput {
  full_name: string;
  phone_number: string;
  email: string;
  department: string;
  visibility_type: 'Public' | 'Private' | 'Internal';
}