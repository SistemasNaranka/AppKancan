import { Box, Typography } from "@mui/material";
import { Step } from "react-joyride";

export const STEPS_CONTROL_HORAS: Step[] = [
  {
    target: ".tour-ch-filtros",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Control de Horas Semanales
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes filtrar por <strong>año</strong> y <strong>mes</strong>, y
          buscar un empleado específico con el buscador.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-indicadores",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Indicadores
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          <strong>Horas Extra</strong> resalta a quienes superan 42h en la
          semana. Los indicadores de{" "}
          <strong>1, 2 y 3+ Domingos</strong> muestran cuántos domingos
          trabajó cada empleado en el mes, con un color distinto según la
          cantidad (amarillo, naranja, rojo).
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-semanas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Horas por semana
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cada columna (Sem. 1 a Sem. 5) muestra el total de horas trabajadas
          por el empleado en esa semana del mes seleccionado.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-total-mes",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Total del mes
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Suma de todas las semanas del mes seleccionado.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-domingos",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Domingos trabajados
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Muestra cuántos domingos trabajó el empleado sobre el total de
          domingos del mes. El color cambia según la cantidad: gris (ninguno),
          amarillo (1), naranja (2), rojo (3 o más).
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-festivos",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Festivos trabajados
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Igual que Domingos, pero para días festivos del mes. Si el empleado
          trabajó al menos uno, el indicador se pone azul y puedes hacer clic
          para ver el detalle.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-ch-acciones",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Ver detalle diario
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Haz clic ahora en este ícono para abrir el detalle día por día y
          continuar el tutorial.
        </Typography>
      </Box>
    ),
    placement: "left",
    disableBeacon: true,
    spotlightClicks: true,
    hideFooter: true,
  },
  {
    target: ".tour-hh-semanas",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Historial mensual
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Este es el historial mensual del empleado, organizado por semanas.
          Cada tarjeta muestra las horas trabajadas en un día.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
  },
  {
    target: ".tour-hh-navegacion",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Navegación entre meses
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Puedes moverte entre meses con estas flechas para consultar el
          historial de períodos anteriores.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: ".tour-hh-dia",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Detalle diario
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Haz clic en cualquier tarjeta de día con marcas para ver el detalle
          hora por hora de las marcaciones y novedades del empleado.
        </Typography>
      </Box>
    ),
    placement: "top",
    disableBeacon: true,
  },
];