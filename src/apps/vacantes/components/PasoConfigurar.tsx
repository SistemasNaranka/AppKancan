import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Chip, Checkbox, Avatar, Button,
} from '@mui/material';
import { AutoAwesome as SparkIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG, CARGOS, CIUDADES } from '../page/VacantesPage';
import {
  getCargos, Postulacion, ESTADOS, ESTADO_COLOR, EstadoContratacion,
} from '../api/directus/read';

const ESTADOS_INICIALES: EstadoContratacion[] = ['Recibido', 'En revisión'];
const MAX_HOJAS = 20; // Tope por análisis (costo, tiempo y calidad de la comparación)

interface Props {
  postulaciones: Postulacion[];
  cargoInicial: string;  // '' si en la página no hay cargo elegido
  ciudadInicial: string; // 'Todas' o una ciudad
  onAnalizar: (seleccion: Postulacion[], cargo: string) => void;
}

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

const PasoConfigurar: React.FC<Props> = ({
  postulaciones, cargoInicial, ciudadInicial, onAnalizar,
}) => {
  const [cargo, setCargo] = useState(cargoInicial);
  const [ciudad, setCiudad] = useState(ciudadInicial);
  const [estados, setEstados] = useState<Set<EstadoContratacion>>(new Set(ESTADOS_INICIALES));
  // null = selección automática (las primeras 20). Pasa a Set cuando RR. HH. toca una casilla
  const [manual, setManual] = useState<Set<number> | null>(null);

  const base = useMemo(() => postulaciones.filter((p) =>
    cargo !== '' && getCargos(p).includes(cargo) &&
    (ciudad === 'Todas' || p.city === ciudad)
  ), [postulaciones, cargo, ciudad]);

  // Conteo por estado dentro del cargo y ciudad elegidos
  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    base.forEach((p) => { c[p.status] = (c[p.status] ?? 0) + 1; });
    return c;
  }, [base]);

  // Más antiguas primero: orden de llegada; las nuevas del refetch quedan al final
  const candidatos = useMemo(() => base
    .filter((p) => estados.has(p.status as EstadoContratacion))
    .sort((a, b) => String(a.date_created).localeCompare(String(b.date_created))),
  [base, estados]);

  const seleccion = manual
    ? candidatos.filter((p) => manual.has(p.id))
    : candidatos.slice(0, MAX_HOJAS);
  const idsSel = new Set(seleccion.map((p) => p.id));
  const n = seleccion.length;
  const lleno = n >= MAX_HOJAS;

  const alternar = (id: number) => {
    const s = new Set(idsSel);
    if (s.has(id)) s.delete(id);
    else if (!lleno) s.add(id);
    else return; // ya hay 20: no deja marcar más
    setManual(s);
  };

  // Cualquier cambio de filtro vuelve a la selección automática
  const cambiarCargo = (v: string) => { setCargo(v); setManual(null); };
  const cambiarCiudad = (v: string) => { setCiudad(v); setManual(null); };
  const alternarEstado = (e: EstadoContratacion) => {
    setEstados((prev) => {
      const s = new Set(prev);
      if (s.has(e)) s.delete(e); else s.add(e);
      return s;
    });
    setManual(null);
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3, mt: 3 }}>
      {/* Columna izquierda: filtros */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          select size="small" label="Cargo a evaluar" value={cargo}
          onChange={(e) => cambiarCargo(e.target.value)}
          helperText={cargo === '' ? 'Elige un cargo para comparar' : ' '}
        >
          {CARGOS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Ciudad" value={ciudad}
          onChange={(e) => cambiarCiudad(e.target.value)}
        >
          <MenuItem value="Todas">Todas las ciudades</MenuItem>
          {CIUDADES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <Box>
          <Typography fontWeight={700} fontSize="0.9rem" mb={1}>Estados a incluir</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ESTADOS.map((e) => {
              const activo = estados.has(e);
              return (
                <Chip
                  key={e}
                  label={`${e} (${conteo[e] ?? 0})`}
                  onClick={() => alternarEstado(e)}
                  sx={{
                    bgcolor: activo ? AZUL : AZUL_BG,
                    color: activo ? '#fff' : AZUL,
                    fontWeight: 700, borderRadius: 2,
                    borderLeft: activo ? 'none' : `4px solid ${ESTADO_COLOR[e].color}`,
                    '&:hover': { bgcolor: activo ? '#003366' : '#CCDDEA' },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Button
          variant="contained" startIcon={<SparkIcon />} disabled={n === 0}
          onClick={() => onAnalizar(seleccion, cargo)}
          sx={{
            bgcolor: AZUL, '&:hover': { bgcolor: '#003366' },
            textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 44,
          }}
        >
          Analizar {n} {n === 1 ? 'hoja' : 'hojas'} de vida
        </Button>
        <Typography fontSize="0.75rem" color="#64748B" textAlign="center" mt={-1.5}>
          {candidatos.length > MAX_HOJAS
            ? `Máximo ${MAX_HOJAS} por análisis`
            : 'Toma unos segundos por hoja de vida'}
        </Typography>
      </Box>

      {/* Columna derecha: vista previa con checkboxes */}
      <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2 }}>
        <Typography fontWeight={700} fontSize="0.9rem">
          Se incluirán en el análisis ({n} de {candidatos.length})
        </Typography>
        <Typography fontSize="0.75rem" color="#64748B" mb={1.5}>
          Marca o desmarca postulantes de esta vista previa
        </Typography>

        {candidatos.length === 0 ? (
          <Typography fontSize="0.85rem" color="#94A3B8" textAlign="center" py={4}>
            {cargo === '' ? 'Elige un cargo para ver los postulantes'
              : estados.size === 0 ? 'Elige al menos un estado'
              : 'No hay postulaciones con estos filtros'}
          </Typography>
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
                      {p.city} · {p.status} · {p.years_experience} años
                    </Typography>
                  </Box>
                  <Checkbox
                    size="small" checked={marcado} disabled={bloqueado}
                    onChange={() => alternar(p.id)}
                    onClick={(e) => e.stopPropagation()} // evita doble alternado con el clic de la fila
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