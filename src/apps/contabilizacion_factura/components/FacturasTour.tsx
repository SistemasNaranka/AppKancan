/**
 * Componente de Tours Interactivos para Contabilización de Facturas
 * Implementación basada en Joyride
 * Módulo de Contabilización de Facturas
 */

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
import { useTourContext, TourPhase } from "./TourContext";

// ============================================
// DATOS DE EJEMPLO PARA EL TOUR
// Exportados para que el componente de factura
// los muestre cuando hasUploadedFile === false
// ============================================

export const TOUR_MOCK_INVOICE = {
  proveedor: {
    nombre: "Distribuidora Ejemplo S.A.S.",
    nit: "900.123.456-7",
  },
  numeroFactura: "FE-2024-00128",
  fechaEmision: "2024-03-15",
  fechaVencimiento: "2024-04-14",
  conceptos: [
    {
      descripcion: "Servicios de consultoría tecnológica",
      cantidad: 1,
      valorUnitario: 4_200_000,
      total: 4_200_000,
    },
    {
      descripcion: "Licencias de software (mensual)",
      cantidad: 3,
      valorUnitario: 350_000,
      total: 1_050_000,
    },
  ],
  subtotal: 5_250_000,
  iva: 997_500,
  totalAPagar: 6_247_500,
  moneda: "COP",
};

// ============================================
// PASOS POR FASE
// ============================================

// Fase 1: Tour en el área de carga de archivos
const STEPS_UPLOAD: Step[] = [
  {
    target: ".tour-factura-upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          ¡Bienvenido al módulo de Facturas!
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Arrastra y suelta tu <strong>factura PDF</strong> en esta zona o haz
          clic para seleccionar el archivo.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          El sistema utilizará <strong>Inteligencia Artificial</strong> para
          extraer automáticamente todos los datos de la factura.
        </Typography>
        <Chip
          label="Puedes subir un archivo o continuar con datos de ejemplo"
          size="small"
          sx={{
            mt: 1.5,
            backgroundColor: "#E6F4FF",
            color: "#004680",
            fontWeight: 600,
          }}
        />
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    spotlightClicks: true,
    disableScrolling: true,
    // Sin hideFooter → el usuario puede avanzar sin subir archivo
  },
];


// Fase 2: Tour en los datos de la factura extraída
const STEPS_INVOICE_DATA: Step[] = [
  {
    target: ".tour-factura-info",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Datos Extraídos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          La IA ha extraído automáticamente la siguiente información de tu
          factura:
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          • <strong>Proveedor:</strong> Nombre y NIT del emisor
          <br />• <strong>Fechas:</strong> Fecha de emisión y vencimiento
          <br />• <strong>Conceptos:</strong> Detalle de productos/servicios
          <br />• <strong>Impuestos:</strong> IVA y otros impuestos
          <br />• <strong>Totales:</strong> Subtotal, impuestos y total
        </Typography>
        <Chip
          label="Datos de ejemplo, sube tu PDF para ver datos reales"
          size="small"
          sx={{
            mt: 1.5,
            backgroundColor: "#FFF8E1",
            color: "#7B5800",
            fontWeight: 600,
          }}
        />
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
];

// Fase 4: Tour en el botón de causar factura
const STEPS_CAUSE_BUTTON: Step[] = [
  {
    target: ".tour-factura-cause",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Causar Factura
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Una vez verificados los datos extraídos, haz clic en{" "}
          <strong>"Causar factura"</strong> para registrar la factura en el
          sistema contable.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Si el proveedor no está registrado, el sistema te solicitará el{" "}
          <strong>número automático</strong> para completar el registro.
        </Typography>
      </Box>
    ),
    placement: "left",
    disableBeacon: true,
  },
];

// Fase: Tour en el modal de asignación de número automático
const STEPS_AUTOMATICO_MODAL: Step[] = [
  {
    target: ".tour-automatico-modal",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Asignar Número Automático
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Cuando el proveedor no está registrado, el sistema te pedirá un{" "}
          <strong>número automático</strong> de 4 dígitos para identificarlo en
          el sistema contable.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Este número se guarda automáticamente y no tendrás que ingresarlo
          la próxima vez que proceses una factura del mismo proveedor.
        </Typography>
      </Box>
    ),
    placement: "bottom",
    disableBeacon: true,
    spotlightClicks: false,
    disableScrolling: true,
    disableScrollParentFix: true,
  },
];

// Mapeo de fases a pasos
const STEPS_BY_PHASE: Record<TourPhase, Step[]> = {
  IDLE: [],
  UPLOAD: STEPS_UPLOAD,
  IA_STATUS: [], // Sin steps — se auto-salta
  INVOICE_DATA: STEPS_INVOICE_DATA,
  CAUSE_BUTTON: STEPS_CAUSE_BUTTON,
  AUTOMATICO_MODAL: STEPS_AUTOMATICO_MODAL,
  COMPLETED: [],
};

// ============================================
// CUSTOM TOOLTIP
// ============================================

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

  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
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
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: "#004680" }}
        >
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          size="small"
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            "&:hover": {
              backgroundColor: "transparent",
              color: "text.primary",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>{step.content}</Box>

      {/* Footer — siempre visible */}
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
          variant="text"
          size="small"
          disabled={isFirstStep}
          sx={{
            textTransform: "none",
            color: isFirstStep ? "text.disabled" : "text.secondary",
          }}
        >
          Atrás
        </Button>
        <Button
          {...primaryProps}
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#004680",
            textTransform: "none",
            borderRadius: 1,
            "&:hover": { backgroundColor: "#005AA3" },
          }}
        >
          {isLastStep ? "Continuar" : "Siguiente"}
        </Button>
      </Box>
    </Box>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface FacturasTourProps {
  children: ReactNode;
}

export const FacturasTour = ({
  children,
}: FacturasTourProps): React.ReactElement => {
  const { tourPhase, stepIndex, setStepIndex, nextPhase, stopTour } =
    useTourContext();

  const [runTour, setRunTour] = useState(false);
  const currentSteps = STEPS_BY_PHASE[tourPhase] || [];

  // Controlar cuándo corre el tour
  useEffect(() => {
    if (tourPhase === "IDLE" || tourPhase === "COMPLETED") {
      setRunTour(false);
      return;
    }

    // Si la fase activa no tiene pasos, avanzar automáticamente a la siguiente
    if (currentSteps.length === 0) {
      const timer = setTimeout(() => nextPhase(), 100);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setRunTour(true), 200);
    return () => clearTimeout(timer);
  }, [tourPhase, currentSteps.length, nextPhase]);

  // Handle tour callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      // Tour terminado (último paso → Siguiente / Continuar)
      if (status === STATUS.FINISHED) {
        setRunTour(false);
        nextPhase();
        return;
      }

      // Tour saltado o cerrado con X
      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRunTour(false);
        stopTour();
        return;
      }

      // Actualizar índice del paso
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      }
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    },
    [nextPhase, stopTour, setStepIndex]
  );

  return (
    <>
      {children}

      <Joyride
        run={runTour}
        steps={currentSteps}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrolling={false}
        scrollToFirstStep
        spotlightClicks
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: "0 0 0 3px #004680, 0 0 25px rgba(0, 70, 128, 0.4)",
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
        floaterProps={{
          disableAnimation: true,
        }}
      />
    </>
  );
};

export default FacturasTour;