import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  ACTIONS,
  EVENTS,
  Step,
} from "react-joyride";
import { Box, Typography, Button, TextField, Divider } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { CustomTooltip } from "./TourTooltip";

const AZUL = "#004680";

/* ============================================================
 * 1. STEPS
 * ============================================================ */

const FAKE_MODAL_TARGETS = [".tour-fake-datos-basicos", ".tour-fake-asignacion"];

const ADMIN_STEPS: Step[] = [
  {
    target: ".tour-nuevo-empleado",
    disableBeacon: true,
    placement: "bottom",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Registra un empleado nuevo
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Este botón te permite registrar un empleado nuevo en el sistema. Presiona{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
            Siguiente
          </Box>{" "}
          para ver cómo se ve el formulario.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-fake-datos-basicos",
    placement: "bottom",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Datos básicos
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Primero registras el <strong>documento</strong> y <strong>nombre completo</strong> del
          empleado. El sistema detecta automáticamente si el documento ya existe.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-fake-asignacion",
    placement: "top",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Asignación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Luego asignas la <strong>tienda</strong> y el <strong>cargo</strong> del nuevo empleado.
          La tienda es obligatoria; el cargo es opcional.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-selector-tienda",
    disableBeacon: true,
    placement: "bottom",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtra por tienda
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Filtra la lista por una tienda específica, o deja <strong>"Todas las tiendas"</strong> para
          ver el listado completo del sistema.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-buscador-empleado",
    disableBeacon: true,
    placement: "bottom",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Busca un empleado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Busca por <strong>nombre</strong> o <strong>número de documento</strong>. Funciona sobre
          todas las tiendas si no filtraste una en particular.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-contadores-estado",
    disableBeacon: true,
    placement: "bottom",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Filtra por estado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Filtra rápidamente entre <strong>todos</strong> los empleados, solo los{" "}
          <strong>activos</strong>, o solo los <strong>inactivos</strong>.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-lista-empleados",
    disableBeacon: true,
    placement: "top",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Tarjetas de empleado
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Cada tarjeta muestra el <strong>estado</strong> del empleado, su <strong>cargo</strong> y
          su <strong>tienda</strong>. Haz clic en cualquiera para ver su perfil completo,
          reactivarlo o cambiarlo de tienda.
        </Typography>
      </>
    ),
  },
  {
    target: ".tour-paginacion",
    disableBeacon: true,
    placement: "top",
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Paginación
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Con más de mil empleados en el sistema, usa la paginación o ajusta cuántos se muestran
          por página.
        </Typography>
      </>
    ),
  },
];

/* ============================================================
 * 2. FAKE MODAL GENÉRICO
 * Cuando venga un segundo tour que lo necesite, se mueve a
 * shared/tour/FakeTourModal.tsx sin tocar más nada.
 * ============================================================ */

interface FakeTourModalProps {
  title: string;
  children: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
}

function FakeTourModal({
  title,
  children,
  primaryLabel = "Guardar",
  secondaryLabel = "Cancelar",
}: FakeTourModalProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.5)",
        zIndex: 1299,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
          borderRadius: 4,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          zIndex: 1300,
        }}
      >
        <Box sx={{ bgcolor: AZUL, color: "#fff", py: 2, px: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{title}</Typography>
        </Box>
        <Box
          sx={{
            p: 3,
            borderTop: "1px solid rgba(0,0,0,0.12)",
            borderBottom: "1px solid rgba(0,0,0,0.12)",
            overflowY: "auto",
          }}
        >
          {children}
        </Box>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            disabled
            sx={{
              color: "#475569",
              borderColor: "#cbd5e1",
              fontWeight: 700,
            }}
          >
            {secondaryLabel}
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled
            sx={{ bgcolor: AZUL, textTransform: "none", fontWeight: 700 }}
          >
            {primaryLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/* ============================================================
 * 3. CONTENIDO ESPECÍFICO — "Nuevo empleado"
 * ============================================================ */

function SeccionLabel({ texto }: { texto: string }) {
  return (
    <Divider textAlign="left">
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
        {texto}
      </Typography>
    </Divider>
  );
}

function FakeNuevoEmpleadoModal({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <FakeTourModal title="Nuevo empleado" primaryLabel="Crear empleado" secondaryLabel="Cancelar">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box className="tour-fake-datos-basicos" sx={{ display: "flex", gap: 2, p: "2px" }}>
            <TextField
              size="small"
              label="Tipo de documento"
              value="Cédula de Ciudadanía"
              disabled
              fullWidth
            />
            <TextField size="small" label="Número de documento" disabled fullWidth />
          </Box>
          <SeccionLabel texto="NOMBRE" />
          <TextField size="small" label="Nombre completo *" disabled fullWidth />
        </Box>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <SeccionLabel texto="ASIGNACIÓN" />
          <Box className="tour-fake-asignacion" sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: "2px" }}>
            <TextField size="small" label="Tienda *" disabled fullWidth />
            <TextField size="small" label="Cargo" disabled fullWidth />
          </Box>
        </Box>
        
      </Box>
    </FakeTourModal>
  );
}

/* ============================================================
 * 4. CONTEXT MÍNIMO
 * Solo expone startTour para que TutorialAdminButton pueda
 * dispararlo desde afuera del AdminTour.
 * ============================================================ */

interface AdminTourCtx {
  startTour: () => void;
}
const AdminTourContext = createContext<AdminTourCtx | undefined>(undefined);

export const useAdminTour = (): AdminTourCtx => {
  const ctx = useContext(AdminTourContext);
  if (!ctx) throw new Error("useAdminTour debe usarse dentro de <AdminTour>");
  return ctx;
};

/* ============================================================
 * 5. BOTÓN "TUTORIAL" (exportado)
 * ============================================================ */

export const TutorialAdminButton: React.FC = () => {
  const { startTour } = useAdminTour();
  return (
    <Button
      variant="contained"
      disableElevation
      startIcon={<HelpOutlineIcon />}
      onClick={startTour}
      sx={{
        bgcolor: AZUL,
        color: "#fff",
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2,
        "&:hover": { bgcolor: "#003a6b" },
      }}
    >
      Tutorial
    </Button>
  );
};

/* ============================================================
 * 6. COMPONENTE PRINCIPAL — AdminTour
 * Mismo patrón de overlay-sync (doble RAF + remount) que
 * HorariosTour, adaptado a un solo overlay.
 * ============================================================ */

const needsOverlay = (target?: string | null): boolean =>
  !!target && FAKE_MODAL_TARGETS.includes(target);

interface AdminTourProps {
  children: ReactNode;
}

export const AdminTour: React.FC<AdminTourProps> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [runTour, setRunTour] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [joyrideKey, setJoyrideKey] = useState(0);
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
  }, []);

  useEffect(() => {
    if (isRunning) {
      setShowOverlay(false);
      const t = setTimeout(() => setRunTour(true), 250);
      return () => clearTimeout(t);
    }
    setRunTour(false);
    setShowOverlay(false);
    setPendingStepIndex(null);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const step = ADMIN_STEPS[stepIndex];
    setShowOverlay(needsOverlay(step?.target as string | undefined));
  }, [isRunning, stepIndex]);

  useEffect(() => {
    if (!showOverlay || pendingStepIndex === null) return;
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setJoyrideKey((k) => k + 1);
        setStepIndex(pendingStepIndex);
        setPendingStepIndex(null);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [showOverlay, pendingStepIndex]);

  useEffect(() => {
    if (showOverlay && runTour) {
      const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
      return () => clearTimeout(t);
    }
  }, [stepIndex, showOverlay, runTour]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;

      if (status === STATUS.FINISHED) {
        setRunTour(false);
        setShowOverlay(false);
        setPendingStepIndex(null);
        stopTour();
        return;
      }

      if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
        setRunTour(false);
        setShowOverlay(false);
        setPendingStepIndex(null);
        stopTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER && (action === ACTIONS.NEXT || action === ACTIONS.PREV)) {
        const targetIndex = action === ACTIONS.NEXT ? index + 1 : index - 1;
        const targetStep = ADMIN_STEPS[targetIndex];
        const overlayNeeded = needsOverlay(targetStep?.target as string | undefined);

        if (overlayNeeded && !showOverlay) {
          setShowOverlay(true);
          setPendingStepIndex(targetIndex);
          return;
        }
        if (!overlayNeeded && showOverlay) {
          setShowOverlay(false);
        }
        setStepIndex(targetIndex);
      }
    },
    [showOverlay, stopTour]
  );

  return (
    <AdminTourContext.Provider value={{ startTour }}>
      {children}

      <FakeNuevoEmpleadoModal open={showOverlay} />

      <Joyride
        run={runTour}
        key={`${joyrideKey}-admin`}
        steps={ADMIN_STEPS}
        stepIndex={stepIndex}
        callback={handleCallback}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrollParentFix
        scrollToFirstStep
        spotlightClicks
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: "0 0 0 3px #004680, 0 0 25px rgba(0, 74, 153, 0.4)",
          },
          buttonClose: { display: "none" },
          buttonBack: { display: "none" },
          buttonNext: { display: "none" },
          buttonSkip: { display: "none" },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Continuar",
          next: "Siguiente",
          skip: "Salir del tour",
        }}
        floaterProps={{ disableAnimation: true }}
      />
    </AdminTourContext.Provider>
  );
};

export default AdminTour;