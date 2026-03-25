import { useCurvas } from '../contexts/CurvasContext';

/**
 * Hook personalizado para acceder a los datos de curvas
 * 
 * Este hook es un wrapper del contexto CurvasContext para mantener
 * compatibilidad con componentes que usan la interfaz anterior.
 * 
 * Proporciona:
 * - Estado de los archivos subidos
 * - Datos procesados listos para usar en el dashboard
 */
export const useCurvasData = () => {
  const { 
    archivos, 
    datosCurvas, 
    procesarArchivo, 
    limpiarDatos,
    permissions,
    userRole,
  } = useCurvas();

  // Obtener archivo por tipo
  const getArchivoPorTipo = (tipo: 'matriz_general' | 'detalle_producto_a' | 'detalle_producto_b') => {
    return archivos.find((a) => a.tipo === tipo);
  };

  return {
    archivos,
    datosCurvas,
    procesarArchivo,
    limpiarDatos,
    getArchivoPorTipo,
    permissions,
    userRole,
  };
};

export default useCurvasData;
