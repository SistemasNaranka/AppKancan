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
    target: '[data-tour="reporte-tour-export-unificado"]',
    content: tourText(<>Panel de <strong>exportación a Excel</strong>, con una pestaña por cada tipo de reporte.</>),
  },
  {
    target: '[data-tour="fake-export-tiendas"]',
    content: tourText(<>Selección de tiendas a incluir en la exportación. La opción <strong>Todas las tiendas</strong> incluye la totalidad.</>),
    placement: 'right',
  },
  {
    target: '[data-tour="fake-export-periodo"]',
    content: tourText(<>Define el <strong>rango de fechas</strong> que abarcará el archivo exportado.</>),
  },
  {
    target: '[data-tour="fake-export-estructura"]',
    content: tourText(<>Indica qué día <strong>inicia y termina</strong> cada semana. La nota azul confirma cómo quedarán agrupadas las columnas.</>),
  },
  {
    target: '[data-tour="fake-export-tab-historial"]',
    content: tourText(<>Exportación del detalle de <strong>entradas, almuerzos y salidas</strong>. Mismo procedimiento que esta pestaña.</>),
    placement: 'bottom',
  },
  {
    target: '[data-tour="fake-export-tab-novedades"]',
    content: tourText(<>Exporta las <strong>novedades</strong> reportadas, con los mismos filtros de tienda y período.</>),
    placement: 'bottom',
  },
  {
    target: '[data-tour="fake-export-tab-pausas"]',
    content: tourText(<>Exporta el historial de <strong>pausas activas</strong>, con los mismos filtros.</>),
    placement: 'bottom',
  },
  {
    target: '[data-tour="fake-export-cancelar"]',
    content: tourText(<>Cierra el panel <strong>sin exportar</strong> nada.</>),
    placement: 'top',
  },
  {
    target: '[data-tour="fake-export-exportar"]',
    content: tourText(<>Genera y descarga el <strong>archivo Excel</strong> con la configuración elegida.</>),
    placement: 'top',
  },
  {
    target: '[data-tour="reporte-tour-tab-registros"]',
    content: tourText(<>Detalle de <strong>entrada, almuerzo y salida</strong> por empleado.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-novedades"]',
    content: tourText(<><strong>Novedades</strong> reportadas, filtradas por fecha y nombre.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-pausas"]',
    content: tourText(<>Historial de <strong>pausas activas</strong> por empleado.</>),
  },
  {
    target: '[data-tour="reporte-tour-tab-semanal"]',
    content: tourText(<><strong>Consolidado de horas semanales</strong> por empleado y tienda.</>),
  },
];

export const STEP_FAKE_START = 4;
export const STEP_FAKE_END = 11;
export const STEP_TAB_REGISTROS = 12;
export const STEP_TAB_NOVEDADES = 13;
export const STEP_TAB_PAUSAS = 14;
