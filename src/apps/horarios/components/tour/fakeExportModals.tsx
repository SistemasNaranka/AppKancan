import React from "react";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// ============================================================
// MODAL SIMULADO - EXPORTAR PAUSAS ACTIVAS (REGISTROS)
// ============================================================
export const FakeExportModal: React.FC<{ open: boolean; activeField: string | null }> = ({
  open,
  activeField,
}) => {
  if (!open) return null;

  const isModalStep = exportModalTargets.includes(activeField || "");
  const isFechaActive = activeField === "#tour-export-fecha-field";
  const isBotonActive = activeField === "#tour-export-boton";

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
          maxWidth: 440,
          backgroundColor: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
          margin: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: "#004680",
            color: "#fff",
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FileDownloadIcon sx={{ fontSize: 22 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Exportar pausas activas</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Reportes de pausas y eventos de la tienda</div>
          </div>
        </div>

        <div style={{ padding: 20, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>
            Rango de fechas
          </div>

          <div
            id="tour-export-fecha-field"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#eef2fb",
              border: isFechaActive ? "3px solid #008CFF" : "1px solid #cbd5e1",
              borderRadius: 8,
              padding: isFechaActive ? "9px 11px" : "10px 12px",
              marginBottom: 16,
              position: "relative",
              zIndex: isFechaActive ? 6 : 1,
              boxShadow: isFechaActive ? "0 0 8px rgba(0, 140, 255, 0.35)" : "none",
              transition: "all 0.1s ease",
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 16, color: "#334155" }} />
            <span style={{ fontSize: 14, color: "#334155" }}>Todo</span>
          </div>

          <div style={{ display: "flex", gap: 10, backgroundColor: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#b45309", flexShrink: 0, mt: "2px" }} />
            <span style={{ fontSize: 13, color: "#854d0e", lineHeight: 1.5 }}>
              No seleccionaste un rango de fechas: se exportará solo el día de hoy (15-07-2026).
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                cursor: "not-allowed",
                textTransform: "uppercase",
              }}
            >
              Cancelar
            </div>
            <div
              id="tour-export-boton"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: isBotonActive ? "3px solid #008CFF" : "3px solid transparent",
                backgroundColor: "#004680",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: isBotonActive ? 6 : 1,
                boxShadow: isBotonActive
                  ? "0 0 8px rgba(0, 140, 255, 0.35)"
                  : "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
                transition: "all 0.1s ease",
              }}
            >
              <FileDownloadIcon sx={{ fontSize: 15 }} />
              Exportar
            </div>
          </div>

          {isModalStep && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                zIndex: 5,
                pointerEvents: "none",
                borderRadius: "0 0 12px 12px",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const exportModalTargets = ["#tour-export-fecha-field", "#tour-export-boton"];

// ============================================================
// MODAL SIMULADO - EXPORTAR NOVEDADES
// ============================================================
export const FakeExportNovedadesModal: React.FC<{ open: boolean; activeField: string | null }> = ({
  open,
  activeField,
}) => {
  if (!open) return null;

  const isFechaActive = activeField === "#tour-nov-export-fecha-field";
  const isBotonActive = activeField === "#tour-nov-export-boton";
  const isModalStepNov = isFechaActive || isBotonActive;

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
          maxWidth: 440,
          backgroundColor: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
          margin: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: "#004680",
            color: "#fff",
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FileDownloadIcon sx={{ fontSize: 22 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Exportar novedades</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Selecciona el rango de fechas</div>
          </div>
        </div>

        <div style={{ padding: 20, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>
            Rango de fechas
          </div>

          <div
            id="tour-nov-export-fecha-field"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#eef2fb",
              border: isFechaActive ? "3px solid #008CFF" : "1px solid #cbd5e1",
              borderRadius: 8,
              padding: isFechaActive ? "9px 11px" : "10px 12px",
              marginBottom: 16,
              position: "relative",
              zIndex: isFechaActive ? 6 : 1,
              boxShadow: isFechaActive ? "0 0 8px rgba(0, 140, 255, 0.35)" : "none",
              transition: "all 0.1s ease",
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 16, color: "#334155" }} />
            <span style={{ fontSize: 14, color: "#334155" }}>Todo</span>
          </div>

          <div style={{ display: "flex", gap: 10, backgroundColor: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#b45309", flexShrink: 0, mt: "2px" }} />
            <span style={{ fontSize: 13, color: "#854d0e", lineHeight: 1.5 }}>
              No seleccionaste un rango de fechas: se exportará solo el día de hoy (15-07-2026).
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                cursor: "not-allowed",
                textTransform: "uppercase",
              }}
            >
              Cancelar
            </div>
            <div
              id="tour-nov-export-boton"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: isBotonActive ? "3px solid #008CFF" : "3px solid transparent",
                backgroundColor: "#004680",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: isBotonActive ? 6 : 1,
                boxShadow: isBotonActive
                  ? "0 0 8px rgba(0, 140, 255, 0.35)"
                  : "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
                transition: "all 0.1s ease",
              }}
            >
              <FileDownloadIcon sx={{ fontSize: 15 }} />
              Exportar
            </div>
          </div>

          {isModalStepNov && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                zIndex: 5,
                pointerEvents: "none",
                borderRadius: "0 0 12px 12px",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const exportNovedadesModalTargets = ["#tour-nov-export-fecha-field", "#tour-nov-export-boton"];

// ============================================================
// MODAL SIMULADO - EXPORTAR HISTORIAL
// ============================================================
export const FakeExportHistorialModal: React.FC<{ open: boolean; activeField: string | null }> = ({
  open,
  activeField,
}) => {
  if (!open) return null;

  const isFechaActive = activeField === "#tour-hist-export-fecha-field";
  const isDetalladaActive = activeField === "#tour-hist-export-detallada";
  const isBotonActive = activeField === "#tour-hist-export-boton";
  const isModalStepHist = isFechaActive || isDetalladaActive || isBotonActive;

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
          maxWidth: 460,
          backgroundColor: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
          margin: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: "#004680",
            color: "#fff",
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <FileDownloadIcon sx={{ fontSize: 22 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Exportar historial</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Selecciona el rango de fechas</div>
          </div>
        </div>

        <div style={{ padding: 20, position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>
            Rango de fechas
          </div>

          <div
            id="tour-hist-export-fecha-field"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#eef2fb",
              border: isFechaActive ? "3px solid #008CFF" : "1px solid #cbd5e1",
              borderRadius: 8,
              padding: isFechaActive ? "9px 11px" : "10px 12px",
              marginBottom: 16,
              position: "relative",
              zIndex: isFechaActive ? 6 : 1,
              boxShadow: isFechaActive ? "0 0 8px rgba(0, 140, 255, 0.35)" : "none",
              transition: "all 0.1s ease",
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 16, color: "#334155" }} />
            <span style={{ fontSize: 14, color: "#334155" }}>Todo</span>
          </div>

          <div style={{ display: "flex", gap: 10, backgroundColor: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#b45309", flexShrink: 0, mt: "2px" }} />
            <span style={{ fontSize: 13, color: "#854d0e", lineHeight: 1.5 }}>
              No seleccionaste un rango de fechas: se exportará solo el día de hoy (15-07-2026).
            </span>
          </div>

          <div
            id="tour-hist-export-detallada"
            style={{
              display: "flex",
              gap: 10,
              paddingTop: isDetalladaActive ? 14 : 16,
              paddingBottom: isDetalladaActive ? 10 : 0,
              paddingLeft: isDetalladaActive ? 10 : 0,
              paddingRight: isDetalladaActive ? 10 : 0,
              borderTop: isDetalladaActive ? "none" : "1px solid #e2e8f0",
              marginBottom: 20,
              position: "relative",
              zIndex: isDetalladaActive ? 6 : 1,
              backgroundColor: isDetalladaActive ? "#ffffff" : "transparent",
              border: isDetalladaActive ? "3px solid #008CFF" : "3px solid transparent",
              borderRadius: isDetalladaActive ? 8 : 0,
              boxShadow: isDetalladaActive
                ? "0 0 8px rgba(0, 140, 255, 0.35)"
                : "none",
              transition: "all 0.1s ease",
            }}
          >
            <input
              type="checkbox"
              disabled
              style={{ marginTop: 3, width: 16, height: 16, accentColor: "#004680", cursor: "not-allowed" }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>Descarga detallada</div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>
                Incluye el motivo del cambio, la observación/nota y la hora inicial de cada evento editado.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                cursor: "not-allowed",
                textTransform: "uppercase",
              }}
            >
              Cancelar
            </div>
            <div
              id="tour-hist-export-boton"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: isBotonActive ? "3px solid #008CFF" : "3px solid transparent",
                backgroundColor: "#004680",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.02857em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: isBotonActive ? 6 : 1,
                boxShadow: isBotonActive
                  ? "0 0 8px rgba(0, 140, 255, 0.35)"
                  : "0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)",
                transition: "all 0.1s ease",
              }}
            >
              <FileDownloadIcon sx={{ fontSize: 15 }} />
              Exportar
            </div>
          </div>

          {isModalStepHist && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                zIndex: 5,
                pointerEvents: "none",
                borderRadius: "0 0 12px 12px",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const exportHistorialModalTargets = [
  "#tour-hist-export-fecha-field",
  "#tour-hist-export-detallada",
  "#tour-hist-export-boton",
];