import React, { useMemo, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { PanelPendientes } from "../components/PanelPendientes";
import { AccessValidationModal } from "../components/ValidarAccesso";
import { useAuth } from "@/auth/hooks/useAuth";
import { useAccessValidation } from "../hooks/useAccessValidation";
import type { Traslado } from "../hooks/types";
import { obtenerTraslados, obtenerTrasladosJefeZona } from "../api/obtenerTraslados";
import { aprobarTraslados } from "../api/obtenerTraslados";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { obtenerTiendasUsuarioActual } from "@/services/directus/userStores";

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
  const [ordenFecha, setOrdenFecha] = useState<"asc" | "desc">("desc");
  const hasSetDefaultBodega = React.useRef(false);

  const tienePoliticaTrasladosTiendas =
    user?.policies?.includes("store_transfers") ?? false;

  const tienePoliticaTrasladosJefezona =
    user?.policies?.includes("AreaManagerTransfers") ?? false;

  const tienePoliticaTiendaOGerente =
    tienePoliticaTrasladosTiendas || tienePoliticaTrasladosJefezona;

  // Obtener tiendas asignadas con sus empresas si el usuario es Jefe de Zona
  const { data: tiendasAcceso } = useQuery({
    queryKey: ["tiendas_usuario_actual_con_empresa", user?.id],
    queryFn: obtenerTiendasUsuarioActual,
    enabled: !!user && tienePoliticaTrasladosJefezona,
  });

  const {
    data: pendientesRaw = [],
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["traslados_pendientes", user?.ultra_code, user?.company, tienePoliticaTrasladosJefezona, tiendasAcceso],
    queryFn: async () => {
      const codigo = user?.ultra_code;
      const empresa = user?.company;

      if (!tienePoliticaTrasladosJefezona && (!empresa || !codigo)) {
        throw new Error("Usuario no autenticado o datos incompletos");
      }

      if (tienePoliticaTrasladosJefezona) {
        return await obtenerTrasladosJefeZona(
          String(codigo || ""),
          String(empresa || ""),
          tiendasAcceso || [],
        );
      }

      return await obtenerTraslados(
        String(codigo),
        String(empresa),
        tienePoliticaTrasladosTiendas,
      );
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled:
      accessValidation.isValid &&
      (tienePoliticaTrasladosJefezona || (!!user?.company && !!user?.ultra_code)) &&
      (!tienePoliticaTrasladosJefezona || tiendasAcceso !== undefined),
  });

  // Extraer los traslados del objeto envuelto si viene de n8n o similar
  const pendientes = useMemo(() => {
    if (Array.isArray(pendientesRaw) && pendientesRaw[0] && Array.isArray((pendientesRaw[0] as any).traslados)) {
      return (pendientesRaw[0] as any).traslados as Traslado[];
    }
    return pendientesRaw as Traslado[];
  }, [pendientesRaw]);

  React.useEffect(() => {
    if (isError && queryError) {
      setError(queryError.message || "Error al cargar traslados");
    }
  }, [isError, queryError]);

  const bodegasDestino = useMemo(() => {
    const bodegas = new Map<string, string>();
    const codigoUltra = user?.ultra_code?.toString();

    pendientes.forEach((t) => {
      if (t.nombre_destino) {
        const label = `${t.bodega_destino} - ${t.nombre_destino}`;
        if (!bodegas.has(label)) bodegas.set(label, label);
      }
      if (tienePoliticaTrasladosTiendas && t.nombre_origen) {
        const label = `${t.bodega_origen} - ${t.nombre_origen}`;
        if (!bodegas.has(label)) bodegas.set(label, label);
      }
    });

    return Array.from(bodegas.values())
      .filter((b) => !codigoUltra || !b.startsWith(`${codigoUltra} -`))
      .sort((a, b) => {
        const idA = parseInt(a.split(" - ")[0], 10) || 0;
        const idB = parseInt(b.split(" - ")[0], 10) || 0;
        return idA - idB;
      });
  }, [pendientes, tienePoliticaTrasladosTiendas, user?.ultra_code]);

  // Seleccionar la primera bodega por defecto si es Jefe de Zona y la lista de bodegas cargó
  React.useEffect(() => {
    if (tienePoliticaTrasladosJefezona && bodegasDestino.length > 0 && !hasSetDefaultBodega.current) {
      setFiltroBodegaDestino(bodegasDestino[0]);
      hasSetDefaultBodega.current = true;
    }
  }, [tienePoliticaTrasladosJefezona, bodegasDestino]);

  const filtrados = useMemo(() => {
    const codigoUltra = user?.ultra_code ?? "";

    const res = pendientes.filter((t) => {
      let coincideTipo = true;
      if (filtroTipo === "enviados") {
        coincideTipo = String(t.bodega_origen) === String(codigoUltra);
      } else if (filtroTipo === "recibidos") {
        coincideTipo = String(t.bodega_destino) === String(codigoUltra);
      }

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
      const coincideFecha =
        !filtroFecha || (t.fecha && t.fecha.startsWith(filtroFecha));

      return coincideTipo && coincideBodega && coincideNombre && coincideFecha;
    });

    return res.sort((a, b) => {
      const dateA = a.fecha || "";
      const dateB = b.fecha || "";
      if (ordenFecha === "asc") {
        return dateA.localeCompare(dateB);
      } else {
        return dateB.localeCompare(dateA);
      }
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
    ordenFecha,
  ]);

  const conteos = useMemo(() => {
    const codigoUltra = user?.ultra_code ?? "";
    const enviados = pendientes.filter(
      (t) => String(t.bodega_origen) === String(codigoUltra),
    );
    const recibidos = pendientes.filter(
      (t) => String(t.bodega_destino) === String(codigoUltra),
    );

    if (tienePoliticaTiendaOGerente) {
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
  }, [pendientes, user?.ultra_code, tienePoliticaTiendaOGerente]);

  const handleToggleSeleccion = (id: number) => {
    setIdsSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

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

      const resultado = await aprobarTraslados(
        trasladosSeleccionados,
        String(user.company),
        String(user.ultra_code),
        clave,
      );

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

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["traslados_pendientes", user?.ultra_code, user?.company],
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
            totalPendientes={
              (tienePoliticaTrasladosTiendas || tienePoliticaTrasladosJefezona)
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
            tienePoliticaTrasladosTiendas={tienePoliticaTrasladosTiendas || tienePoliticaTrasladosJefezona}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            ordenFecha={ordenFecha}
            setOrdenFecha={setOrdenFecha}
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
