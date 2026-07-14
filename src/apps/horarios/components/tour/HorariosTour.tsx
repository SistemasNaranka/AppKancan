import React, { useCallback, useEffect, useState, ReactNode } from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  Step,
  TooltipRenderProps,
  ACTIONS,
  EVENTS,
} from "react-joyride";
import { Box, Button, Typography, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useHorariosTour, TourPhase } from "./HorariosTourContext";

const inlineIcon = {
  fontSize: 16,
  verticalAlign: "middle",
  color: "#004680",
  mx: 0.25,
} as const;

// MODAL SIMULADO - AHORA SOLO EL BORDE USA EL AZUL #008CFF
const FakeNovedadModal: React.FC<{ open: boolean; activeField: string | null }> = ({
  open,
  activeField,
}) => {
  if (!open) return null;

  const isModalStep = modalTargets.includes(activeField || "");
  const isDatesActive = activeField === "#tour-modal-fecha-desde-field";

  const getFieldStyle = (fieldId: string) => {
    const isActive = activeField === fieldId || (isDatesActive && (fieldId === "#tour-modal-fecha-desde-field" || fieldId === "#tour-modal-fecha-hasta-field"));

    if (isActive) {
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "56px",
        boxSizing: "border-box" as const,
        border: "2px solid #008CFF", // Únicamente el borde es azul
        borderRadius: 8,
        padding: "15.5px 13px",
        backgroundColor: "#ffffff",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: "16px",
        transition: "all 0.1s ease",
      };
    }

    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      height: "56px",
      boxSizing: "border-box" as const,
      border: "1px solid rgba(0, 0, 0, 0.23)",
      borderRadius: 8,
      padding: "16.5px 14px",
      backgroundColor: "#ffffff",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: "16px",
      cursor: "not-allowed",
      transition: "all 0.1s ease",
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
          margin: 16,
          position: "relative",
        }}
      >
        {isModalStep && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 5,
              pointerEvents: "none",
              borderRadius: 16,
            }}
          />
        )}

        {/* Header del Modal */}
        <div
          style={{
            backgroundColor: "#004680",
            color: "#fff",
            padding: "16px 24px",
            fontSize: "20px",
            fontWeight: 500,
          }}
        >
          Registro de Novedad
        </div>

        {/* Cuerpo del Modal */}
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          {/* Campo: Tipo de Novedad */}
          <div style={{ position: "relative", zIndex: activeField === "#tour-modal-tipo" ? 6 : 1 }}>
            <label
              style={{
                position: "absolute",
                top: -9,
                left: 12,
                background: "#fff",
                padding: "0 4px",
                fontSize: 12,
                color: "rgba(0, 0, 0, 0.6)", // Integrado con el estilo base gris de MUI
                fontWeight: activeField === "#tour-modal-tipo" ? 500 : 400,
                zIndex: 2,
              }}
            >
              Novedad
            </label>
            <div id="tour-modal-tipo" style={getFieldStyle("#tour-modal-tipo")}>
              <span style={{ color: "rgba(0, 0, 0, 0.38)" }}>Novedad</span>
              <svg style={{ width: 24, height: 24, fill: "rgba(0, 0, 0, 0.54)" }} viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>

          {/* Campos: Fechas */}
          <div
            id="tour-modal-fechas"
            style={{
              display: "flex",
              gap: 16,
              position: "relative",
              zIndex: isDatesActive ? 6 : 1,
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: -9,
                  left: 12,
                  background: "#fff",
                  padding: "0 4px",
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  fontWeight: isDatesActive ? 500 : 400,
                  zIndex: 2,
                }}
              >
                Desde el día
              </label>
              <div
                id="tour-modal-fecha-desde-field"
                style={getFieldStyle("#tour-modal-fecha-desde-field")}
              >
                <span style={{ color: "rgba(0, 0, 0, 0.87)" }}>14/07/2026</span>
                <svg style={{ width: 24, height: 24, fill: "rgba(0, 0, 0, 0.54)" }} viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v16c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H5V8h14v13z" />
                </svg>
              </div>
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: -9,
                  left: 12,
                  background: "#fff",
                  padding: "0 4px",
                  fontSize: 12,
                  color: "rgba(0, 0, 0, 0.6)",
                  fontWeight: isDatesActive ? 500 : 400,
                  zIndex: 2,
                }}
              >
                Hasta el día
              </label>
              <div
                id="tour-modal-fecha-hasta-field"
                style={getFieldStyle("#tour-modal-fecha-hasta-field")}
              >
                <span style={{ color: "rgba(0, 0, 0, 0.87)" }}>14/07/2026</span>
                <svg style={{ width: 24, height: 24, fill: "rgba(0, 0, 0, 0.54)" }} viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v16c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H5V8h14v13z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Campo: Observaciones */}
          <div
            style={{
              position: "relative",
              zIndex: activeField === "#tour-modal-observaciones-field" ? 6 : 1,
            }}
          >
            <label
              style={{
                position: "absolute",
                top: -9,
                left: 12,
                background: "#fff",
                padding: "0 4px",
                fontSize: 12,
                color: "rgba(0, 0, 0, 0.6)",
                fontWeight: activeField === "#tour-modal-observaciones-field" ? 500 : 400,
                zIndex: 2,
              }}
            >
              Observaciones
            </label>
            <div
              id="tour-modal-observaciones-field"
              style={{ 
                ...getFieldStyle("#tour-modal-observaciones-field"), 
                height: "auto", 
                minHeight: "92px", 
                alignItems: "flex-start",
              }}
            >
              <span style={{ color: "rgba(0, 0, 0, 0.38)", marginTop: "1px" }}>Observaciones</span>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 16,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              color: "#475569",
              fontWeight: 600,
              fontSize: "0.875rem",
              letterSpacing: "0.02857em",
              cursor: "not-allowed",
              textTransform: "uppercase",
            }}
          >
            Cancelar
          </div>
          <div
            style={{
              padding: "6px 22px",
              borderRadius: 8,
              backgroundColor: "#004680",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              letterSpacing: "0.02857em",
              cursor: "not-allowed",
              textTransform: "uppercase",
              boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)"
            }}
          >
            Guardar Novedad
          </div>
        </div>
      </div>
    </div>
  );
};

const modalTargets = [
  "#tour-modal-tipo",
  "#tour-modal-fecha-desde-field",
  "#tour-modal-fecha-hasta-field",
  "#tour-modal-observaciones-field",
];

const STEPS_REGISTROS: Step[] = [
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
          Aquí podrás registrar cualquier novedad relacionada con tu jornada de trabajo, como permisos, incapacidades, absences, etc.
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
  },
  {
    target: ".tour-evento-btn",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Reportar una Pausa
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Durante la jornada, usa el botón <PauseCircleOutlineIcon sx={{ ...inlineIcon, color: "#b45309" }} /> para registrar una pausa del empleado. Cada reporte queda guardado con su hora.
        </Typography>
      </Box>
    ),
    placement: "left",
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

const STEPS_NOVEDADES: Step[] = [
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
    target: ".tour-nov-export",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Exportar Novedades</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Usa el botón para descargar las novedades filtradas en un archivo Excel (CSV).</Typography>
      </Box>
    ),
    placement: "bottom",
  },
];

const STEPS_HISTORIAL: Step[] = [
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
    target: ".tour-hist-export",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Exportar Historial</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Con el botón Exportar descargas el historial en formato Excel (CSV).</Typography>
      </Box>
    ),
    placement: "bottom",
  },
];

const STEPS_BY_PHASE: Record<TourPhase, Step[]> = {
  IDLE: [],
  REGISTROS: STEPS_REGISTROS,
  NOVEDADES: STEPS_NOVEDADES,
  HISTORIAL: STEPS_HISTORIAL,
  COMPLETED: [],
};

const CustomTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}) => {
  const isFirstStep = index === 0;
  const hideFooter = (step as any).hideFooter === true;

  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 380,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#f9fafb",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#004680" }}>
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          title=""
          size="small"
          disableElevation
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            boxShadow: "none",
            "&:hover": { backgroundColor: "transparent", color: "text.primary" },
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      <Box sx={{ p: 2 }}>{step.content}</Box>

      {!hideFooter && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#f9fafb",
          }}
        >
          <Button
            {...backProps}
            title=""
            variant="text"
            size="small"
            disableElevation
            disabled={isFirstStep}
            sx={{
              textTransform: "none",
              boxShadow: "none",
              color: isFirstStep ? "text.disabled" : "text.secondary",
            }}
          >
            Atrás
          </Button>
          <Button
            {...primaryProps}
            title=""
            variant="contained"
            size="small"
            disableElevation
            sx={{
              backgroundColor: "#004680",
              textTransform: "none",
              borderRadius: 1,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#003366", boxShadow: "none" },
            }}
          >
            {isLastStep ? "Continuar" : "Siguiente"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

interface HorariosTourProps {
  children: ReactNode;
}

export const HorariosTour: React.FC<HorariosTourProps> = ({ children }) => {
  const { tourPhase, stepIndex, setStepIndex, nextPhase, stopTour } = useHorariosTour();

  const [runTour, setRunTour] = useState(false);
  const [fakeModalOpen, setFakeModalOpen] = useState(false);
  const [joyrideKey, setJoyrideKey] = useState(0);
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const currentSteps = STEPS_BY_PHASE[tourPhase] || [];

  useEffect(() => {
    if (tourPhase !== "IDLE" && tourPhase !== "COMPLETED" && currentSteps.length > 0) {
      setFakeModalOpen(false);
      const timer = setTimeout(() => setRunTour(true), 250);
      return () => clearTimeout(timer);
    }

    setRunTour(false);
    setFakeModalOpen(false);
    setPendingStepIndex(null);
  }, [tourPhase, currentSteps.length]);

  useEffect(() => {
    if (tourPhase !== "REGISTROS") {
      setFakeModalOpen(false);
      return;
    }

    const step = currentSteps[stepIndex];
    if (!step) {
      setFakeModalOpen(false);
      return;
    }

    setFakeModalOpen(modalTargets.includes(step.target as string));
  }, [tourPhase, stepIndex, currentSteps]);

  useEffect(() => {
    if (!fakeModalOpen || pendingStepIndex === null) return;

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setJoyrideKey((k) => k + 1);
        setStepIndex(pendingStepIndex);
        setPendingStepIndex(null);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [fakeModalOpen, pendingStepIndex, setStepIndex]);

  useEffect(() => {
    if (fakeModalOpen && runTour) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, fakeModalOpen, runTour]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      if (status === STATUS.FINISHED) {
        setRunTour(false);
        setFakeModalOpen(false);
        setPendingStepIndex(null);
        nextPhase();
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRunTour(false);
        setFakeModalOpen(false);
        setPendingStepIndex(null);
        stopTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const currentStep = currentSteps[index];

        if (currentStep?.target === ".tour-novedad-btn") {
          setFakeModalOpen(true);
          setPendingStepIndex(index + 1);
          return;
        }

        setStepIndex(index + 1);
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        const prevStep = currentSteps[index - 1];

        if (prevStep?.target === ".tour-novedad-btn") {
          setFakeModalOpen(false);
        }

        setPendingStepIndex(null);
        setStepIndex(index - 1);
      }
    },
    [nextPhase, stopTour, setStepIndex, currentSteps]
  );

  return (
    <>
      {children}
      <FakeNovedadModal
        open={fakeModalOpen}
        activeField={currentSteps[stepIndex]?.target as string | null}
      />

      <Joyride
        run={runTour}
        key={`${joyrideKey}-${tourPhase}`}
        steps={currentSteps}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrollParentFix
        scrollToFirstStep
        spotlightClicks
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 15000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.4)",
          },
          overlay: {
            zIndex: fakeModalOpen ? 8900 : 15000,
          },
          spotlight: {
            borderRadius: 8,
            // Sincroniza la sombra exterior de Joyride con el borde del input activo del modal
            boxShadow: fakeModalOpen ? "0 0 0 2px #008CFF" : "0 0 0 2px #004680",
          },
          buttonClose: { display: "none" },
          buttonBack: { display: "none" },
          buttonNext: { display: "none" },
          buttonSkip: { display: "none" },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Continuar",
          next: "Siguiente",
          skip: "Salir del tour",
        }}
        floaterProps={{ disableAnimation: true }}
      />
    </>
  );
};

export default HorariosTour;