import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useTutorial } from "@/shared/hooks/TutorialContext";
import PeekButton from "./PeekButton";
import EventAvailable from "@mui/icons-material/EventAvailable";
import AccessTime from "@mui/icons-material/AccessTime";
import TransferWithinAStation from "@mui/icons-material/TransferWithinAStation";
import NotificationsActive from "@mui/icons-material/NotificationsActive";
import Apps from "@mui/icons-material/Apps";

/* ----------------------------- Iconos por app ----------------------------- */
const APP_ICONS: Record<string, React.ReactNode> = {
  reservas: (
    <EventAvailable sx={{ width: 18, height: 18, color: "#fff" }} />
  ),
  prorrogas: (
    <AccessTime sx={{ width: 18, height: 18, color: "#fff" }} />
  ),
  traslados: (
    <TransferWithinAStation sx={{ width: 18, height: 18, color: "#fff" }} />
  ),
  notificaciones: (
    <NotificationsActive sx={{ width: 18, height: 18, color: "#fff" }} />
  ),
};

const DefaultIcon = (
  <Apps sx={{ width: 18, height: 18, color: "#fff" }} />
);

/* ------------------------- Rutas fijas por tutorial ------------------------ */
// Garantiza que el menú de tutoriales lleve siempre a la ruta correcta
// aunque la data del backend (userApps) tenga otra ruta o esté vacía.
const TUTORIAL_ROUTES: Record<string, string> = {
  contactos: "/contactos",
  notificaciones: "/notificaciones",
  reservas: "/reservas",
  prorrogas: "/prorrogas",
  traslados: "/traslados",
};

/* ----------------- Apps con tutorial implementado ------------------- */
// Solo las apps cuyo slug esté aquí aparecerán en el PeekButton, aunque
// el usuario tenga otras apps asignadas. Cuando se implemente un tour
// nuevo, añadir su slug a este Set.
const APPS_WITH_TUTORIAL = new Set<string>([
  "notificaciones",
  "reservas",
  "traslados",
  "curvas",
  "contabilizacion_factura",
]);

/* --------------------------- Helpers de extracción -------------------------- */
const pick = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* --------------------------------- Component -------------------------------- */
export default function PeekButtonContainer() {
  const { isAuthenticated } = useAuth();
  const { apps: userApps, loadingStatus } = useApps();
  const { startTutorial, activeTutorial } = useTutorial();
  const navigate = useNavigate();

  // Rastrea qué app está cargando su tutorial
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // Cuando activeTutorial vuelve a null significa que el tour ya arranó
  // (endTutorial() fue llamado dentro de la app) → limpiar spinner
  useEffect(() => {
    if (activeTutorial === null && loadingKey !== null) {
      setLoadingKey(null);
    }
  }, [activeTutorial, loadingKey]);

  const apps = useMemo(() => {
    if (!userApps?.length) return [];

    return userApps
      .map((app: Record<string, unknown>) => {
        const label =
          pick(app, ["name", "nombre", "title", "label", "display_name", "titulo"]) ??
          String(app.id ?? "App");

        const key = pick(app, ["slug", "codigo", "code"])?.toLowerCase() ?? slugify(label);

        // Prioridad: mapa fijo > data del backend > fallback /{key}
        const route =
          TUTORIAL_ROUTES[key] ??
          pick(app, ["route", "path", "url"]) ??
          `/${key}`;

        return {
          id: String(app.id ?? key),
          key,
          label,
          icon: APP_ICONS[key] ?? DefaultIcon,
          isLoading: loadingKey === key,
          onTutorialClick: () => {
            setLoadingKey(key);
            startTutorial(key);
            navigate(route);
          },
        };
      })
      // Solo apps que tengan un tutorial implementado
      .filter((app) => APPS_WITH_TUTORIAL.has(app.key));
  }, [userApps, navigate, startTutorial, loadingKey]);

  if (!isAuthenticated) return null;
  if (loadingStatus?.status !== "loaded") return null;
  if (apps.length === 0) return null;

  return <PeekButton apps={apps} />;
}
