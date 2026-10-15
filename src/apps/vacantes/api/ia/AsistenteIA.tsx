import React, { useRef, useState, useEffect } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
} from '@mui/material';
import { AutoAwesome as SparkIcon, Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { AZUL } from '../../page/VacantesPage';
import { Postulacion, EstadoContratacion, getCargos } from '../directus/read';
import { guardarAnalisisIA } from '../directus/write';
import { ResultadoIA, CandidatoEvaluado } from '../ia';
import { analizarHojasDeVida } from './analizarHojasDeVida';
import PasoConfigurar from '../../components/PasoConfigurar';
import PasoAnalizando from '../../components/PasoAnalizando';
import PanelResultado from '../../components/PanelResultado';
import ModalAnalisisIA from '../../components/ModalAnalisisIA';

type Paso = 'configurar' | 'analizando';

interface Props {
  postulaciones: Postulacion[];
  cargoInicial: string;
  ciudadInicial: string;
  onCambiarEstado: (id: number, nuevo: EstadoContratacion) => void;
  candidatoParaIA?: Postulacion | null;
  onLimpiarCandidatoParaIA?: () => void;
}

const AsistenteIA: React.FC<Props> = ({
  postulaciones, cargoInicial, ciudadInicial, onCambiarEstado,
  candidatoParaIA, onLimpiarCandidatoParaIA,
}) => {
  const queryClient = useQueryClient();

  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>('configurar');
  const [seleccion, setSeleccion] = useState<Postulacion[]>([]);
  const [cargoSel, setCargoSel] = useState('');
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [resultadoAbierto, setResultadoAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalIndividualAbierto, setModalIndividualAbierto] = useState(false);
  const [candidatoBase, setCandidatoBase] = useState<Postulacion | null>(null);
  const [candidatoEvaluado, setCandidatoEvaluado] = useState<CandidatoEvaluado | null>(null);
  const [cargoIndividual, setCargoIndividual] = useState('');
  const [fechaIndividual, setFechaIndividual] = useState<Date | null>(null);
  const [cargandoIndividual, setCargandoIndividual] = useState(false);
  const [errorIndividual, setErrorIndividual] = useState<string | null>(null);

  const controlRef = useRef<AbortController | null>(null);

  const detener = () => {
    controlRef.current?.abort();
    controlRef.current = null;
  };

  const cerrar = () => {
    detener();
    setError(null);
    setAbierto(false);
    setPaso('configurar');
  };

  const cerrarModalIndividual = () => {
    detener();
    setModalIndividualAbierto(false);
    setCandidatoBase(null);
    setCandidatoEvaluado(null);
    setErrorIndividual(null);
    setCargandoIndividual(false);
  };

  // Análisis múltiple
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
      if (controlRef.current !== control) return;

      // ⭐ Guardar TODOS los análisis en Directus
      try {
        const aGuardar = r.ranking.filter((c) => c.evaluado !== false);
        await Promise.all(
          aGuardar.map((c) =>
            guardarAnalisisIA(c.postulacion.id, c.puntaje, {
              fortalezas: c.fortalezas,
              aVerificar: c.aVerificar,
              resumen: r.resumen,
              cargo,
            })
          )
        );
        console.log(`[IA] ✅ ${aGuardar.length} análisis guardados`);
        queryClient.invalidateQueries({ queryKey: ['vacantes-postulaciones'] });
      } catch (err) {
        console.error('[IA] Error guardando análisis múltiples:', err);
      }

      setResultado(r);
      setAbierto(false);
      setPaso('configurar');
      setResultadoAbierto(true);
    } catch (err) {
      if (control.signal.aborted) return;
      console.error('[vacantes] Falló el análisis:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      if (controlRef.current === control) controlRef.current = null;
    }
  };

  // Análisis individual (desde el ✨ de la tabla)
  const analizarIndividual = async (p: Postulacion, cargo: string) => {
    detener();
    const control = new AbortController();
    controlRef.current = control;

    setCandidatoBase(p);
    setCandidatoEvaluado(null);
    setCargoIndividual(cargo);
    setFechaIndividual(null);
    setErrorIndividual(null);
    setCargandoIndividual(true);
    setModalIndividualAbierto(true);

    try {
      const r = await analizarHojasDeVida(cargo, [p], control.signal);
      if (controlRef.current !== control) return;

      const candidato = r.ranking[0];
      if (!candidato) {
        setErrorIndividual('La IA no devolvió resultado.');
        setCargandoIndividual(false);
        return;
      }

      // ⭐ Guardar en Directus (solo si fue evaluado por la IA)
      if (candidato.evaluado !== false) {
        try {
          await guardarAnalisisIA(p.id, candidato.puntaje, {
            fortalezas: candidato.fortalezas,
            aVerificar: candidato.aVerificar,
            resumen: r.resumen,
            cargo,
          });
          console.log(`[IA] ✅ Análisis guardado para ${p.full_name}`);
          queryClient.invalidateQueries({ queryKey: ['vacantes-postulaciones'] });
        } catch (err) {
          console.error('[IA] No se pudo guardar:', err);
        }
      }

      setCandidatoEvaluado(candidato);
      setFechaIndividual(r.fecha);
      setCargandoIndividual(false);
    } catch (err) {
      if (control.signal.aborted) return;
      console.error('[vacantes] Falló el análisis individual:', err);
      setErrorIndividual(err instanceof Error ? err.message : 'Error desconocido');
      setCargandoIndividual(false);
    } finally {
      if (controlRef.current === control) controlRef.current = null;
    }
  };

  useEffect(() => {
    if (!candidatoParaIA) return;

    const cargo = cargoInicial || (getCargos(candidatoParaIA)[0] ?? '');
    if (!cargo) {
      alert('Este candidato no tiene un cargo asociado.');
      onLimpiarCandidatoParaIA?.();
      return;
    }

    analizarIndividual(candidatoParaIA, cargo);
    onLimpiarCandidatoParaIA?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatoParaIA]);

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
          <IconButton onClick={cerrar} sx={{ color: '#fff' }}>
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

      <ModalAnalisisIA
        open={modalIndividualAbierto}
        onClose={cerrarModalIndividual}
        cargo={cargoIndividual}
        candidato={candidatoEvaluado}
        candidatoBase={candidatoBase}
        fecha={fechaIndividual}
        cargando={cargandoIndividual}
        error={errorIndividual}
        postulacionViva={
          candidatoBase
            ? postulaciones.find(x => x.id === candidatoBase.id) ?? null
            : null
        }
        onCambiarEstado={onCambiarEstado}
      />
    </>
  );
};

export default AsistenteIA;