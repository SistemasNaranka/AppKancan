import React, { useRef, useState } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
} from '@mui/material';
import { AutoAwesome as SparkIcon, Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { AZUL } from '../../page/VacantesPage';
import { Postulacion, EstadoContratacion } from '../directus/read';
import { ResultadoIA } from '../ia';
import { analizarHojasDeVida } from './analizarHojasDeVida';
import PasoConfigurar from '../../components/PasoConfigurar';
import PasoAnalizando from '../../components/PasoAnalizando';
import PanelResultado from '../../components/PanelResultado';

  

type Paso = 'configurar' | 'analizando';

interface Props {
  postulaciones: Postulacion[];
  visibles: Postulacion[]; // filas de la tabla con filtros, en su orden
  cargoInicial: string;
  onCambiarEstado: (id: number, nuevo: EstadoContratacion) => void;
}

const AsistenteIA: React.FC<Props> = ({ postulaciones, visibles, cargoInicial, onCambiarEstado }) => {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>('configurar');
  const [seleccion, setSeleccion] = useState<Postulacion[]>([]);
  const [cargoSel, setCargoSel] = useState('');
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [resultadoAbierto, setResultadoAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlRef = useRef<AbortController | null>(null);

  const detener = () => {
    controlRef.current?.abort();
    controlRef.current = null;
  };

  const cerrar = () => {
    detener();
    setError(null);
    setAbierto(false);
    setPaso('configurar'); // al reabrir siempre arranca en Configurar
  };

  const analizar = async (sel: Postulacion[], cargo: string) => {
    detener();
    const control = new AbortController();
    controlRef.current = control;

    setSeleccion(sel);
    setCargoSel(cargo);
    setError(null);
    setPaso('analizando');

    try {
      const r = await analizarHojasDeVida(cargo, sel, control.signal);
      if (controlRef.current !== control) return; // llegó tarde: ya se canceló o hay otro análisis
      setResultado(r);
      setAbierto(false);
      setPaso('configurar');
      setResultadoAbierto(true);
    } catch (err) {
      if (control.signal.aborted) return; // cancelado a propósito, no es error
      console.error('[vacantes] Falló el análisis de IA:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      if (controlRef.current === control) controlRef.current = null;
    }
  };

  const cancelar = () => {
    detener();
    setError(null);
    setPaso('configurar');
  };

  return (
    <>
      <Fab
        variant="extended"
        onClick={() => setAbierto(true)}
        sx={{
          position: 'fixed', bottom: 24, right: 24,
          zIndex: (t) => t.zIndex.speedDial,
          bgcolor: AZUL, color: '#fff', gap: 1, px: 3,
          textTransform: 'none', fontWeight: 700,
          '&:hover': { bgcolor: '#003366' },
        }}
      >
        <SparkIcon /> IA asistente
      </Fab>

      {resultado && !resultadoAbierto && (
        <Fab
          variant="extended" size="medium"
          onClick={() => setResultadoAbierto(true)}
          sx={{
            position: 'fixed', bottom: 88, right: 24,
            zIndex: (t) => t.zIndex.speedDial,
            bgcolor: '#fff', color: AZUL, border: `1px solid ${AZUL}`, gap: 1,
            textTransform: 'none', fontWeight: 700,
            '&:hover': { bgcolor: '#E6EEF5' },
          }}
        >
          <HistoryIcon fontSize="small" /> Último resultado
        </Fab>
      )}

      <Dialog
        open={abierto}
        onClose={(_, reason) => {
          // Durante el análisis, un clic afuera no lo cierra por accidente
          if (paso === 'analizando' && reason === 'backdropClick') return;
          cerrar();
        }}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: AZUL, color: '#fff' }}>
          <SparkIcon />
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={700}>IA asistente</Typography>
            <Typography fontSize="0.8rem" sx={{ opacity: 0.85 }}>
              Compara hojas de vida y sugiere un orden
            </Typography>
          </Box>
          <IconButton onClick={cerrar} sx={{ color: '#fff' }} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {paso === 'configurar' && (
            <PasoConfigurar
              postulaciones={visibles}
              cargoInicial={cargoInicial}
              onAnalizar={analizar}
            />
          )}
          {paso === 'analizando' && (
            <PasoAnalizando
              seleccion={seleccion}
              cargo={cargoSel}
              error={error}
              onCancelar={cancelar}
            />
          )}
        </DialogContent>
      </Dialog>

      <PanelResultado
        resultado={resultado}
        open={resultadoAbierto}
        onClose={() => setResultadoAbierto(false)}
        postulaciones={postulaciones}
        onCambiarEstado={onCambiarEstado}
      />
    </>
  );
};

export default AsistenteIA;