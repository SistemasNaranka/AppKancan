import React from "react";
import { GenericTourModal, FakePrimaryButton } from "./GenericTourModal";

const AZUL = "#004680";

interface FakeHistorialModalProps {
  open: boolean;
}

function DayCard({ day, hasHours, hours, hasNovedad, novedadTipo, isSunday }: {
  day: string;
  hasHours?: boolean;
  hours?: string;
  hasNovedad?: boolean;
  novedadTipo?: string;
  isSunday?: boolean;
}) {
  const isVacaciones = novedadTipo === "Vacaciones";
  const noMarks = !hasHours && !isVacaciones;

  const bg = noMarks
    ? "#f8fafc"
    : isVacaciones
      ? "#e3f2fd"
      : isSunday
        ? "#fef9c3"
        : "#eff6ff";

  const border = noMarks
    ? "#e2e8f0"
    : isVacaciones
      ? "#bbdefb"
      : isSunday
        ? "#fde68a"
        : "#c7dffc";

  const dayColor = noMarks
    ? "#94a3b8"
    : isSunday
      ? "#b45309"
      : "#64748b";

  return (
    <div
      className={hasHours ? "tour-hh-dia" : undefined}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        padding: "10px 10px 12px",
        borderRadius: 10,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 80,
        cursor: hasHours ? "pointer" : "default",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: dayColor }}>{day}</span>
        {hasNovedad && (
          <span style={{
            width: 7, height: 7, borderRadius: "50%", backgroundColor: "#dc2626",
            display: "inline-block",
          }} />
        )}
      </div>
      <div>
        {hasHours && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: AZUL }}>{hours}</div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>Ver detalles →</div>
          </>
        )}
        {isVacaciones && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1565c0" }}>Vacaciones</div>
        )}
        {noMarks && (
          <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>Sin marcas</div>
        )}
      </div>
    </div>
  );
}

function WeekBlock({ title, chipLabel, acumulado, isCurrent, children }: {
  title: string;
  chipLabel?: string;
  acumulado: string;
  isCurrent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="tour-hh-semanas"
      style={{
        padding: 16,
        borderRadius: 14,
        border: isCurrent ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? "#1d4ed8" : "#0f2c4a" }}>{title}</span>
          {chipLabel && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#fff", backgroundColor: "#1d4ed8",
              padding: "2px 8px", borderRadius: 8,
            }}>{chipLabel}</span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f2c4a" }}>⏱ Acumulado: {acumulado}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

export const FakeHistorialModal: React.FC<FakeHistorialModalProps> = ({ open }) => {
  if (!open) return null;

  return (
    <GenericTourModal
      title="Historial de Marcaciones"
      subtitle="Lorena Castillo · Asesor"
      avatar="LC"
      maxWidth={900}
      footer={<FakePrimaryButton label="Cerrar Historial" />}
    >
      <div className="tour-hh-navegacion" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0",
          backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#94a3b8", cursor: "not-allowed",
        }}>‹</div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f2c4a", minWidth: 180, textAlign: "center" }}>
          Julio de 2026
        </span>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0",
          backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#94a3b8", cursor: "not-allowed", opacity: 0.4,
        }}>›</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <WeekBlock title="Semana: 21 jul – 27 jul 2026" chipLabel="Actual" acumulado="0h 0m" isCurrent>
          <DayCard day="Lun. 20" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Mar. 21" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Mié. 22" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Jue. 23" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Vie. 24" hasNovedad novedadTipo="Vacaciones" />
        </WeekBlock>

        <WeekBlock title="Semana: 14 jul – 20 jul 2026" acumulado="17h 7m">
          <DayCard day="Lun. 13" />
          <DayCard day="Mar. 14" hasHours hours="8h 20m" />
          <DayCard day="Mié. 15" hasHours hours="8h 47m" />
          <DayCard day="Jue. 16" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Vie. 17" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Sáb. 18" hasNovedad novedadTipo="Vacaciones" />
          <DayCard day="Dom. 19" hasNovedad novedadTipo="Vacaciones" isSunday />
        </WeekBlock>
      </div>
    </GenericTourModal>
  );
};

export default FakeHistorialModal;