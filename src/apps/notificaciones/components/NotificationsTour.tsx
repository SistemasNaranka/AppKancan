import React from "react";
import Joyride, { CallBackProps, STATUS, TooltipRenderProps, Step } from "react-joyride";
import { useNavigate } from "react-router-dom";
import { useNotificationsTour } from "./NotificationsTourContext";

// ── Pasos ───────────────────────────────────────────────────────────────────
// Cada paso define su propio spotlight borderRadius para coincidir
// con el border-radius real del elemento que apunta.

const STEPS: Step[] = [
  {
    target: "#notif-header",
    title: "Historial de Notificaciones",
    content:
      "Bienvenido al módulo de notificaciones. Aquí puedes consultar todas las notificaciones enviadas a las terminales del sistema.",
    disableBeacon: true,
    placement: "bottom",
    styles: { spotlight: { borderRadius: 16 } },
  },
  {
    target: "#notif-btn-crear",
    title: "Crear Notificación",
    content:
      "Desde este botón puedes redactar y enviar una nueva notificación a terminales individuales, grupos o a toda la red.",
    placement: "bottom-end",
    styles: { spotlight: { borderRadius: 10 } },
  },
  {
    target: "#notif-filtros",
    title: "Filtros de Estado",
    content:
      "Filtra las notificaciones por su resultado: Todos, Éxito (entregadas), Advertencia o Error.",
    placement: "bottom",
    styles: { spotlight: { borderRadius: 12 } },
  },
  {
    target: "#notif-rango-fecha",
    title: "Filtro de Fecha",
    content:
      "Filtra el historial por rango de fechas: hoy, ayer, últimos 7 días o últimos 30 días.",
    placement: "bottom-end",
    styles: { spotlight: { borderRadius: 10 } },
  },
  {
    target: "#notif-tabla",
    title: "Tabla de Notificaciones",
    content:
      "Aquí se listan los registros filtrados. Haz clic en el ícono de cada fila para ver el detalle completo o eliminarlo del historial.",
    placement: "bottom",
    styles: { spotlight: { borderRadius: 16 } },
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
      {/* Cabecera: badge paso + cerrar */}
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

      {/* Título */}
      {step.title && (
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          {step.title as React.ReactNode}
        </h3>
      )}

      {/* Contenido */}
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "#475569", lineHeight: 1.65 }}>
        {step.content as React.ReactNode}
      </p>

      {/* Pie: Saltar | Atrás + Siguiente */}
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

export default function NotificationsTour() {
  const { isRunning, stopTour } = useNotificationsTour();
  const navigate = useNavigate();

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED) {
      stopTour();
      // Encadena con el tour de "Crear Notificación"
      navigate("/notificaciones/crear?tour=start");
    } else if (status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  // Solo montamos Joyride mientras el tour está activo.
  // Evita el error "Failed to execute 'removeChild' on 'Node'" que se
  // produce cuando el spotlight/portal de Joyride se monta apuntando a un
  // elemento dentro de un contenedor sticky y luego intenta limpiarse.
  if (!isRunning) return null;

  return (
    <Joyride
      key="notif-tour"
      steps={STEPS}
      run
      continuous
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      disableScrollParentFix
      // Offset para compensar el header sticky (~88px) más margen visual
      scrollOffset={100}
      tooltipComponent={CustomTooltip}
      callback={handleCallback}
      styles={{ options: { zIndex: 10000 } }}
    />
  );
}
