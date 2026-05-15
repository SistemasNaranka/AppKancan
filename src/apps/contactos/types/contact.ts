// src/apps/contactos/types/contact.ts

export interface Contactos {
  id: number;
  date_created?: string;    // ← agregado
  full_name: string;
  phone_number: string;
  email: string;
  department: string;
  department_id?: number;
  visibility_type: 'Universal' | 'Restringido' | 'Inactivo';
  iniciales?: string;
  color?: string;
}

export interface CreateContactoInput {
  full_name: string;
  phone_number: string;
  email: string;
  department_id: number | null;
  visibility_type: 'Universal' | 'Restringido' | 'Inactivo';
}