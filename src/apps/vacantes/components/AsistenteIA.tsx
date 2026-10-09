import React, { useCallback, useState } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
} from '@mui/material';
import { AutoAwesome as SparkIcon, Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { AZUL } from '../page/VacantesPage';
import { Postulacion, EstadoContratacion } from '../api/directus/read';
import { ResultadoIA, generarResultadoEjemplo } from '../api/ia';
import PasoConfigurar from './PasoConfigurar';
import PasoAnalizando from './PasoAnalizando';
import PanelResultado from './PanelResultado';

type Paso = 'configurar' | 'analizando';

interface Props {
  postulaciones: Postulacion[];
  cargoInicial: string;
  ciudadInicial: string;
  onCambiarEstado: (id: number, nuevo: EstadoContratacion) => void;
}

const AsistenteIA: React.FC<Props> = ({ postulaciones, cargoInicial, ciudadInicial, onCambiarEstado }) => {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>('configurar');
  const [seleccion, setSeleccion] = useState<Postulacion[]>([]);
  const [cargoSel, setCargoSel] = useState('');
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [resultadoAbierto, setResultadoAbierto] = useState(false);

  const cerrar = () => {
    setAbierto(false);
    setPaso('configurar'); // al reabrir siempre arranca en Configurar
  };

  const analizar = (sel: Postulacion[], cargo: string) => {
    setSeleccion(sel);
    setCargoSel(cargo);
    setPaso('analizando');
  };

  const cancelar = useCallback(() => setPaso('configurar'), []);

  const terminar = useCallback(() => {
    setResultado(generarResultadoEjemplo(seleccion, cargoSel)); // TEMPORAL hasta tener el backend
    setAbierto(false);
    setPaso('configurar');
    setResultadoAbierto(true);
  }, [seleccion, cargoSel]);

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
              postulaciones={postulaciones}
              cargoInicial={cargoInicial}
              ciudadInicial={ciudadInicial}
              onAnalizar={analizar}
            />
          )}
          {paso === 'analizando' && (
            <PasoAnalizando
              seleccion={seleccion}
              cargo={cargoSel}
              onCancelar={cancelar}
              onTerminar={terminar}
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