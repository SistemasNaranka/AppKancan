import { useCurvas } from '../contexts/CurvasContext';

export const useCurvasData = () => {
  const { 
    archivos, 
    datosCurvas, 
    procesarArchivo, 
    limpiarDatos,
    permissions,
    userRole,
  } = useCurvas();

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
