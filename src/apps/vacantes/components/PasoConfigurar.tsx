import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Checkbox, Avatar, Button,
} from '@mui/material';
import { AutoAwesome as SparkIcon } from '@mui/icons-material';
import { AZUL, AZUL_BG, CARGOS } from '../page/VacantesPage';
import { getCargos, Postulacion } from '../api/directus/read';

const MAX_HOJAS = 10; // Tope por análisis: las primeras 10 en pantalla, en el orden de la tabla

interface Props {
  postulaciones: Postulacion[]; // filas en pantalla (página actual de la tabla)
  cargoInicial: string;         // '' si en la tabla no hay cargo elegido
  onAnalizar: (seleccion: Postulacion[], cargo: string) => void;
}

const iniciales = (nombre: string) =>
  (nombre || '').trim().split(/\s+/).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');

const PasoConfigurar: React.FC<Props> = ({ postulaciones, cargoInicial, onAnalizar }) => {
  // Foto de la pantalla al abrir: si el refetch trae postulaciones nuevas, la selección no se corre
  const [filas] = useState(postulaciones);
  const [cargo, setCargo] = useState(cargoInicial);
  // null = selección automática (las primeras 10). Pasa a Set cuando RR. HH. toca una casilla
  const [manual, setManual] = useState<Set<number> | null>(null);
  const [ciudad, setCiudad] = useState('');

  // Solo cargos con postulantes en pantalla, en el orden fijo de CARGOS
  const cargosEnPantalla = useMemo(
    () => CARGOS.filter((c) => filas.some((p) => getCargos(p).includes(c))),
    [filas],
  );

  // Si hay un solo cargo en pantalla se elige solo; si el elegido no está en pantalla, se ignora
  const cargoSel = cargosEnPantalla.length === 1
    ? cargosEnPantalla[0]
    : cargosEnPantalla.includes(cargo) ? cargo : '';

  // Mismo orden de la tabla: no se reordena
  const delCargo = useMemo(
    () => (cargoSel === '' ? [] : filas.filter((p) => getCargos(p).includes(cargoSel))),
    [filas, cargoSel],
  );

  // Solo ciudades con postulantes de ese cargo en pantalla: ninguna opción puede dar 0
  const ciudades = useMemo(
    () => [...new Set(delCargo.map((p) => p.city).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es')),
    [delCargo],
  );

  // Si solo hay una ciudad, se elige sola
  const ciudadSel = ciudades.length === 1 ? ciudades[0] : ciudad;

  // Sin ciudad no hay lista: no se mezclan postulantes de tiendas distintas
  const candidatos = useMemo(
    () => (ciudadSel === '' ? [] : delCargo.filter((p) => p.city === ciudadSel)),
    [delCargo, ciudadSel],
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

  // Cambiar de cargo o de ciudad vuelve a la selección automática
  const cambiarCargo = (v: string) => { setCargo(v); setCiudad(''); setManual(null); };
  const cambiarCiudad = (v: string) => { setCiudad(v); setManual(null); };

  const sinFilas = filas.length === 0;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3, mt: 3 }}>
      {/* Columna izquierda: filtros */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          select size="small" label="Cargo a evaluar" value={cargoSel}
          onChange={(e) => cambiarCargo(e.target.value)}
          disabled={sinFilas}
          helperText={sinFilas ? 'No hay postulantes en pantalla'
            : cargoSel === '' ? 'Elige un cargo de los que están en pantalla' : ' '}
        >
          {cargosEnPantalla.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Ciudad" value={ciudadSel}
          onChange={(e) => cambiarCiudad(e.target.value)}
          disabled={cargoSel === '' || ciudades.length === 0}
          helperText={cargoSel !== '' && ciudadSel === '' ? 'Elige la ciudad de la tienda' : ' '}
        >
          {ciudades.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>

        <Button
          variant="contained" startIcon={<SparkIcon />} disabled={n === 0}
          onClick={() => onAnalizar(seleccion, cargoSel)}
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
            {sinFilas ? 'No hay postulantes en pantalla'
              : cargoSel === '' ? 'Elige un cargo para ver los postulantes'
              : ciudadSel === '' ? 'Elige una ciudad para ver los postulantes'
              : 'No hay postulantes de este cargo en pantalla'}
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