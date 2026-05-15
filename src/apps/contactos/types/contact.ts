export interface CreateContactoInput {
  full_name: string;
  phone_number: string;
  email: string;
  department: string;
  // Actualiza esto para que coincida con el Modal y la Tabla
  visibility_type: 'Universal' | 'Restringido' | 'Inactivo' | 'Public' | 'Internal' | 'Private'; 
}

export interface Contactos extends CreateContactoInput {
  id: number;
  color?: string;
  iniciales?: string;
  date_created?: string;
}