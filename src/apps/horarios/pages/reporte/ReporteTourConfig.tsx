import React from 'react';
import { Typography } from '@mui/material';
import { Step } from 'react-joyride';

export const tourText = (children: React.ReactNode) => (
  <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.7, fontSize: '0.9rem' }}>
    {children}
  </Typography>
);

export const getTourSteps = (tiendaTourTarget: string): Step[] => [
  {
    target: tiendaTourTarget,
    content: tourText(<>Selecciona la <strong>tienda</strong> cuyos registros quieres consultar y exportar.</>),
    disableBeacon: true,
  },
  {
    target: '[data-tour="reporte-tour-fechas"]',
    content: tourText(<>Filtra por <strong>rango de fechas</strong>. Afecta lo que ves en pantalla y lo que se exporta.</>),
  },
  {
    target: '[data-tour="reporte-tour-buscar"]',
    content: tourText(<>Busca por <strong>nombre de empleado</strong> dentro de los resultados filtrados.</>),
  },
  {
    target: '[data-tour="reporte-tour-export-registros"]',
    content: tourText(<>Exporta los <strong>registros de entrada/salida</strong> en un archivo descargable.</>),
  },
  {
    target: '[data-tour="reporte-tour-export-novedades"]',
    content: tourText(<>Exporta las <strong>novedades</strong> reportadas por los empleados.</>),
  },
  {
    target: '[data-tour="reporte-tour-export-pausas"]',
    content: tourText(<>Exporta el historial de <strong>pausas activas</strong>.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-registros"]',
    content: tourText(<>En esta pestaña ves el detalle de <strong>entrada, almuerzo y salida</strong> de cada empleado.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-novedades"]',
    content: tourText(<>En esta pestaña ves las <strong>novedades</strong> reportadas, filtradas por fecha y nombre.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-pausas"]',
    content: tourText(<>En esta pestaña ves el historial de <strong>pausas activas</strong> de cada empleado.</>),
  },
];

export const STEP_TAB_REGISTROS = 6;
export const STEP_TAB_NOVEDADES = 7;
export const STEP_TAB_PAUSAS = 8;
