import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Checkbox, Avatar, Button, Alert, Chip
} from '@mui/material';
import { AutoAwesome as SparkIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG, CARGOS } from '../page/VacantesPage';
import { getCargos, Postulacion } from '../api/directus/read';

const MAX_HOJAS = 10;

interface Props {
  postulaciones: Postulacion[]; // Son las 10 de la página actual
  cargoInicial: string;
  onAnalizar: (seleccion: Postulacion[], cargo: string) => void;
}

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

const PasoConfigurar: React.FC<Props> = ({ postulaciones, cargoInicial, onAnalizar }) => {
  const [filas] = useState(postulaciones);

  // Filtros opcionales
  const [cargo, setCargo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [manual, setManual] = useState<Set<number> | null>(null);

  // 1. Filtrar SOLO los pendientes (Sin analizar y con CV)
  const pendientes = useMemo(() => {
    return filas.filter(p =>
      (p.ai_score == null || p.ai_score === 0) &&
      Boolean(p.cv)
    );
  }, [filas]);

  // 2. Extraer opciones para los filtros
  const cargosDisponibles = useMemo(() => {
    const c = new Set<string>();
    pendientes.forEach(p => getCargos(p).forEach(cg => c.add(cg)));
    return Array.from(c).sort();
  }, [pendientes]);

  const ciudadesDisponibles = useMemo(() => {
    const c = new Set<string>();
    pendientes.forEach(p => { if (p.city) c.add(p.city); });
    return Array.from(c).sort();
  }, [pendientes]);

  // 3. Aplicar filtros a los pendientes
  const candidatos = useMemo(() => {
    return pendientes.filter(p => {
      const matchCargo = cargo === '' || getCargos(p).includes(cargo);
      const matchCiudad = ciudad === '' || p.city === ciudad;
      return matchCargo && matchCiudad;
    });
  }, [pendientes, cargo, ciudad]);

  // 4. Selección automática de los primeros 10 (o los que haya)
  const seleccion = manual
    ? candidatos.filter((p) => manual.has(p.id))
    : candidatos.slice(0, MAX_HOJAS);

  const idsSel = new Set(seleccion.map((p) => p.id));
  const n = seleccion.length;
  const lleno = n >= MAX_HOJAS;

  // Si cambian los filtros, reiniciamos la selección manual para autoseleccionar
  React.useEffect(() => {
    setManual(null);
  }, [cargo, ciudad]);

  const alternar = (id: number) => {
    const s = new Set(idsSel);
    if (s.has(id)) s.delete(id);
    else if (!lleno) s.add(id);
    else return;
    setManual(s);
  };

  // Qué cargo enviar al backend si se analiza
  const cargoAEnviar = cargo !== '' ? cargo : (getCargos(seleccion[0])[0] || cargoInicial || 'Todos');

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3, mt: 3 }}>

      {/* COLUMNA IZQUIERDA: Filtros y Botón */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        <Typography fontSize="0.85rem" color="#64748B" fontWeight={600}>
          Filtrar pendientes de esta página
        </Typography>

        <TextField
          select size="small" label="Cargo (Opcional)" value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        >
          <MenuItem value=""><em>Todos los cargos</em></MenuItem>
          {cargosDisponibles.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Ciudad (Opcional)" value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        >
          <MenuItem value=""><em>Todas las ciudades</em></MenuItem>
          {ciudadesDisponibles.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <Button
          variant="contained" startIcon={<SparkIcon />} disabled={n === 0}
          onClick={() => onAnalizar(seleccion, cargoAEnviar)}
          sx={{ bgcolor: AZUL, '&:hover': { bgcolor: '#003366' }, textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 44 }}
        >
          Analizar {n} {n === 1 ? 'hoja' : 'hojas'} de vida
        </Button>
      </Box>

      {/* COLUMNA DERECHA: Lista */}
      <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2 }}>
        <Typography fontWeight={700} fontSize="0.9rem">
          Se incluirán en el análisis ({n} de {candidatos.length} pendientes)
        </Typography>

        {/* Aviso de ignorados */}
        {filas.length > pendientes.length && (
          <Alert severity="info" sx={{ mt: 1, mb: 2, py: 0, fontSize: '0.75rem' }}>
            Se omitieron <b>{filas.length - pendientes.length}</b> postulantes porque ya tienen puntaje o no tienen CV.
          </Alert>
        )}

        {candidatos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography fontSize="0.85rem" color="#94A3B8">
              No hay postulantes pendientes con estos filtros en esta página.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {candidatos.map((p) => {
              const marcado = idsSel.has(p.id);
              const bloqueado = !marcado && lleno;
              return (
                <Box
                  key={p.id} onClick={() => alternar(p.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1.5,
                    cursor: bloqueado ? 'not-allowed' : 'pointer',
                    opacity: bloqueado ? 0.5 : 1,
                    '&:hover': { bgcolor: bloqueado ? 'transparent' : '#F8FAFC' },
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: AZUL_BG, color: AZUL }}>
                    {iniciales(p.full_name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize="0.85rem" fontWeight={600} noWrap>{p.full_name}</Typography>
                    <Typography fontSize="0.75rem" color="#64748B">
                      {p.city} · {getCargos(p).join(', ')}
                    </Typography>
                  </Box>
                  <Checkbox
                    size="small" checked={marcado} disabled={bloqueado}
                    onChange={() => alternar(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ '&.Mui-checked': { color: AZUL } }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PasoConfigurar;