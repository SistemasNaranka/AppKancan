import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Checkbox, Avatar, Button,
} from '@mui/material';
import { AutoAwesome as SparkIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG, CARGOS } from '../page/VacantesPage';
import { getCargos, Postulacion } from '../api/directus/read';

const MAX_HOJAS = 10; // Tope por análisis: las primeras 10 del cargo, en el orden de la tabla

interface Props {
  postulaciones: Postulacion[]; // filas de la tabla (búsqueda, ciudad y estado ya aplicados)
  cargoInicial: string;         // '' si en la página no hay cargo elegido
  onAnalizar: (seleccion: Postulacion[], cargo: string) => void;
}

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

const PasoConfigurar: React.FC<Props> = ({ postulaciones, cargoInicial, onAnalizar }) => {
  // Foto de la tabla al abrir: si el refetch trae postulaciones nuevas, la selección no se corre
  const [filas] = useState(postulaciones);
  const [cargo, setCargo] = useState(cargoInicial);
  // null = selección automática (las primeras 10). Pasa a Set cuando RR. HH. toca una casilla
  const [manual, setManual] = useState<Set<number> | null>(null);

  // Mismo orden de la tabla: no se reordena
  const candidatos = useMemo(
    () => (cargo === '' ? [] : filas.filter((p) => getCargos(p).includes(cargo))),
    [filas, cargo],
  );

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
    else return; // ya hay 10: no deja marcar más
    setManual(s);
  };

  // Cambiar de cargo vuelve a la selección automática
  const cambiarCargo = (v: string) => { setCargo(v); setManual(null); };

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
              : 'No hay postulaciones de este cargo con los filtros de la tabla'}
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