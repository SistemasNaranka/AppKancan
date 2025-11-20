// Archivo: src/apps/traslados/pages/TrasladosPanel.tsx
import React, { useMemo, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { PanelPendientes } from "../components/PanelPendientes";
import { AccessValidationModal } from "../components/ValidarAccesso";
import { useAuth } from "@/auth/hooks/useAuth";
import { useAccessValidation } from "../hooks/useAccessValidation";
import type { Traslado } from "../hooks/types";
import { obtenerTraslados } from "../api/obtenerTraslados";
import { aprobarTraslados } from "../api/obtenerTraslados";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const TrasladosPanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const accessValidation = useAccessValidation(user);
  const navigate = useNavigate();
  const [filtroBodegaDestino, setFiltroBodegaDestino] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [idsSeleccionados, setIdsSeleccionados] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtroNombre, setFiltroNombre] = useState("");

  // ✅ Query para cargar traslados con cache automático
  const {
    data: pendientes = [],
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["traslados_pendientes", user?.codigo_ultra, user?.empresa],
    queryFn: async () => {
      const codigo = user?.codigo_ultra;
      const empresa = user?.empresa;

      if (!codigo || !empresa) {
        throw new Error("Usuario no autenticado o datos incompletos");
      }

      return await obtenerTraslados(codigo, empresa);
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled:
      !!user?.codigo_ultra && !!user?.empresa && accessValidation.isValid,
  });

  // ✅ Mostrar errores de la query
  React.useEffect(() => {
    if (isError && queryError) {
      setError(queryError.message || "Error al cargar traslados");
    }
  }, [isError, queryError]);

  // ✅ Obtener bodegas destino únicas
  const bodegasDestino = useMemo(() => {
    const bodegas = new Map<string, string>();
    pendientes.forEach((t) => {
      if (t.nombre_destino && !bodegas.has(t.nombre_destino)) {
        bodegas.set(
          t.nombre_destino,
          `${t.bodega_destino} - ${t.nombre_destino}`
        );
      }
    });
    return Array.from(bodegas.values()).sort();
  }, [pendientes]);

  // ✅ Filtrado por bodega destino y nombre
  const filtrados = useMemo(() => {
    return pendientes.filter((t) => {
      const coincideBodega =
        !filtroBodegaDestino ||
        filtroBodegaDestino === "" ||
        filtroBodegaDestino === "Todas las bodegas" ||
        filtroBodegaDestino.includes(t.nombre_destino) ||
        filtroBodegaDestino.includes(t.bodega_destino);

      const coincideNombre =
        !filtroNombre ||
        t.traslado?.toString().includes(filtroNombre) ||
        t.nombre_origen?.toLowerCase().includes(filtroNombre.toLowerCase()) ||
        t.nombre_destino?.toLowerCase().includes(filtroNombre.toLowerCase());

      return coincideBodega && coincideNombre;
    });
  }, [pendientes, filtroBodegaDestino, filtroNombre]);

  // ✅ Selección de traslados
  const handleToggleSeleccion = (id: number) => {
    setIdsSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ✅ Seleccionar/Deseleccionar todos
  const handleToggleSeleccionarTodos = (seleccionar: boolean) => {
    const idsFiltrados = filtrados.map((t) => t.traslado);
    if (seleccionar) {
      setIdsSeleccionados([...new Set([...idsSeleccionados, ...idsFiltrados])]);
    } else {
      setIdsSeleccionados((prev) =>
        prev.filter((id) => !idsFiltrados.includes(id))
      );
    }
  };

  // ✅ Función que ejecuta el hijo cuando aprueba traslados
  const handleEliminarTrasladosAprobados = async (
    ids: number[],
    clave: string
  ) => {
    try {
      if (!user?.empresa || !user?.codigo_ultra) {
        throw new Error("Faltan datos de usuario para aprobar traslados");
      }

      const trasladosSeleccionados = pendientes.filter((t) =>
        ids.includes(t.traslado)
      );

      if (trasladosSeleccionados.length === 0) {
        throw new Error("No se encontraron traslados para aprobar");
      }

      if (import.meta.env.DEV) {
        console.log(
          "Informacion enviada",
          trasladosSeleccionados,
          user.empresa,
          user.codigo_ultra,
          clave
        );
      }

      const resultado = await aprobarTraslados(
        trasladosSeleccionados,
        user.empresa,
        user.codigo_ultra,
        clave
      );

      // ✅ Actualizar el cache de TanStack Query
      queryClient.setQueryData<Traslado[]>(
        ["traslados_pendientes", user?.codigo_ultra, user?.empresa],
        (old = []) => old.filter((p) => !ids.includes(p.traslado))
      );

      setIdsSeleccionados([]);
      setSnackbarOpen(true);

      return resultado;
    } catch (err: any) {
      console.error("❌ Error al aprobar traslados:", err);
      setError(err.message || "Error al aprobar traslados");
      throw err;
    }
  };

  // 🔄 CAMBIO: Agregar función para reintentar la carga
  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["traslados_pendientes", user?.codigo_ultra, user?.empresa],
    });
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Modal de validación de acceso */}
      <AccessValidationModal
        open={!accessValidation.isValid}
        errorType={accessValidation.errorType}
        onHome={handleGoHome}
      />

      {/* Contenido principal */}
      {accessValidation.isValid && (
        <>
          <PanelPendientes
            totalPendientes={pendientes.length}
            filtroBodegaDestino={filtroBodegaDestino}
            setFiltroBodegaDestino={setFiltroBodegaDestino}
            filtroNombre={filtroNombre}
            setFiltroNombre={setFiltroNombre}
            filtrados={filtrados}
            bodegasDestino={bodegasDestino}
            loading={loading}
            isError={isError}
            idsSeleccionados={idsSeleccionados}
            onToggleSeleccion={handleToggleSeleccion}
            onToggleSeleccionarTodos={handleToggleSeleccionarTodos}
            onEliminarTrasladosAprobados={handleEliminarTrasladosAprobados}
            onRetry={handleRetry}
          />

          {/* Snackbar de éxito */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert severity="success" variant="filled">
              ¡Traslados aprobados con éxito!
            </Alert>
          </Snackbar>

          {/* Snackbar de error */}
          <Snackbar
            open={!!error}
            autoHideDuration={4000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert severity="error" variant="filled">
              {error}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default TrasladosPanel;
