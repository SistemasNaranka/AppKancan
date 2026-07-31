import { EditNote as EditNoteIcon, SupervisorAccount as SupervisorAccountIcon, Warning as WarningIcon } from '@mui/icons-material';

export const COLORS_FOR_MOTIVO = [
  { bg: '#e3f2fd', text: '#0d47a1' }, { bg: '#e8f5e9', text: '#1b5e20' }, { bg: '#fff3e0', text: '#e65100' }, { bg: '#fce4ec', text: '#880e4f' },
  { bg: '#f3e5f5', text: '#4a148c' }, { bg: '#e0f7fa', text: '#006064' }, { bg: '#f1f8e9', text: '#33691e' }, { bg: '#ffebee', text: '#b71c1c' },
  { bg: '#fff8e1', text: '#f57f17' }, { bg: '#e8eaf6', text: '#1a237e' }, { bg: '#fbe9e7', text: '#bf360c' }, { bg: '#e0f2f1', text: '#004d40' }
];

export const getColorForMotivo = (m: string) => {
  let h = 0;
  for (let i = 0; i < m.length; i++) h = m.charCodeAt(i) + ((h << 5) - h);
  return COLORS_FOR_MOTIVO[Math.abs(h) % COLORS_FOR_MOTIVO.length];
};

export type SortField = 'nombre' | 'totalEmpleados' | 'personasRegistradas' | 'incompletos' | 'sinRegistro';

export const OPCIONES_ORDEN: { value: SortField; label: string }[] = [
  { value: 'nombre', label: 'Tienda' }, { value: 'totalEmpleados', label: 'Empleados Act.' }, { value: 'personasRegistradas', label: 'Pers. Registradas' },
  { value: 'incompletos', label: 'Días Incompletos' }, { value: 'sinRegistro', label: 'Días Sin Marcar' }
];

export const COLUMNAS_TIENDAS: { label: string; value: SortField | null }[] = [
  { label: 'TIENDA', value: 'nombre' }, { label: 'EMPLEADOS ACT.', value: 'totalEmpleados' }, { label: 'PERS. REGISTRADAS', value: 'personasRegistradas' },
  { label: 'DÍAS INCOMPLETOS', value: 'incompletos' }, { label: 'DÍAS SIN MARCAR', value: 'sinRegistro' }, { label: 'ACCIONES', value: null }
];

export const COLUMNAS_EDICIONES = ['FECHA', 'EMPLEADO', 'TIENDA', 'REGISTRO', 'HORA ORIG.', 'HORA MOD.', 'MOTIVO', 'OBSERVACIONES'];

export const TARJETAS_ESTADISTICAS = [
  { icon: EditNoteIcon, label: 'TOTAL MODIFICACIONES', color: '#c62828', bg: '#ffebee' },
  { icon: SupervisorAccountIcon, label: 'EMPLEADOS MONITOREADOS', color: '#0d47a1', bg: '#e3f2fd' },
  { icon: WarningIcon, label: 'TIENDA CON MÁS CAMBIOS', color: '#f57f17', bg: '#fff8e1' }
];

export interface TiendaResumen { id: number; nombre: string; totalEmpleados: number; personasRegistradas: number; completados: number; incompletos: number; sinRegistro: number; }
export interface MonitoreoPageProps { storeId?: number | null; }
export const rowsPerPage = { tiendas: 10, ediciones: 10, ranking: 10 };
