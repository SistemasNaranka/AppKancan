import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Paper, Typography, Box, Divider } from "@mui/material";
import { Global } from "@emotion/react";
import { Traslado } from "../hooks/types";
import PendientesFilters from "./PendientesFilters";
import ConfirmacionAprobacion from "./ConfirmacionAprobacion";
import ContadorPendientesYSeleccionados from "./ContadorPendientesYSeleccionados";
import { ControlesSuperiores } from "./ControlesSuperiores";
import { ListaTraslados } from "./ListaTraslados";

type PanelPendientesProps = {
  filtroBodegaDestino: string;
  setFiltroBodegaDestino: (v: string) => void;
  filtroNombre: string;
  setFiltroNombre: (v: string) => void;
  filtrados: Traslado[];
  bodegasDestino: string[];
  isError?: boolean;
  loading: boolean;
  idsSeleccionados: number[];
  onToggleSeleccion: (id: number) => void;
  onToggleSeleccionarTodos: (seleccionar: boolean) => void;
  totalPendientes: number;
  onEliminarTrasladosAprobados?: (
    ids: number[],
    clave: string
  ) => Promise<void>;
  onRetry?: () => void; // ✅ YA EXISTE - no cambios
};

export const PanelPendientes: React.FC<PanelPendientesProps> = ({
  filtroBodegaDestino,
  setFiltroBodegaDestino,
  filtroNombre,
  setFiltroNombre,
  filtrados,
  bodegasDestino,
  loading,
  isError,
  idsSeleccionados,
  onToggleSeleccion,
  onToggleSeleccionarTodos,
  totalPendientes,
  onEliminarTrasladosAprobados,
  onRetry,
}) => {
  const [dialogoAprobacionAbierto, setDialogoAprobacionAbierto] =
    useState(false);
  const [modalCargando, setModalCargando] = useState(false);
  const [aprobado, setAprobado] = useState(false);
  const [errorAprobacion, setErrorAprobacion] = useState<string | null>(null);

  const todosSeleccionados =
    filtrados.length > 0 &&
    filtrados.every(
      (t) => t.traslado !== undefined && idsSeleccionados.includes(t.traslado)
    );

  const algunSeleccionado =
    filtrados.length > 0 &&
    filtrados.some(
      (t) => t.traslado !== undefined && idsSeleccionados.includes(t.traslado)
    );

  // ✅ Función que se ejecuta al confirmar en el modal (recibe la contraseña)
  const iniciarAprobacion = async (clave: string) => {
    setDialogoAprobacionAbierto(false); // Cerrar modal de confirmación
    setModalCargando(true); // Abrir modal de carga
    setAprobado(false);
    setErrorAprobacion(null);

    try {
      // ✅ Ejecutar la función del padre pasando los IDs y la CLAVE
      if (onEliminarTrasladosAprobados) {
        console.log("🔹 Aprobando traslados con clave:", {
          cantidad: idsSeleccionados.length,
          ids: idsSeleccionados,
        });

        // 🔥 LLAMADA A LA FUNCIÓN PADRE CON LA CLAVE
        await onEliminarTrasladosAprobados(idsSeleccionados, clave);
      }

      // ✅ Limpiar selección
      onToggleSeleccionarTodos(false);

      // Mostrar icono de éxito por 1.2s
      setAprobado(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } catch (error: any) {
      setErrorAprobacion(
        error?.message ||
          "Ocurrió un error al aprobar los traslados. Intenta nuevamente."
      );
      console.error("❌ Error al aprobar traslados:", error);
      await new Promise((resolve) => setTimeout(resolve, 2500));
    } finally {
      setModalCargando(false);
      setAprobado(false);
      setErrorAprobacion(null);
    }
  };

  return (
    <Paper
      elevation={10}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        border: "2px solid",
        boxShadow: "0 1px 5px 0 ",
        borderColor: "primary.dark",
        borderRadius: 3,
        p: { xs: 1, sm: 2 },
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Global
        styles={{
          "@keyframes pulse": {
            "0%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.15)", color: "#5eb0b6ff" },
            "100%": { transform: "scale(1)" },
          },
        }}
      />

      {/* ===== MODAL DE CARGA/PROCESAMIENTO ===== */}
      <Dialog
        open={modalCargando}
        disableEscapeKeyDown
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 0,
              background: "rgba(255,255,255,0.98)",
              boxShadow: "0 10px 40px 0 rgba(0,0,0,0.18)",
              minWidth: 340,
            },
          },
          backdrop: {
            sx: {
              background: "rgba(33, 150, 243, 0.18)",
              backdropFilter: "blur(2px)",
            },
          },
        }}
      >
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            py: 4,
            px: 3,
            gap: 2,
          }}
        >
          {errorAprobacion ? (
            <>
              <ErrorOutlineIcon
                sx={{
                  fontSize: 54,
                  color: "error.main",
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "error.main", mb: 1 }}
              >
                Error al aprobar
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", mb: 1 }}
              >
                {errorAprobacion}
              </Typography>
            </>
          ) : !aprobado ? (
            <>
              <AutorenewIcon
                sx={{
                  fontSize: 54,
                  color: "primary.main",
                  mb: 2,
                  animation: "spin 1.2s linear infinite",
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "primary.main",
                  letterSpacing: 0.5,
                }}
              >
                Procesando traslados...
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: "center" }}
              >
                Por favor espera unos segundos mientras procesamos tu solicitud.
              </Typography>
            </>
          ) : (
            <>
              <CheckCircleIcon
                sx={{
                  fontSize: 60,
                  color: "success.main",
                  mb: 1,
                  animation: "pop 0.5s",
                }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                ¡Traslados aprobados!
              </Typography>
            </>
          )}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pop {
              0% { transform: scale(0.7); opacity: 0; }
              80% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </DialogContent>
      </Dialog>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      {/* 🔄 CAMBIO 1: Ocultar controles si está cargando */}
      {!loading && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
              rowGap: 1,
              "@media (max-width: 700px)": {
                flexDirection: "column",
                alignItems: "flex-start",
              },
            }}
          >
            <ContadorPendientesYSeleccionados
              pendientes={totalPendientes - idsSeleccionados.length}
              seleccionados={idsSeleccionados.length}
            />

            <ControlesSuperiores
              idsSeleccionadosLength={idsSeleccionados.length}
              loading={loading}
              onToggleSeleccionarTodos={onToggleSeleccionarTodos}
              onAbrirDialogoAprobacion={() => setDialogoAprobacionAbierto(true)}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              mb: 1,
              gap: 2,
            }}
          >
            <PendientesFilters
              filtroBodegaDestino={filtroBodegaDestino}
              setFiltroBodegaDestino={setFiltroBodegaDestino}
              filtroNombre={filtroNombre}
              setFiltroNombre={setFiltroNombre}
              bodegasDestino={bodegasDestino}
              filtradosLength={filtrados.length}
              todosSeleccionados={todosSeleccionados}
              algunSeleccionado={algunSeleccionado}
              onToggleSeleccionarTodos={onToggleSeleccionarTodos}
            />

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                userSelect: "none",
                fontSize: "0.85rem",
                textAlign: "right",
                flexShrink: 0,
                mr: { xs: 0, sm: 2, md: 4 },
                ml: { xs: 0, sm: "auto" },
                maxWidth: { xs: "100%", sm: "45%" },
                "@media (max-width: 700px)": {
                  width: "100%",
                  textAlign: "center",
                  mt: 1,
                },
              }}
            >
              Visualiza, filtra y selecciona los traslados pendientes que deseas
              Aprobar.
            </Typography>
          </Box>

          <Divider sx={{ mb: 2, borderColor: "primary.main" }} />
        </>
      )}

      {/* ===== LISTA DE TRASLADOS ===== */}
      {/* 🔄 CAMBIO 2: Pasar props necesarios para skeletons */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        <ListaTraslados
          filtrados={filtrados}
          idsSeleccionados={idsSeleccionados}
          onToggleSeleccion={onToggleSeleccion}
          loading={loading} // ✅ Estado de carga
          isError={isError} // ✅ Estado de error
          totalPendientes={totalPendientes} // ✅ Total para diferenciar "sin datos" vs "sin coincidencias"
          onRetry={onRetry} // ✅ Función para reintentar
        />
      </Box>

      {/* ===== MODAL DE CONFIRMACIÓN (solicita contraseña) ===== */}
      <ConfirmacionAprobacion
        open={dialogoAprobacionAbierto}
        onClose={() => setDialogoAprobacionAbierto(false)}
        onConfirm={iniciarAprobacion}
        cantidadTraslados={idsSeleccionados.length}
      />
    </Paper>
  );
};
