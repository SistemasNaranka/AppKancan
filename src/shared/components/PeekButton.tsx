import { useState, useEffect, useRef, type ReactNode } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CloseIcon from "@mui/icons-material/Close";

/* ══════════════════════════════════════════════════════════════
   TIPOS
   ══════════════════════════════════════════════════════════════ */

interface App {
  id: string;
  label: string;
  icon: ReactNode;
  onTutorialClick: () => void;
  isLoading?: boolean;
}

interface PeekButtonProps {
  apps?: App[];
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════════════ */

const MAIN = 56;   // diámetro botón principal
const ITEM = 42;   // diámetro cada acción
const RADIUS = 92; // radio del arco

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

/**
 * Distribuye los ítems en un arco que va de 90° (arriba) a 180° (izquierda).
 * Para 1 ítem → 130° (diagonal arriba-izquierda).
 * Para 2 ítems → 100° y 160°.
 * Para 3+ ítems → distribuidos uniformemente de 90° a 180°.
 */
function getAngleDeg(index: number, total: number): number {
  if (total <= 1) return 130;
  if (total === 2) return index === 0 ? 100 : 160;
  return 90 + (index / (total - 1)) * 90;
}

function getOffset(index: number, total: number, open: boolean) {
  const deg = getAngleDeg(index, total);
  const rad = (deg * Math.PI) / 180;
  // Sistema CSS: x positivo = derecha, y positivo = abajo
  // cos(θ) positivo → derecha; negativo → izquierda
  // -sin(θ) negativo → arriba
  const dx = open ? Math.cos(rad) * RADIUS : 0;
  const dy = open ? -Math.sin(rad) * RADIUS : 0;
  return { dx, dy };
}

/* ══════════════════════════════════════════════════════════════
   ESTILOS GLOBALES (keyframes)
   ══════════════════════════════════════════════════════════════ */

const css = `
  @keyframes fab-pulse {
    0%, 100% {
      box-shadow: 0 4px 20px rgba(0,70,128,0.45), 0 0 0 0 rgba(0,70,128,0.25);
    }
    55% {
      box-shadow: 0 4px 20px rgba(0,70,128,0.45), 0 0 0 10px rgba(0,70,128,0);
    }
  }

  @keyframes fab-spin {
    to { transform: rotate(360deg); }
  }

  .fab-main {
    transition: background 0.3s ease, transform 0.25s ease, filter 0.18s ease !important;
  }
  .fab-main:hover {
    filter: brightness(1.12);
    transform: scale(1.06) !important;
  }
  .fab-main:active {
    transform: scale(0.94) !important;
  }

  .fab-item-btn {
    transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease !important;
  }
  .fab-item-btn:hover {
    filter: brightness(1.15);
    transform: scale(1.13) !important;
    box-shadow: 0 6px 22px rgba(0, 70, 128, 0.5) !important;
  }
  .fab-item-btn:active {
    transform: scale(0.93) !important;
  }

  /* Label: oculto por defecto, visible al hacer hover sobre el ítem */
  .fab-item-wrapper .fab-item-label {
    opacity: 0;
    transform: translateY(-50%) translateX(4px);
    transition: opacity 0.18s ease, transform 0.18s ease;
    pointer-events: none;
  }
  .fab-item-wrapper:hover .fab-item-label {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
`;

/* ══════════════════════════════════════════════════════════════
   COMPONENTE
   ══════════════════════════════════════════════════════════════ */

export default function PeekButton({ apps = [] }: PeekButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer click fuera del contenedor — sin backdrop bloqueante
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // useCapture=true para capturar antes de que cualquier otro handler detenga la propagación
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  if (!apps || apps.length === 0) return null;

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <>
      <style>{css}</style>

      {/* Contenedor principal — ancla del arco */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 999,
          width: MAIN,
          height: MAIN,
        }}
      >
        {/* ── Ítems del arco ── */}
        {apps.map((app, i) => {
          const { dx, dy } = getOffset(i, apps.length, open);

          // Delay escalonado: abre de abajo hacia arriba, cierra al revés
          const openDelay = i * 55;
          const closeDelay = (apps.length - 1 - i) * 38;

          return (
            <div
              key={`${app.id}-${i}`}
              className="fab-item-wrapper"
              style={{
                position: "absolute",
                // Centrados sobre el botón principal
                left: (MAIN - ITEM) / 2,
                top: (MAIN - ITEM) / 2,
                width: ITEM,
                height: ITEM,
                zIndex: 1001,
                pointerEvents: open ? "auto" : "none",
                transform: `translate(${dx}px, ${dy}px) scale(${open ? 1 : 0.15})`,
                opacity: open ? 1 : 0,
                transition: [
                  `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${open ? openDelay : closeDelay}ms`,
                  `opacity 0.26s ease ${open ? openDelay : closeDelay}ms`,
                ].join(", "),
              }}
            >
              {/* Label: solo visible al hacer hover */}
              <div
                className="fab-item-label"
                style={{
                  position: "absolute",
                  right: ITEM + 10,
                  top: "50%",
                  whiteSpace: "nowrap",
                  background: "white",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1a2a3a",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.13)",
                  userSelect: "none",
                  letterSpacing: "0.01em",
                }}
              >
                {app.label}
              </div>

              {/* Botón de ítem */}
              <button
                className="fab-item-btn"
                onClick={() => {
                  close();
                  app.onTutorialClick();
                }}
                disabled={app.isLoading}
                title={app.label}
                style={{
                  width: ITEM,
                  height: ITEM,
                  borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.9)",
                  background: "#004680",
                  color: "white",
                  cursor: app.isLoading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 14px rgba(0, 70, 128, 0.35)",
                  outline: "none",
                  padding: 0,
                  opacity: app.isLoading ? 0.65 : 1,
                }}
              >
                {app.isLoading ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "2.5px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      animation: "fab-spin 0.7s linear infinite",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {app.icon}
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* ── Botón principal "?" ── */}
        <button
          className="fab-main"
          onClick={toggle}
          aria-label={open ? "Cerrar tutoriales" : "Ver tutoriales de aplicaciones"}
          style={{
            position: "absolute",
            inset: 0,
            width: MAIN,
            height: MAIN,
            borderRadius: "50%",
            border: "none",
            background: "#004680",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: open ? "none" : "fab-pulse 2.8s ease-in-out infinite",
            zIndex: 1002,
            outline: "none",
            padding: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transform: open ? "rotate(135deg)" : "rotate(0deg)",
            }}
          >
            {open ? (
              <CloseIcon sx={{ fontSize: 26 }} />
            ) : (
              <HelpOutlineIcon sx={{ fontSize: 30 }} />
            )}
          </div>
        </button>
      </div>
    </>
  );
}
