/**
 * Tutorial interactivo del módulo de Curvas (basado en react-joyride)
 *
 * - Provee un Context (`useCurvasTour`) para iniciar/detener el tour desde
 *   cualquier punto del módulo (típicamente el botón "?" del AppBar).
 * - Recorre las cuatro páginas (Carga, Dashboard, Envíos, Análisis) navegando
 *   automáticamente entre rutas según el rol del usuario.
 * - Persiste en localStorage si el tour ya fue completado para no reabrirlo.
 *
 * Targets esperados en el DOM (clases / ids ya añadidos):
 *  - #tour-curvas-tabs            → Tabs de navegación (CurvasRouteLayout)
 *  - #tour-load-type              → Toggle GENERAL/PRODUCTOS (UploadPage)
 *  - #tour-referencia             → Input de referencia (UploadPage)
 *  - .tour-curvas-matrix          → Matriz dinámica (UploadPage)
 *  - .tour-curvas-actions         → Botones Guardar / Enviar a Despacho (UploadPage)
 *  - .tour-curvas-fecha           → Selector de fecha (DashboardPage)
 *  - .tour-curvas-datagrid        → DataGrid editable (DashboardPage)
 *  - .tour-curvas-tiendas         → Lista de tiendas (EnviosPage)
 *  - .tour-curvas-scan            → Campo de escaneo (EnviosPage)
 *  - .tour-curvas-analisis-rango  → Rango de fechas (AnalisisPage)
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
  TooltipRenderProps,
} from "react-joyride";
import { Box, Button, Chip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useCurvasPolicies } from "../hooks/useCurvasPolicies";
import { useTutorial } from "@/shared/hooks/TutorialContext";

// ════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════

const STORAGE_KEY = "curvas:tour:completed:v1";
const BRAND_DARK = "#004680";
const BRAND_PRIMARY = "#006ACC";

type CurvasStep = Step & { route?: string };

// Pasos para Admin / Producción (recorrido completo)
const STEPS_ADMIN: CurvasStep[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: BRAND_DARK }}>
          ¡Bienvenido al módulo de Curvas! 📦
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Este módulo gestiona la <strong>planificación y despacho</strong> de
          mercancía hacia tiendas: cargar plantillas, distribuir por talla,
          escanear códigos de barras y analizar lo despachado.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Te haremos un recorrido por las 4 secciones principales:
          <strong> Carga · Dashboard · Envíos · Análisis</strong>.
        </Typography>
      </Box>
    ),
  },
  {
    target: "#tour-curvas-tabs",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Navegación principal
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Desde estas pestañas puedes moverte entre las páginas del módulo. La
          pestaña <strong>Envíos</strong> está disponible para todos los roles;
          el resto requiere permisos de Admin o Producción.
        </Typography>
      </Box>
    ),
  },
  // ── CARGA ──
  {
    target: "#tour-load-type",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Tipo de carga
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Elige <strong>GENERAL</strong> para distribuir por curva (01, 03,
          05…) o <strong>PRODUCTOS</strong> para distribuir por tallas con
          metadatos del producto (referencia, color, proveedor, precio).
        </Typography>
      </Box>
    ),
  },
  {
    target: "#tour-referencia",
    placement: "bottom",
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Referencia del lote
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Identificador único de la plantilla. Se usa para agrupar el envío y
          para los <strong>bloqueos por concurrencia</strong>: dos personas no
          pueden escanear la misma tienda+referencia a la vez.
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-matrix",
    placement: "bottom",
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Matriz de distribución
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Edita las cantidades por <strong>tienda × talla/curva</strong>. Puedes:
        </Typography>
        <Typography variant="body2" component="div" sx={{ color: "text.secondary" }}>
          • Cargar un Excel arrastrándolo<br />
          • Editar celdas directamente<br />
          • Renombrar el encabezado de tallas
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-actions",
    placement: "bottom",
    route: "/curvas/upload",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Guardar y Enviar a Despacho
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          <strong>Guardar</strong>: deja la plantilla en estado{" "}
          <em>borrador</em> (editable).
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          <strong>Enviar a Despacho</strong>: marca el lote como{" "}
          <em>confirmado</em> (inmutable) y la habilita para Bodega.
        </Typography>
        <Chip
          label="Los lotes confirmados no se pueden volver a editar"
          size="small"
          sx={{ mt: 1.2, bgcolor: "#FFF8E1", color: "#7B5800", fontWeight: 600 }}
        />
      </Box>
    ),
  },
  // ── DASHBOARD ──
  {
    target: ".tour-curvas-fecha",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/dashboard",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard - Selector de fecha
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Filtra los lotes por fecha. Los puntos en el calendario indican días
          con lotes <strong>pendientes</strong> (amarillo) o ya{" "}
          <strong>enviados</strong> (verde).
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-datagrid",
    placement: "bottom",
    route: "/curvas/dashboard",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Tabla de datos editable
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Visualiza la matriz consolidada del día. Los administradores pueden
          editar celdas directamente, cambiar encabezados de tallas y
          confirmar lotes desde aquí. Usa el buscador y filtros para localizar
          tiendas o referencias rápidamente.
        </Typography>
      </Box>
    ),
  },
  // ── ENVÍOS ──
  {
    target: ".tour-curvas-tiendas",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Sistema de Despacho - Tiendas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Cada tienda solo puede ser atendida por <strong>una persona a la vez</strong>.
          Al seleccionar una tienda, queda reservada para ti y los demás la verán
          como no disponible.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Si seleccionas una tienda pero <strong>no realizas ningún escaneo en
          7 minutos</strong>, la reserva se libera automáticamente y cualquier
          compañero podrá tomarla.
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-scan",
    placement: "bottom",
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Escaneo de códigos de barras
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Escanea cada prenda con la pistola o cámara. Cada código leído
          suma automáticamente una unidad a la talla correspondiente y las
          celdas cambian de color según el avance:{" "}
          <strong>verde</strong> cuando la cantidad escaneada coincide con
          lo planificado.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Al presionar <strong>Guardar</strong>, el progreso queda registrado
          y la tienda se libera para que otro compañero pueda continuar.
        </Typography>
      </Box>
    ),
  },
  // ── ANÁLISIS ──
  {
    target: ".tour-curvas-analisis-rango",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/analisis",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Análisis de envíos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecciona un <strong>rango de fechas</strong> para ver métricas
          agregadas: unidades despachadas por tienda, por referencia y
          comparaciones contra lo planificado. Útil para auditar despachos.
        </Typography>
      </Box>
    ),
  },
  {
    target: "body",
    placement: "center",
    route: "/curvas/analisis",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: BRAND_DARK }}>
          ¡Listo para empezar! 🎉
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Recuerda el flujo: <strong>Cargar → Confirmar → Despachar →
          Analizar</strong>. Puedes volver a abrir este tutorial en cualquier
          momento desde el botón <strong>?</strong> en la cabecera.
        </Typography>
      </Box>
    ),
  },
];

// Pasos para Bodega (sólo Sistema de Despacho)
const STEPS_BODEGA: CurvasStep[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: BRAND_DARK }}>
          ¡Bienvenido al Sistema de Despacho! <LocalShippingIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Como usuario de Bodega tu rol es validar físicamente las plantillas
          confirmadas: seleccionas una tienda, escaneas los códigos de barras
          y guardas el envío.
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-tiendas",
    placement: "bottom",
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Selección de tienda
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Al abrir una tienda se intenta tomar el <strong>bloqueo</strong>.
          Si otro usuario ya está escaneando esa tienda+referencia, la verás
          en modo <strong>solo lectura</strong>.
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-scan",
    placement: "bottom",
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Escaneo y validación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cada código escaneado se compara con lo planificado. Las celdas se
          colorean según el avance. Al guardar, el envío queda registrado y
          la tienda se libera para otros usuarios.
        </Typography>
        <Chip
          label="El bloqueo expira solo a los 7 minutos sin actividad"
          size="small"
          sx={{ mt: 1.2, bgcolor: "#FFF8E1", color: "#7B5800", fontWeight: 600 }}
        />
      </Box>
    ),
  },
  {
    target: "body",
    placement: "center",
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: BRAND_DARK }}>
          ¡Listo! 🎉
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Si pierdes red, no te preocupes: el bloqueo se libera solo a los 7
          minutos. Puedes reabrir el tutorial desde el botón{" "}
          <strong>?</strong> en la cabecera.
        </Typography>
      </Box>
    ),
  },
];

// ════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════

interface CurvasTourContextValue {
  startTour: () => void;
  stopTour: () => void;
  isRunning: boolean;
}

const CurvasTourContext = createContext<CurvasTourContextValue | undefined>(undefined);

export const useCurvasTour = (): CurvasTourContextValue => {
  const ctx = useContext(CurvasTourContext);
  if (!ctx) throw new Error("useCurvasTour debe usarse dentro de <CurvasTourProvider>");
  return ctx;
};

// ════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ════════════════════════════════════════════════════════════

const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) => {
  const isFirstStep = index === 0;
  return (
    <Box
      {...tooltipProps}
      sx={{
        maxWidth: 420,
        bgcolor: "#fff",
        borderRadius: 2,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
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
          bgcolor: "#f9fafb",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_DARK }}>
          Paso {index + 1} de {size}
        </Typography>
        <Button
          {...closeProps}
          size="small"
          sx={{ minWidth: "auto", p: 0.5, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      <Box sx={{ p: 2 }}>{step.content}</Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderTop: "1px solid #e0e0e0",
          bgcolor: "#f9fafb",
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
            bgcolor: BRAND_DARK,
            textTransform: "none",
            borderRadius: 1,
            fontWeight: 700,
            "&:hover": { bgcolor: BRAND_PRIMARY },
          }}
        >
          {isLastStep ? "Finalizar" : "Siguiente"}
        </Button>
      </Box>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════
// PROVIDER + JOYRIDE
// ════════════════════════════════════════════════════════════

interface CurvasTourProviderProps {
  children: ReactNode;
}

export const CurvasTourProvider = ({ children }: CurvasTourProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Usamos debeAterrizarEnDespacho() — misma lógica que el layout usa para
  // redirigir a Bodega. Así Admin/Producción siempre ven el tour completo.
  const { debeAterrizarEnDespacho } = useCurvasPolicies();

  const steps: CurvasStep[] = useMemo(
    () => (debeAterrizarEnDespacho() ? STEPS_BODEGA : STEPS_ADMIN),
    [debeAterrizarEnDespacho],
  );

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigatingRef = useRef(false);
  // Refs para timeouts que deben sobrevivir a re-ejecuciones del useEffect
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cuenta reintentos cuando TARGET_NOT_FOUND ocurre en la ruta correcta
  const notFoundRetriesRef = useRef(0);

  // Iniciar el tour: navega al primer paso y arranca
  const startTour = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // Cancelar cualquier timeout de navegación/reintento pendiente
    if (navTimeoutRef.current) { clearTimeout(navTimeoutRef.current); navTimeoutRef.current = null; }
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }
    notFoundRetriesRef.current = 0;
    // Partir desde cero (run=false primero para reiniciar Joyride limpiamente)
    setRun(false);
    setStepIndex(0);

    const firstRoute = steps[0]?.route;
    const alreadyThere = !firstRoute || location.pathname === firstRoute;

    if (!alreadyThere) {
      // Navegar a la primera ruta y esperar montaje (lazy + Suspense)
      navigatingRef.current = true;
      navigate(firstRoute!);
      setTimeout(() => {
        navigatingRef.current = false;
        setRun(true);
      }, 1500);
    } else {
      // Ya estamos en la ruta correcta — pequeño delay para que React
      // confirme el nuevo stepIndex antes de que Joyride busque el target
      setTimeout(() => setRun(true), 80);
    }
  }, [navigate, location.pathname, steps]);

  const stopTour = useCallback(() => {
    if (navTimeoutRef.current) { clearTimeout(navTimeoutRef.current); navTimeoutRef.current = null; }
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }
    notFoundRetriesRef.current = 0;
    setRun(false);
    setStepIndex(0);
  }, []);

  // Integración con PeekButton: inicia el tour cuando el panel lateral
  // de "Mis aplicaciones" solicita el tutorial de Curvas.
  const { activeTutorial, endTutorial } = useTutorial();
  useEffect(() => {
    if (activeTutorial !== "curvas") return;
    endTutorial(); // Limpiar el flag global de inmediato para evitar doble disparo
    startTour();
  }, [activeTutorial, endTutorial, startTour]);

  // Sincronizar la ruta con el paso actual (navegación entre páginas)
  useEffect(() => {
    if (!run) return;
    const step = steps[stepIndex];
    if (!step?.route) return;
    if (location.pathname === step.route) return;

    // Pausar joyride mientras navegamos para evitar parpadeo
    navigatingRef.current = true;
    notFoundRetriesRef.current = 0;
    // Cancelar timeout anterior si hubiera uno pendiente
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    setRun(false);
    navigate(step.route);
    // IMPORTANTE: el timeout se guarda en un ref externo para que la limpieza
    // del useEffect NO lo cancele cuando el efecto se re-ejecuta por cambios
    // en 'run' o 'location.pathname' (que ocurren justo tras navigate/setRun).
    navTimeoutRef.current = setTimeout(() => {
      navTimeoutRef.current = null;
      navigatingRef.current = false;
      setRun(true);
    }, 1500);
    // Sin return cleanup → el timeout persiste aunque el efecto se re-ejecute
  }, [stepIndex, run, location.pathname, navigate, steps]);

  // Callback de Joyride
  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      if (status === STATUS.FINISHED) {
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
        stopTour();
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        stopTour();
        return;
      }

      // TARGET_NOT_FOUND: el elemento aún no está en el DOM.
      // Puede ocurrir porque (a) la página está cargando datos, o (b) el elemento
      // genuinamente no existe. Usamos reintentos para distinguir ambos casos.
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const step = steps[index] as CurvasStep;
        const onCorrectRoute = !step?.route || location.pathname === step.route;

        if (!onCorrectRoute) {
          // La ruta es diferente: el useEffect de sync ya está navegando, no hacer nada
          return;
        }

        // Estamos en la ruta correcta pero el target no apareció todavía.
        // Reintentar hasta MAX_RETRIES veces antes de saltar el paso.
        const MAX_RETRIES = 4;
        if (notFoundRetriesRef.current < MAX_RETRIES) {
          notFoundRetriesRef.current += 1;
          // Pausar brevemente y reanudar — el timeout va en un ref para que
          // no sea cancelado por el cleanup del useEffect de sincronización.
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          setRun(false);
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            setRun(true);
          }, 600);
        } else {
          // Agotados los reintentos → el elemento realmente no existe, saltar paso
          notFoundRetriesRef.current = 0;
          setStepIndex((i) => i + 1);
        }
        return;
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        notFoundRetriesRef.current = 0; // Reiniciar contador al avanzar manualmente
        setStepIndex(index + 1);
      }
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        notFoundRetriesRef.current = 0;
        setStepIndex(Math.max(0, index - 1));
      }
    },
    [stopTour, steps, location.pathname],
  );

  const value = useMemo<CurvasTourContextValue>(
    () => ({ startTour, stopTour, isRunning: run }),
    [startTour, stopTour, run],
  );

  return (
    <CurvasTourContext.Provider value={value}>
      {children}
      <Joyride
        run={run}
        steps={steps}
        stepIndex={stepIndex}
        callback={handleCallback}
        continuous
        showProgress={false}
        showSkipButton={false}
        disableOverlayClose
        disableScrolling={false}
        scrollToFirstStep
        spotlightClicks={false}
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 13000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.55)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: `0 0 0 3px ${BRAND_DARK}, 0 0 25px rgba(0, 70, 128, 0.45)`,
          },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Salir",
        }}
        floaterProps={{ disableAnimation: true }}
      />
    </CurvasTourContext.Provider>
  );
};

export default CurvasTourProvider;
