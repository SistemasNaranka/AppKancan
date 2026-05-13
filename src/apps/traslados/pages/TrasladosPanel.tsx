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
  const [filtroTipo, setFiltroTipo] = useState<
    "todos" | "enviados" | "recibidos"
  >("todos");
  const [filtroFecha, setFiltroFecha] = useState<string | null>(null);

  // ✅ Verificar si el usuario tiene la política TrasladosTiendas
  const tienePoliticaTrasladosTiendas =
    user?.policies?.includes("StoreTransfers") ?? false;

  // ✅ Query para cargar traslados con cache automático
  const {
    data: pendientes = [],
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["traslados_pendientes", user?.ultra_code, user?.company],
    queryFn: async () => {
      const codigo = user?.ultra_code;
      const empresa = user?.company;

      if (!codigo || !empresa) {
        throw new Error("Usuario no autenticado o datos incompletos");
      }

      // ✅ Usar URL diferente si el usuario tiene política de tienda
      return await obtenerTraslados(
        String(codigo),
        String(empresa),
        tienePoliticaTrasladosTiendas,
      );
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled:
      !!user?.ultra_code && !!user?.company && accessValidation.isValid,
  });

  // ✅ Mostrar errores de la query
  React.useEffect(() => {
    if (isError && queryError) {
      setError(queryError.message || "Error al cargar traslados");
    }
  }, [isError, queryError]);

  // ✅ Obtener bodegas destino únicas (incluye orígenes si es tienda para filtrar por remitente)
  const bodegasDestino = useMemo(() => {
    const bodegas = new Map<string, string>();
    const codigoUltra = user?.ultra_code?.toString();

    pendientes.forEach((t) => {
      // Agregar destino si existe
      if (t.nombre_destino) {
        const label = `${t.bodega_destino} - ${t.nombre_destino}`;
        if (!bodegas.has(label)) bodegas.set(label, label);
      }
      // Si es usuario tienda, también agregar el origen para poder filtrar "quién me envía"
      if (tienePoliticaTrasladosTiendas && t.nombre_origen) {
        const label = `${t.bodega_origen} - ${t.nombre_origen}`;
        if (!bodegas.has(label)) bodegas.set(label, label);
      }
    });

    // Filtramos para no mostrar la propia bodega del usuario en la lista (evita confusión)
    return Array.from(bodegas.values())
      .filter((b) => !codigoUltra || !b.startsWith(`${codigoUltra} -`))
      .sort();
  }, [pendientes, tienePoliticaTrasladosTiendas, user?.ultra_code]);

  // ✅ Filtrado por tipo (enviados/recibidos), bodega destino, nombre y fecha
  const filtrados = useMemo(() => {
    const codigoUltra = user?.ultra_code ?? "";

    return pendientes.filter((t) => {
      // ✅ Filtrar por tipo: enviados (bodega_origen == codigo_ultra) o recibidos (bodega_destino == codigo_ultra)
      let coincideTipo = true;
      if (filtroTipo === "enviados") {
        coincideTipo = String(t.bodega_origen) === String(codigoUltra);
      } else if (filtroTipo === "recibidos") {
        coincideTipo = String(t.bodega_destino) === String(codigoUltra);
      }

      // ✅ Filtrar por Bodega (Destino u Origen según el caso en vista tienda)
      const labelDestino = `${t.bodega_destino} - ${t.nombre_destino}`;
      const labelOrigen = `${t.bodega_origen} - ${t.nombre_origen}`;

      const coincideBodega =
        !filtroBodegaDestino ||
        filtroBodegaDestino === "" ||
        filtroBodegaDestino === "Todas las bodegas" ||
        filtroBodegaDestino === labelDestino ||
        (tienePoliticaTrasladosTiendas && filtroBodegaDestino === labelOrigen);

      const coincideNombre =
        !filtroNombre ||
        t.traslado?.toString().includes(filtroNombre) ||
        t.nombre_origen?.toLowerCase().includes(filtroNombre.toLowerCase()) ||
        t.nombre_destino?.toLowerCase().includes(filtroNombre.toLowerCase());
      // ✅ Filtrar por fecha (comparar solo YYYY-MM-DD)
      const coincideFecha =
        !filtroFecha || (t.fecha && t.fecha.startsWith(filtroFecha));

      return coincideTipo && coincideBodega && coincideNombre && coincideFecha;
    });
  }, [
    pendientes,
    filtroBodegaDestino,
    filtroNombre,
    filtroTipo,
    filtroFecha,
    user?.ultra_code,
    user?.policies,
    tienePoliticaTrasladosTiendas,
  ]);

  // ✅ Obtener conteos de enviados y recibidos
  const conteos = useMemo(() => {
    const codigoUltra = user?.ultra_code ?? "";
    const enviados = pendientes.filter(
      (t) => String(t.bodega_origen) === String(codigoUltra),
    );
    const recibidos = pendientes.filter(
      (t) => String(t.bodega_destino) === String(codigoUltra),
    );

    if (tienePoliticaTrasladosTiendas) {
      const uniqueEnviados = new Set(enviados.map((t) => t.traslado)).size;
      const uniqueRecibidos = new Set(recibidos.map((t) => t.traslado)).size;
      const uniqueTotal = new Set(pendientes.map((t) => t.traslado)).size;

      return {
        total: uniqueTotal,
        enviados: uniqueEnviados,
        recibidos: uniqueRecibidos,
      };
    }

    return {
      total: pendientes.length,
      enviados: enviados.length,
      recibidos: recibidos.length,
    };
  }, [pendientes, user?.ultra_code, tienePoliticaTrasladosTiendas]);

  // ✅ Selección de traslados
  const handleToggleSeleccion = (id: number) => {
    setIdsSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // ✅ Seleccionar/Deseleccionar todos
  const handleToggleSeleccionarTodos = (seleccionar: boolean) => {
    const idsFiltrados = filtrados.map((t) => t.traslado);
    if (seleccionar) {
      setIdsSeleccionados([...new Set([...idsSeleccionados, ...idsFiltrados])]);
    } else {
      setIdsSeleccionados((prev) =>
        prev.filter((id) => !idsFiltrados.includes(id)),
      );
    }
  };

  // ✅ Función que ejecuta el hijo cuando aprueba traslados
  const handleEliminarTrasladosAprobados = async (
    ids: number[],
    clave: string,
  ) => {
    try {
      if (!user?.company || !user?.ultra_code) {
        throw new Error("Faltan datos de usuario para aprobar traslados");
      }

      const trasladosSeleccionados = pendientes.filter((t) =>
        ids.includes(t.traslado),
      );

      if (trasladosSeleccionados.length === 0) {
        throw new Error("No se encontraron traslados para aprobar");
      }

      if (import.meta.env.DEV) {
        console.log(
          "Informacion enviada",
          trasladosSeleccionados,
          user.company,
          user.ultra_code,
          clave,
        );
      }

      const resultado = await aprobarTraslados(
        trasladosSeleccionados,
        String(user.company),
        String(user.ultra_code),
        clave,
      );

      // ✅ Actualizar el cache de TanStack Query
      queryClient.setQueryData<Traslado[]>(
        ["traslados_pendientes", user?.ultra_code, user?.company],
        (old = []) => old.filter((p) => !ids.includes(p.traslado)),
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
      queryKey: ["traslados_pendientes", user?.ultra_code, user?.company],
    });
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // ✅ Verificar si el usuario tiene la política que impide aprobar traslados
  const tienePoliticaTrasladosJefezona =
    user?.policies?.includes("AreaManagerTransfers") ?? false;

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
            totalPendientes={
              tienePoliticaTrasladosTiendas
                ? new Set(pendientes.map((t) => t.traslado)).size
                : pendientes.length
            }
            filtroBodegaDestino={filtroBodegaDestino}
            setFiltroBodegaDestino={setFiltroBodegaDestino}
            filtroNombre={filtroNombre}
            setFiltroNombre={setFiltroNombre}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            filtroFecha={filtroFecha}
            setFiltroFecha={setFiltroFecha}
            conteos={conteos}
            filtrados={filtrados}
            bodegasDestino={bodegasDestino}
            loading={loading}
            isError={isError}
            idsSeleccionados={idsSeleccionados}
            onToggleSeleccion={handleToggleSeleccion}
            onToggleSeleccionarTodos={handleToggleSeleccionarTodos}
            onEliminarTrasladosAprobados={handleEliminarTrasladosAprobados}
            onRetry={handleRetry}
            tienePoliticaTrasladosJefezona={tienePoliticaTrasladosJefezona}
            tienePoliticaTrasladosTiendas={tienePoliticaTrasladosTiendas}
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
