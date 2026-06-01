import React from "react";
import Joyride, { CallBackProps, STATUS, TooltipRenderProps, Step } from "react-joyride";
import { useCreateNotificationTour } from "./CreateNotificationTourContext";

// ── Pasos ───────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    target: "#notif-crear-destinatarios",
    title: "Destinatarios",
    content:
      "Elige a quién enviar la notificación: a todas las terminales, a un grupo/área específica o seleccionando manualmente terminales una por una.",
    disableBeacon: true,
    placement: "bottom",
    styles: { spotlight: { borderRadius: 12 } },
  },
  {
    target: "#notif-crear-programacion",
    title: "Programación",
    content:
      "Decide cuándo se enviará. Puedes enviarla ahora, programarla para más tarde o crearla como recordatorio personal solo para tu terminal.",
    placement: "left",
    styles: { spotlight: { borderRadius: 12 } },
  },
  {
    target: "#notif-crear-contenido",
    title: "Contenido",
    content:
      "Define el título (opcional) y el mensaje (obligatorio) de la alerta. También puedes elegir el tipo: Informativa, Éxito, Advertencia o Error Crítico.",
    placement: "right",
    styles: { spotlight: { borderRadius: 12 } },
  },
  {
    target: "#notif-crear-avanzadas",
    title: "Opciones Avanzadas",
    content:
      "Ajusta la duración en pantalla, marca la alerta como persistente o clickeable, define una ruta de acción y excluye terminales específicas.",
    placement: "left",
    styles: { spotlight: { borderRadius: 12 } },
  },
  {
    target: "#notif-crear-enviar",
    title: "Enviar Notificación",
    content:
      "Cuando todo esté listo, pulsa este botón para emitir la notificación a los destinatarios configurados.",
    placement: "bottom-end",
    styles: { spotlight: { borderRadius: 12 } },
  },
];

// ── Tooltip personalizado ───────────────────────────────────────────────────

function CustomTooltip({
  continuous,
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "20px 22px",
        maxWidth: 360,
        fontFamily: "Inter, sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        outline: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{
          background: "#eff6ff", color: "#004a99",
          fontSize: 12, fontWeight: 700,
          padding: "3px 12px", borderRadius: 20,
        }}>
          Paso {index + 1} de {size}
        </span>
        <button
          {...closeProps}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>

      {step.title && (
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          {step.title as React.ReactNode}
        </h3>
      )}

      <p style={{ margin: "0 0 20px", fontSize: 14, color: "#475569", lineHeight: 1.65 }}>
        {step.content as React.ReactNode}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          {...skipProps}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, fontWeight: 600, padding: 0, fontFamily: "Inter, sans-serif" }}
        >
          Saltar
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          {index > 0 && (
            <button
              {...backProps}
              style={{
                background: "none", border: "1px solid #e2e8f0", cursor: "pointer",
                color: "#64748b", fontSize: 13, fontWeight: 600,
                padding: "7px 16px", borderRadius: 9, fontFamily: "Inter, sans-serif",
              }}
            >
              Atrás
            </button>
          )}
          <button
            {...primaryProps}
            style={{
              background: "#004a99", border: "none", cursor: "pointer",
              color: "#ffffff", fontSize: 13, fontWeight: 700,
              padding: "7px 18px", borderRadius: 9, fontFamily: "Inter, sans-serif",
            }}
          >
            {continuous && index < size - 1 ? "Siguiente" : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export default function CreateNotificationTour() {
  const { isRunning, stopTour } = useCreateNotificationTour();

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  if (!isRunning) return null;

  return (
    <Joyride
      key="notif-crear-tour"
      steps={STEPS}
      run
      continuous
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      disableScrollParentFix
      scrollOffset={100}
      tooltipComponent={CustomTooltip}
      callback={handleCallback}
      styles={{ options: { zIndex: 10000, overlayColor: "rgba(15, 23, 42, 0.55)" } }}
    />
  );
}
