export interface Contactos {
  id: number;
  date_created?: string;
  full_name: string;
  phone_number: string;
  email: string;
  department_id?: string;
  department_name?: string;
  visibility_type: 'Universal' | 'Restringido' | 'Inactivo';
  iniciales?: string;
  color?: string;
}

export interface CreateContactoInput {
  full_name: string;
  phone_number: string;
  email: string;
  department_id?: string;
  visibility_type: 'Universal' | 'Restringido' | 'Inactivo';
}