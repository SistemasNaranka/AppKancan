import { useState, type ReactNode } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

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
   ANIMACIONES + ESTILOS
   ══════════════════════════════════════════════════════════════ */

const animations = `
  @keyframes peek-shimmer {
    0%        { transform: translateX(-100%); }
    60%, 100% { transform: translateX(200%); }
  }
  @keyframes peek-pulse-dot {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%      { opacity: 0.55; transform: scale(0.82); }
  }
  @keyframes peek-slide-in {
    from { opacity: 0; transform: translateX(8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes peek-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes peek-fade-up {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .peek-anim-shimmer  { animation: peek-shimmer 3.2s ease-in-out infinite; }
  .peek-anim-pulse    { animation: peek-pulse-dot 2s ease-in-out infinite; }
  .peek-anim-slide-in { animation: peek-slide-in 0.28s cubic-bezier(0.34, 1.05, 0.64, 1) both; }
  .peek-anim-spin     { animation: peek-spin 0.75s linear infinite; }
  .peek-anim-fade-up  { animation: peek-fade-up 0.3s ease both; }

  .peek-panel-transition {
    transition: width 0.4s cubic-bezier(0.34, 1.05, 0.64, 1),
                opacity 0.3s ease;
  }
  .peek-tab-content-transition {
    transition: transform 0.25s ease;
  }

  .peek-item {
    position: relative;
    overflow: hidden;
  }
  .peek-item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, #004680 0%, #0070c0 100%);
    transform: scaleY(0);
    transform-origin: center;
    transition: transform 0.22s cubic-bezier(0.34, 1.05, 0.64, 1);
  }
  .peek-item:hover::before {
    transform: scaleY(1);
  }
  .peek-item:hover .peek-item-icon {
    background: linear-gradient(135deg, #004680 0%, #0070c0 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 70, 128, 0.25);
  }
  .peek-item:hover .peek-item-chevron {
    transform: translateX(3px);
    opacity: 0.9;
  }
  .peek-item:active {
    transform: scale(0.985);
  }

  .peek-item-icon {
    transition: background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease;
  }
  .peek-item-chevron {
    transition: transform 0.22s ease, opacity 0.22s ease;
  }

  .peek-scroll::-webkit-scrollbar        { width: 5px; }
  .peek-scroll::-webkit-scrollbar-track  { background: transparent; }
  .peek-scroll::-webkit-scrollbar-thumb  {
    background: rgba(0, 70, 128, 0.18);
    border-radius: 3px;
    transition: background 0.2s;
  }
  .peek-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 70, 128, 0.4);
  }
  .peek-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 70, 128, 0.18) transparent;
  }
`;

/* ══════════════════════════════════════════════════════════════
   COMPONENTE
   ══════════════════════════════════════════════════════════════ */

export default function PeekButton({ apps = [] }: PeekButtonProps) {
  const [open, setOpen] = useState(false);

  if (!apps || apps.length === 0) return null;

  return (
    <>
      <style>{animations}</style>

      <div
        className="group/peek fixed right-0 top-1/2 z-[1000] flex -translate-y-1/2 items-stretch"
        onMouseLeave={() => setOpen(false)}
      >
        {/* ────────── PANEL DESPLEGABLE ────────── */}
        <div
          className={`peek-panel-transition overflow-hidden ${
            open ? "w-[280px] opacity-100" : "w-0 opacity-0"
          }`}
          style={{
            filter: open ? "drop-shadow(-8px 0 24px rgba(0,70,128,0.12))" : "none",
          }}
        >
          <div
            className="flex max-h-[82vh] w-[280px] flex-col overflow-hidden rounded-l-2xl border-y border-l border-[rgba(0,70,128,0.12)] bg-white"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)",
            }}
          >
            {/* Header con gradient */}
            <div
              className="peek-anim-fade-up relative shrink-0 overflow-hidden px-5 pb-4 pt-5"
              style={{
                background:
                  "linear-gradient(135deg, #004680 0%, #0058a3 60%, #0070c0 100%)",
              }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
                }}
              />
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <AutoStoriesOutlinedIcon
                    sx={{ fontSize: 20, color: "#fff" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px] font-bold leading-tight text-white">
                    Mis Aplicaciones
                  </p>
                  <p className="m-0 mt-0.5 text-[10.5px] leading-tight text-white/70">
                    Centro de tutoriales
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2 py-1">
                  <span className="peek-anim-pulse h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                  <span className="text-[10px] font-semibold text-white">
                    {apps.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="peek-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2">
              {apps.map((app, i) => (
                <button
                  key={app.id}
                  onClick={app.onTutorialClick}
                  disabled={app.isLoading}
                  className="peek-item peek-anim-slide-in mb-0.5 flex w-full items-center gap-3 rounded-xl border-none bg-transparent px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#f0f6fc] disabled:cursor-not-allowed"
                  style={{
                    animationDelay: `${0.04 + i * 0.04}s`,
                    opacity: app.isLoading ? 0.6 : 1,
                  }}
                >
                  <div
                    className="peek-item-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #e8f0f9 0%, #dce8f5 100%)",
                      color: "#004680",
                    }}
                  >
                    {app.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[13px] font-semibold leading-tight text-[#1a2a3a]">
                      {app.label}
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-[11px] leading-tight text-[#64748b]">
                      <PlayCircleOutlineIcon
                        sx={{ fontSize: 11, color: "#94a3b8" }}
                      />
                      {app.isLoading ? "Cargando..." : "Ver tutorial"}
                    </p>
                  </div>
                  <span className="peek-item-chevron ml-1 shrink-0 opacity-50">
                    {app.isLoading ? (
                      <div
                        className="peek-anim-spin"
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "2px solid #004680",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <ChevronRightIcon
                        sx={{ fontSize: 18, color: "#004680" }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex shrink-0 items-center gap-2 border-t border-[rgba(0,70,128,0.08)] px-5 py-3"
              style={{
                background:
                  "linear-gradient(180deg, #fafcff 0%, #f1f6fb 100%)",
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 13, color: "#64748b" }} />
              <p className="m-0 flex-1 text-[10.5px] font-medium leading-tight text-[#64748b]">
                Tutoriales según tu nivel de acceso
              </p>
            </div>
          </div>
        </div>

        {/* ────────── TAB AZUL (botón vertical) ────────── */}
        <button
          aria-label="Mis aplicaciones"
          onMouseEnter={() => setOpen(true)}
          className="relative flex h-[80px] w-[24px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-l-xl border-none transition-all duration-200"
          style={{
            background: open
              ? "linear-gradient(180deg, #0058a3 0%, #004680 100%)"
              : "linear-gradient(180deg, #004680 0%, #003a6b 100%)",
            boxShadow: open
              ? "-4px 0 16px rgba(0,70,128,0.25)"
              : "-2px 0 8px rgba(0,70,128,0.18)",
          }}
        >
          <div className="peek-tab-content-transition z-[1] flex flex-col items-center gap-1 group-hover/peek:-translate-x-0.5">
            <ChevronRightIcon
              sx={{
                fontSize: 16,
                color: "rgba(255,255,255,0.95)",
                transform: open ? "rotate(180deg)" : "rotate(180deg)",
                transition: "transform 0.25s ease",
              }}
            />
          </div>

          {/* Shimmer */}
          <div
            className="peek-anim-shimmer pointer-events-none absolute left-0 top-0 h-full w-full"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
            }}
          />

        </button>
      </div>
    </>
  );
}
