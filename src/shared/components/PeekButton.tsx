import { useState, type ReactNode } from "react";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";

/* ══════════════════════════════════════════════════════════════
   ICONOS DEL COMPONENTE
   ══════════════════════════════════════════════════════════════ */

/**
 * 👇👇👇  ICONO DEL TAB AZUL (el botoncito vertical a la derecha)
 *
 * Para cambiarlo:
 *   - Reemplaza el <svg> de abajo por el que quieras.
 *   - Mantén width/height pequeños (10–14 px).
 *   - Usa stroke="currentColor" para heredar el color blanco que
 *     ya está configurado en el contenedor.
 *   - Si prefieres usar lucide-react, MUI icons u otra librería,
 *     simplemente importa y devuélvelo aquí.
 *
 *   Ejemplo con lucide-react:
 *     import { HelpCircle } from "lucide-react";
 *     const TabIcon = () => <HelpCircle size={12} strokeWidth={2.5} />;
 */
const TabIcon = (): ReactNode => (
  <ArrowCircleLeftIcon sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.9)" }} />
);

/** Flecha ">" de cada item del panel */
const ChevronIcon = (): ReactNode => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#004680"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/** Icono pequeño del footer ("Tutoriales según tu acceso") */
const FooterInfoIcon = (): ReactNode => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8a9bb0"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4m0 4h.01" />
  </svg>
);

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
   KEYFRAMES Y SCROLLBAR
   (Lo único que Tailwind no cubre sin tocar tailwind.config)
   ══════════════════════════════════════════════════════════════ */
const animations = `
  @keyframes peek-shimmer {
    0%        { transform: translateX(-100%); }
    60%, 100% { transform: translateX(200%); }
  }
  @keyframes peek-pulse-dot {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%      { opacity: 0.6; transform: scale(0.85); }
  }
  @keyframes peek-slide-in {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes peek-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .peek-anim-shimmer  { animation: peek-shimmer 3s ease-in-out infinite; }
  .peek-anim-pulse    { animation: peek-pulse-dot 2s ease-in-out infinite; }
  .peek-anim-slide-in { animation: peek-slide-in 0.22s ease both; }
  .peek-anim-spin     { animation: peek-spin 0.75s linear infinite; }

  .peek-panel-transition {
    transition: width 0.38s cubic-bezier(0.34, 1.05, 0.64, 1);
  }
  .peek-tab-content-transition {
    transition: transform 0.25s ease;
  }

  .peek-scroll::-webkit-scrollbar        { width: 6px; }
  .peek-scroll::-webkit-scrollbar-track  { background: transparent; }
  .peek-scroll::-webkit-scrollbar-thumb  {
    background: rgba(0, 70, 128, 0.15);
    border-radius: 3px;
    transition: background 0.2s;
  }
  .peek-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 70, 128, 0.35);
  }
  .peek-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 70, 128, 0.15) transparent;
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
        className="group/peek fixed right-0 top-1/2 z-[1000] flex -translate-y-1/2 items-center"
        onMouseLeave={() => setOpen(false)}
      >
        {/* ────────── PANEL DESPLEGABLE ────────── */}
        <div
          className={`
            peek-panel-transition
            overflow-hidden
            ${open ? "w-[248px] shadow-[-2px_0_18px_[rgba(0,70,128,0.06)]" : "w-0"}
          `}
        >
          <div className="flex max-h-[80vh] w-[248px] flex-col rounded-l-[14px] border-y border-l border-[rgba(0,70,128,0.15)] bg-white px-[18px] pb-4 pt-5">
            {/* Header */}
            <div className="mb-4 flex shrink-0 items-center gap-2">
              <div className="peek-anim-pulse h-2 w-2 shrink-0 rounded-full bg-[#004680]" />
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#004680]">
                Mis aplicaciones
              </p>
            </div>

            {/* Lista scrollable */}
            <div className="peek-scroll -mr-1.5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1.5">
              {apps.map((app, i) => (
                <button
                  key={app.id}
                  onClick={app.onTutorialClick}
                  disabled={app.isLoading}
                  className="peek-anim-slide-in mb-1 flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#f0f5fb] disabled:cursor-not-allowed"
                  style={{
                    animationDelay: `${0.04 + i * 0.05}s`,
                    opacity: app.isLoading ? 0.65 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#e8f0f9]">
                    {app.icon}
                  </div>
                  <div>
                    <p className="m-0 text-[13px] font-medium leading-tight text-[#1a2a3a]">
                      {app.label}
                    </p>
                    <p className="m-0 text-[11px] leading-tight text-[#8a9bb0]">
                      {app.isLoading ? "Cargando tutorial..." : "Ver tutorial"}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 opacity-[0.35]">
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
                      <ChevronIcon />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-3 flex shrink-0 items-center gap-1.5 border-t border-[rgba(0,70,128,0.1)] pl-1 pt-3">
              <FooterInfoIcon />
              <p className="m-0 text-[11px] text-[#8a9bb0]">
                Tutoriales según tu acceso
              </p>
            </div>
          </div>
        </div>

        {/* ────────── TAB AZUL (botón vertical) ────────── */}
        <button
          aria-label="Mis aplicaciones"
          onMouseEnter={() => setOpen(true)}
          className={`
            relative flex h-[72px] w-[22px] shrink-0 cursor-pointer
            items-center justify-center overflow-hidden rounded-l-lg border-none
            transition-colors duration-200
            ${open ? "bg-[#005aa3]" : "bg-[#004680]"}
          `}
        >
          <div className="peek-tab-content-transition z-[1] flex flex-col items-center gap-1 group-hover/peek:-translate-x-0.5">
            <TabIcon />
          </div>

          {/* Shimmer */}
          <div
            className="peek-anim-shimmer pointer-events-none absolute left-0 top-0 h-full w-full"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
            }}
          />
        </button>
      </div>
    </>
  );
}