import React from "react";
import { Step } from "react-joyride";
import { Box, Typography, Chip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { TourPhase } from "./HorariosTourContext";

const inlineIcon = {
  fontSize: 16,
  verticalAlign: "middle",
  color: "#004680",
  mx: 0.25,
} as const;

export const STEPS_REGISTROS: Step[] = [
  {
    target: ".tour-tabs",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          ¡Bienvenido al panel de asistencia!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Desde estas pestañas puedes moverte entre <strong>Registros</strong>, <strong>Novedades</strong> e <strong>Historial</strong>. Te guiaremos por cada una.
        </Typography>
        <Chip
          label="Pestañas del módulo"
          size="small"
          sx={{ backgroundColor: "#E6F4FF", color: "#004680", fontWeight: 600 }}
        />
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-employee-card",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tarjeta del Empleado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cada empleado tiene su propia tarjeta donde se registran las marcaciones del día. El <strong>estado</strong> superior indica en qué punto de la jornada se encuentra.
        </Typography>
      </Box>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: ".tour-marcacion",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Marcaciones de Jornada
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Registra de forma secuencial: <strong>Comenzar Jornada</strong>, <strong>Iniciar</strong> y <strong>Finalizar Almuerzo</strong>, y <strong>Terminar Jornada</strong>. El botón <AccessTimeIcon sx={inlineIcon} /> permite corregir la hora y el botón <AssignmentIcon sx={inlineIcon} /> agregar una observación.
        </Typography>
      </Box>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: ".tour-novedad-btn",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Registrar una Novedad
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Aquí podrás registrar cualquier novedad relacionada con tu jornada de trabajo, como permisos, incapacidades, ausencias, etc.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Presiona <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>Siguiente</Box> para abrir el formulario de novedades.
        </Typography>
      </Box>
    ),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "#tour-modal-tipo",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tipo de Novedad
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          En este selector eliges el motivo de la novedad: permiso, incapacidad, vacaciones, licencia, etc.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-modal-fecha-desde-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Rango de Fechas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí defines <strong>Desde</strong> qué día y <strong>Hasta</strong> qué día aplica la novedad.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-modal-observaciones-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Observaciones
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Campo opcional para agregar un detalle adicional sobre la novedad.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: ".tour-evento-btn",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Reportar una Pausa
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Durante la jornada, usa el botón <PauseCircleOutlineIcon sx={{ ...inlineIcon, color: "#b45309" }} /> para registrar una pausa activa del empleado.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Presiona <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>Siguiente</Box> para ver cómo se reporta.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
  {
    target: "#tour-evento-tipo",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tipo de Pausa
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Acá se selecciona el tipo de pausa que se está reportando.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-evento-observaciones-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Observaciones (opcional)
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Puedes agregar un detalle adicional sobre la pausa antes de guardar. Este campo no es obligatorio.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-evento-acciones",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Guardar o Cancelar
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Con <strong>Cancelar</strong> cierras el formulario sin registrar nada. Al presionar <strong>Guardar</strong>, la pausa activa queda registrada y comienza un conteo de 5 minutos.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-countdown-box",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Conteo de la Pausa
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Mientras la pausa está activa verás este temporizador. Al llegar a 0, la pausa se cierra automáticamente y el empleado puede seguir marcando.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: ".tour-export-eventos",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Exportar Eventos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Con el botón <FileDownloadIcon sx={inlineIcon} /> <strong>Exportar</strong> descargas en Excel (CSV) las pausas y eventos registrados de tu tienda.
        </Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: "#tour-export-fecha-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Rango de Fechas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Elige el periodo que quieres exportar. Si no seleccionas ninguno, se exportará solo el día de hoy.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-export-boton",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Confirmar Exportación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Al presionar Exportar, se descarga el archivo Excel (CSV) con las pausas y eventos del rango elegido.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: ".tour-refresh",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Refrescar Datos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Con el botón <RefreshIcon sx={inlineIcon} /> vuelves a sincronizar la información con el servidor.
        </Typography>
      </Box>
    ),
    placement: "left",
  },
];

export const STEPS_NOVEDADES: Step[] = [
  {
    target: ".tour-nov-search",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Buscar Novedades</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Filtra las novedades escribiendo el nombre del empleado.</Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-nov-fecha",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Filtrar por Fecha</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Selecciona una fecha específica para ver solo las novedades de ese día.</Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-nov-tabla",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Listado de Novedades</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Aquí se muestran todas las novedades con su fecha, empleado, tipo y observaciones.</Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: "#tour-nov-export-fecha-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Rango de Fechas</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Elige el periodo que quieres exportar. Si no seleccionas ninguno, se exportará todo.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-nov-export-boton",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Confirmar Exportación</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Al presionar Exportar, se descarga el archivo Excel (CSV) con las novedades filtradas.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
];

export const STEPS_HISTORIAL: Step[] = [
  {
    target: ".tour-hist-fechas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Rango de Fechas</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Define un rango Desde – Hasta para consultar las jornadas registradas.</Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-hist-nombre",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Buscar por Empleado</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Filtra el historial por nombre. La búsqueda ignora mayúsculas y acentos.</Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-hist-tabla",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Historial de Jornadas</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Cada fila muestra las marcaciones de una jornada y el total de horas trabajadas.</Typography>
      </Box>
    ),
    placement: "bottom",
  },
  {
    target: "#tour-hist-export-fecha-field",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Rango de Fechas</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Elige el periodo que quieres exportar. Si no seleccionas ninguno, se exportará solo el día de hoy.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-hist-export-detallada",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Descarga Detallada</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Actívala si necesitas más contexto sobre los cambios: incluye el motivo de cada edición, la observación registrada y la hora original antes de que se modificara.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
  {
    target: "#tour-hist-export-boton",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Confirmar Exportación</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Al presionar Exportar, se descarga el archivo Excel (CSV) con el historial filtrado.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
    disableOverlay: true,
  },
];

export const STEPS_BY_PHASE: Record<TourPhase, Step[]> = {
  IDLE: [],
  REGISTROS: STEPS_REGISTROS,
  NOVEDADES: STEPS_NOVEDADES,
  HISTORIAL: STEPS_HISTORIAL,
  COMPLETED: [],
};