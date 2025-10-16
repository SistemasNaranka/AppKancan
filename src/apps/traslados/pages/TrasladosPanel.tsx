import React, { useMemo, useState } from 'react';
import { PanelPendientes } from '../components/PanelPendientes';
import PanelSeleccionados from '../components/PanelSeleccionados';
import type { Traslado } from '../components/TrasladoCard';
import { Box, } from '@mui/material';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { MOCK_TRASLADOS,Listas_Bodegas } from '../date/mockData';

// Aqui trabajaremos con estos datos mientras eso.
const TrasladosPanel: React.FC = () => {
  const [pendientes, setPendientes] = useState<Traslado[]>(MOCK_TRASLADOS);
  const [seleccionados, setSeleccionados] = useState<Traslado[]>([]);
  const [, setAprobados] = useState<Traslado[]>([]);
  const [filtroBodega, setFiltroBodega] = useState<string>('');
  const [filtroNombre, setFiltroNombre] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // mensaje de aprobacion 
  const [snackbarOpen, setSnackbarOpen] = useState(false);


  // Para compatibilidad con PanelSeleccionados
  const [checkedSeleccionados, setCheckedSeleccionados] = useState<number[]>([]);

  // Filtrado de pendientes por bodega/nombre
 const filtrados = useMemo(() => {
  return pendientes.filter(t => {
    const byBodega = filtroBodega
      ? t.nombre_Origen === filtroBodega || t.nombre_Destino === filtroBodega
      : true;

    const byNombre = filtroNombre
      ? [t.nombre_Origen, t.nombre_Destino, t.bodega_Origen, t.bodega_Destino]
          .some(field => field?.toLowerCase().includes(filtroNombre.toLowerCase()))
      : true;

    return byBodega && byNombre;
  });
}, [pendientes, filtroBodega, filtroNombre]);

  // Mueve todos los filtrados de pendientes a seleccionados
  const handleAprobarTodosPendientes = () => {
    if (filtrados.length === 0) return;
    setLoading(true);
    // Simular proceso
    setTimeout(() => {
      // Añadir a seleccionados (sin duplicados por id)
      setSeleccionados(prev => {
        const ids = new Set(prev.map(p => p.id));
        const nuevos = filtrados.filter(t => !ids.has(t.id)).map(t => ({...t,estado:'Embarque'}));
        return [...prev, ...nuevos];
      });
      // Eliminar de pendientes
      setPendientes(prev => prev.filter(p => !filtrados.some(f => f.id === p.id)));
      setLoading(false);
         }, 400);
  };

  
  // Mover un solo traslado de pendientes a seleccionados (al hacer click)
  const handlePasarTrasladoSeleccionado = (traslado: Traslado) => {
    // evitar duplicados
    setSeleccionados(prev => (prev.some(p => p.id === traslado.id) ? prev : [...prev, traslado]));
    setPendientes(prev => prev.filter(p => p.id !== traslado.id));
  };

  // Aprobar todos los seleccionados -> pasar a aprobados (y borrarlos de seleccionados)
  const handleAprobarTodosSeleccionados = () => {
    if (seleccionados.length === 0) return;
    setLoading(true);
    setTimeout(() => {
      // mover todos seleccionados a aprobados con fecha de aprobación actual
      setAprobados(prev => {
        const now = new Date().toISOString();
        const nuevos = seleccionados.map(s => ({ ...s, fechaAprobacion: now }));
        return [...prev, ...nuevos];
      });
      setSeleccionados([]);
      setCheckedSeleccionados([]);
      setLoading(false);

      //mensaje
     setSnackbarOpen(true);
    }, 500);
  };

  // Seleccionar todos en panel seleccionados (por ids)
 
  const deseleccionarTodosSeleccionados = () => {
    if (seleccionados.length === 0) return ;

    setLoading(false);
    
    setTimeout(() =>{
      setPendientes(prev => {

        //aqui añadimos todos los selecionados, (esta es opcional )

      const idsEnPendientes = new Set(prev.map(p => p.id));
      const nuevos = seleccionados.filter(s => !idsEnPendientes.has(s.id));
      return [...prev, ...nuevos];
    });

    //limpiamos los array selecionados 
    setSeleccionados([]);
    setCheckedSeleccionados([]);
    
    setLoading(false);

    },400);

  };

  // Devolver traslado a pendientes al hacer clic en la X
  const handleDevolverTraslado = (traslado: Traslado) => {
    setPendientes(prev => [...prev, traslado]);
    setSeleccionados(prev => prev.filter(t => t.id !== traslado.id));
  };

  return (
    <Box>
      <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <PanelPendientes
          totalPendientes={pendientes.length}
            filtroBodega={filtroBodega}
            setFiltroBodega={setFiltroBodega}
            filtroNombre={filtroNombre}
            setFiltroNombre={setFiltroNombre}
            filtrados={filtrados}
            todasLasBodegas={Listas_Bodegas} 
            handleAprobarTodosPendientes={handleAprobarTodosPendientes}
            loading={loading}
            onTrasladoClick={handlePasarTrasladoSeleccionado}
          />
          <PanelSeleccionados
            seleccionados={seleccionados}
            checkedSeleccionados={checkedSeleccionados}
            setCheckedSeleccionados={setCheckedSeleccionados}
            deseleccionarTodosSeleccionados={deseleccionarTodosSeleccionados}
            handleAprobarTodosSeleccionados={handleAprobarTodosSeleccionados}
            loading={loading}
            onDevolverTraslado={handleDevolverTraslado}
          />
        </Box>
      </Box>

      <Snackbar // perzonalizacion de color de exito
  open={snackbarOpen}
  autoHideDuration={3000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <Alert
    onClose={() => setSnackbarOpen(false)}
    severity="success"
    variant="filled"
    sx={{
      width: '100%',
      backgroundColor: 'success.main', 
      color: 'success.contrastText',
      fontWeight: 'bold',
      fontSize: '1rem',
      '& .MuiAlert-icon': {
        color: 'success.contrastText'
      }
    }}
  >
    Traslados aprobados con éxito
  </Alert>
</Snackbar>
    </Box>
  );

   };

export default TrasladosPanel;