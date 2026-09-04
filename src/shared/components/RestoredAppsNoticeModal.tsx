import React, { useEffect, useState } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  Slide,
  Chip,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { TransitionProps } from "@mui/material/transitions";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import {
  hasUserAcceptedNotice,
  saveUserNoticeAcceptance,
  NOTICE_CODE_ULTRA_RESTORED,
} from "@/services/directus/noticeConfirmations";

// ============================================================
// COMPONENTE TEMPORAL: AVISO DE MÓDULOS RESTABLECIDOS
// INSTRUCCIONES PARA DENTRO DE 2 DÍAS:
// 1. Cambiar ACTIVAR_AVISO_RESTABLECIMIENTO a false (o eliminar este archivo)
// 2. Eliminar la importación y etiqueta <RestoredAppsNoticeModal /> en src/App.tsx
// ============================================================
const ACTIVAR_AVISO_RESTABLECIMIENTO = false;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function RestoredAppsNoticeModal() {
  if (!ACTIVAR_AVISO_RESTABLECIMIENTO) return null;

  const { user, isAuthenticated } = useAuth();
  const { apps, loading: appsLoading } = useApps();
  const [open, setOpen] = useState(false);
  const [targetApps, setTargetApps] = useState<{
    traslados: boolean;
    comisiones: boolean;
  }>({ traslados: false, comisiones: false });

  useEffect(() => {
    // Si el aviso temporal está desactivado, no hacer nada
    if (!ACTIVAR_AVISO_RESTABLECIMIENTO) return;

    // Si no está autenticado o están cargando las aplicaciones, esperar
    if (!isAuthenticated || !user?.id || appsLoading) return;

    // RESTRICCIÓN DE ROL: Mostrar ÚNICAMENTE a usuarios con rol "tienda"
    const rolUsuario = String(
      (user as any)?.rol ||
      (user as any)?.role?.name ||
      (user as any)?.role ||
      ""
    ).toLowerCase();

    const esRolTienda = rolUsuario.includes("tienda");
    if (!esRolTienda) {
      return; // Si NO es rol tienda, NO se muestra el aviso
    }

    // Verificar si el usuario tiene permiso o acceso a Traslados y/o Comisiones
    const tieneTraslados =
      apps.some((a) => {
        const rutaStr = String(a.ruta || "").toLowerCase();
        const nomStr = String(a.nombre || "").toLowerCase();
        const idStr = String(a.id || "").toLowerCase();
        return (
          rutaStr.includes("traslado") ||
          nomStr.includes("traslado") ||
          idStr.includes("traslado")
        );
      }) ||
      (user?.policies &&
        user.policies.some((p: any) => {
          const name = String(p?.policy?.name || "").toLowerCase();
          return name.includes("traslado") || name.includes("store_transfers");
        }));

    const tieneComisiones =
      apps.some((a) => {
        const rutaStr = String(a.ruta || "").toLowerCase();
        const nomStr = String(a.nombre || "").toLowerCase();
        const idStr = String(a.id || "").toLowerCase();
        return (
          rutaStr.includes("comision") ||
          nomStr.includes("comision") ||
          idStr.includes("comision")
        );
      }) ||
      (user?.policies &&
        user.policies.some((p: any) => {
          const name = String(p?.policy?.name || "").toLowerCase();
          return name.includes("commission") || name.includes("comision");
        }));

    // Si el usuario no tiene ninguna de las dos aplicaciones, NO se le muestra nada
    if (!tieneTraslados && !tieneComisiones) {
      return;
    }

    setTargetApps({
      traslados: !!tieneTraslados,
      comisiones: !!tieneComisiones,
    });

    // Consultar en la BASE DE DATOS (Directus) si este usuario ya aceptó el aviso
    let active = true;
    hasUserAcceptedNotice(user.id, NOTICE_CODE_ULTRA_RESTORED).then(
      (yaAceptado) => {
        if (active && !yaAceptado) {
          setOpen(true);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, user?.policies, (user as any)?.rol, (user as any)?.role, apps, appsLoading]);

  const handleAccept = async () => {
    setOpen(false);
    if (user?.id) {
      // Registrar la aceptación en la BD
      await saveUserNoticeAcceptance(user.id, NOTICE_CODE_ULTRA_RESTORED);
    }
  };

  if (!open) return null;

  const esAmbas = targetApps.traslados && targetApps.comisiones;
  const esSoloTraslados = targetApps.traslados && !targetApps.comisiones;
  const esSoloComisiones = !targetApps.traslados && targetApps.comisiones;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      disableEscapeKeyDown={true}
      onClose={(_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return; // BLOQUEADO: No se cierra al hacer clic fuera o presionar Esc
        }
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          border: "1px solid #E0E0E0",
          overflow: "hidden",
        },
      }}
    >
      {/* 🔹 ENCABEZADO EN COLOR SÓLIDO (#004680 - PRIMARY MAIN DE KANCAN) */}
      <Box
        sx={{
          bgcolor: "#004680",
          color: "#FFFFFF",
          py: 2.5,
          px: 3,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 38, color: "#FFFFFF" }} />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: "#FFFFFF", fontSize: "1.1rem" }}
        >
          Aviso Informativo
        </Typography>
      </Box>

      {/* 🔹 CUERPO CON TEXTO DIRECTO Y COLORES SÓLIDOS */}
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            mb: 2,
          }}
        >
          {targetApps.traslados && (
            <Chip
              label="Traslados"
              size="small"
              sx={{
                bgcolor: "#E6F4FF",
                color: "#004680",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            />
          )}
          {targetApps.comisiones && (
            <Chip
              label="Comisiones"
              size="small"
              sx={{
                bgcolor: "#FFF8E1",
                color: "#E6A700",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            />
          )}
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: "#333333",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          {esAmbas && (
            <>
              Le informamos que las aplicaciones de <strong>Traslados</strong> y{" "}
              <strong>Comisiones</strong> se encuentran nuevamente funcionales para su uso. La información está completamente sincronizada con el sistema <strong>Ultra</strong>, por lo que puede realizar sus consultas y operaciones con total normalidad.
            </>
          )}
          {esSoloTraslados && (
            <>
              Le informamos que la aplicación de <strong>Traslados</strong> se encuentra nuevamente funcional para su uso. La información de los traslados está completamente sincronizada con el sistema <strong>Ultra</strong>, por lo que puede realizar sus operaciones con total normalidad.
            </>
          )}
          {esSoloComisiones && (
            <>
              Le informamos que la aplicación de <strong>Comisiones</strong> se encuentra nuevamente funcional para su uso. La información de ventas y presupuestos está completamente sincronizada con el sistema <strong>Ultra</strong>, por lo que puede realizar sus consultas con total normalidad.
            </>
          )}
        </Typography>

        {/* 🔹 BOTÓN ÚNICO DE ACEPTAR */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleAccept}
          sx={{
            bgcolor: "#004680",
            color: "#FFFFFF",
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#002747",
              boxShadow: "none",
            },
          }}
        >
          Aceptar
        </Button>
      </Box>
    </Dialog>
  );
}
