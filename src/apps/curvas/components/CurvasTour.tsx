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

const STORAGE_KEY = "curvas:tour:completed:v1";
const BRAND_DARK = "#004680";
const BRAND_PRIMARY = "#006ACC";

const TARGET_WAIT_MS = 8000;
const POST_NAV_SETTLE_MS = 250;

type CurvasStep = Step & { route?: string };

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

const STEPS_TIENDA: CurvasStep[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: BRAND_DARK }}>
          ¡Bienvenido a Envíos! 📦
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Aquí puedes ver en tiempo real los <strong>lotes de mercancía</strong> que están
          siendo preparados y despachados hacia tu tienda.
        </Typography>
      </Box>
    ),
  },
  {
    target: "#tour-curvas-tabs",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Navegación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Como usuario de tienda solo tienes acceso a la sección de{" "}
          <strong>Envíos</strong>, donde puedes consultar el estado de los
          lotes asignados a tu tienda.
        </Typography>
      </Box>
    ),
  },
  {
    target: ".tour-curvas-tiendas",
    placement: "bottom",
    disableBeacon: true,
    route: "/curvas/envios",
    content: (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Lotes en preparación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Aquí aparecen los <strong>lotes confirmados</strong> para tu tienda.
          Cada pestaña corresponde a una referencia distinta.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Puedes ver la distribución de tallas y cantidades que están siendo
          alistadas por bodega.
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
          Estado del despacho
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Las celdas muestran el avance del escaneo en tiempo real:{" "}
          <strong>verde</strong> cuando la cantidad escaneada coincide con
          lo planificado. Así puedes saber qué tan avanzado va tu envío.
        </Typography>
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
          ¡Todo listo! 🎉
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Revisa esta sección periódicamente para seguir el progreso de tu
          envío. Puedes reabrir este tutorial desde el botón{" "}
          <strong>?</strong> en la barra superior.
        </Typography>
      </Box>
    ),
  },
];

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

const waitForElement = (
  selector: string,
  timeoutMs: number,
  abortRef: { aborted: boolean },
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (selector === "body") {
      resolve(true);
      return;
    }

    if (document.querySelector(selector)) {
      resolve(true);
      return;
    }

    let resolved = false;
    const finish = (found: boolean) => {
      if (resolved) return;
      resolved = true;
      observer.disconnect();
      clearTimeout(timeoutId);
      clearInterval(abortChecker);
      resolve(found);
    };

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) finish(true);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeoutId = window.setTimeout(() => finish(false), timeoutMs);

    const abortChecker = window.setInterval(() => {
      if (abortRef.aborted) finish(false);
    }, 200);
  });
};

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


interface CurvasTourProviderProps {
  children: ReactNode;
}

export const CurvasTourProvider = ({ children }: CurvasTourProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { debeAterrizarEnDespacho, esTiendaTransfers } = useCurvasPolicies();

  const steps: CurvasStep[] = useMemo(() => {
    if (!debeAterrizarEnDespacho()) return STEPS_ADMIN;
    if (esTiendaTransfers()) return STEPS_TIENDA;
    return STEPS_BODEGA;
  }, [debeAterrizarEnDespacho, esTiendaTransfers]);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const abortRef = useRef({ aborted: false });

  const transitionToStep = useCallback(
    async (targetIndex: number) => {
      if (targetIndex >= steps.length) {
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
        abortRef.current.aborted = true;
        abortRef.current = { aborted: false };
        setRun(false);
        setStepIndex(0);
        return;
      }
      const step = steps[targetIndex];
      if (!step) return;

      abortRef.current.aborted = true;
      const myAbort = { aborted: false };
      abortRef.current = myAbort;

      setRun(false);

      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
      }

      await new Promise((r) => setTimeout(r, POST_NAV_SETTLE_MS));
      if (myAbort.aborted) return;

      const selector =
        typeof step.target === "string" ? step.target : "body";
      const found = await waitForElement(selector, TARGET_WAIT_MS, myAbort);
      if (myAbort.aborted) return;

      if (!found) {
        if (targetIndex < steps.length - 1) {
          setStepIndex(targetIndex + 1);
        } else {
          try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
          setRun(false);
        }
        return;
      }

      setStepIndex(targetIndex);
      await new Promise((r) => setTimeout(r, 30));
      if (myAbort.aborted) return;
      setRun(true);
    },
    [steps, location.pathname, navigate],
  );

  const startTour = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    abortRef.current.aborted = true;
    abortRef.current = { aborted: false };
    setStepIndex(0);
    void transitionToStep(0);
  }, [transitionToStep]);

  const stopTour = useCallback(() => {
    abortRef.current.aborted = true;
    abortRef.current = { aborted: false };
    setRun(false);
    setStepIndex(0);
  }, []);

  const { activeTutorial, endTutorial } = useTutorial();
  useEffect(() => {
    if (activeTutorial !== "curvas") return;
    endTutorial();
    startTour();
  }, [activeTutorial, endTutorial, startTour]);

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

      if (type === EVENTS.TARGET_NOT_FOUND) {
        if (index < steps.length - 1) {
          void transitionToStep(index + 1);
        } else {
          stopTour();
        }
        return;
      }

      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        void transitionToStep(index + 1);
        return;
      }
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        void transitionToStep(Math.max(0, index - 1));
        return;
      }
    },
    [stopTour, transitionToStep, steps.length],
  );

  useEffect(() => {
    return () => {
      abortRef.current.aborted = true;
    };
  }, []);

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
        disableScrollParentFix
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
