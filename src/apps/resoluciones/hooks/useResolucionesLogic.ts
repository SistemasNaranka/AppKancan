import { useState, useEffect } from "react";
import { Resolution, StatusResolution } from "../types";
import { getResolutions, checkPrefixExists } from "../api/read";
import { createResolution } from "../api/create";
import { updateResolutionStatus } from "../api/update";
import { flattenResolution, calculateMaturity } from "../utils/calculos";
import { useResponsiveItems } from "./useResponsiveItems";

interface UseResolutionLogicOptions {
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "warning" | "info",
  ) => void;
}

export const useResolutionsLogic = ({
  showSnackbar,
}: UseResolutionLogicOptions) => {
  const [busqueda, setBusqueda] = useState("");
  const [filtroRazonSocial, setFiltroRazonSocial] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState<StatusResolution[]>([]);
  const [criterioOrden, setCriterioOrden] = useState<"fecha" | "facturas">("fecha");
  const [resolucionSeleccionada, setResolucionSeleccionada] =
    useState<Resolution | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [resoluciones, setResoluciones] = useState<Resolution[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [cargandoArchivo, setCargando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarDialogoYaIntegrada, setMostrarDialogoYaIntegrada] =
    useState(false);
  const [
    mostrarDialogoOpcionesIntegracion,
    setMostrarDialogoOpcionesIntegracion,
  ] = useState(false);
  const [prefijoInvalido, setPrefijoInvalido] = useState(false);
  const [
    mostrarDialogoPrefijoNoEncontrado,
    setMostrarDialogoPrefijoNoEncontrado,
  ] = useState(false);

  const itemsPorPagina = useResponsiveItems();

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargandoDatos(true);
        const datos = await getResolutions();
        const resolucionesAplanadas = datos.map(flattenResolution);
        setResoluciones(resolucionesAplanadas);
      } catch (error) {
        console.error("Error cargando resoluciones:", error);
        showSnackbar("Error al cargar resoluciones", "error");
      } finally {
        setCargandoDatos(false);
      }
    }
    cargarDatos();
  }, []);

  const ordenarResoluciones = (registros: Resolution[]) => {
    return [...registros].sort((a, b) => {
      if (criterioOrden === "fecha") {
        const dateA = a.fecha_vencimiento || "9999-12-31";
        const dateB = b.fecha_vencimiento || "9999-12-31";
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        const facturasA = a.facturas_restantes ?? Infinity;
        const facturasB = b.facturas_restantes ?? Infinity;
        return facturasA - facturasB;
      } else {
        const facturasA = a.facturas_restantes ?? Infinity;
        const facturasB = b.facturas_restantes ?? Infinity;
        if (facturasA !== facturasB) {
          return facturasA - facturasB;
        }
        const dateA = a.fecha_vencimiento || "9999-12-31";
        const dateB = b.fecha_vencimiento || "9999-12-31";
        return dateA.localeCompare(dateB);
      }
    });
  };

  const AllResolutions = ordenarResoluciones([...resoluciones]);

  const resolucionesBuscadas = busqueda
    ? AllResolutions.filter(
        (r) =>
          r.numero_formulario.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.tienda_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.prefijo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : AllResolutions;

  const totalPendientes = AllResolutions.filter(
    (r) => r.estado === "Pendiente",
  ).length;
  const totalPorVencer = AllResolutions.filter(
    (r) => r.estado === "Por vencer",
  ).length;
  const totalVigentes = AllResolutions.filter(
    (r) => r.estado === "Vigente",
  ).length;
  const totalVencidos = AllResolutions.filter(
    (r) => r.estado === "Vencido",
  ).length;
  const totalResoluciones =
    totalPendientes + totalPorVencer + totalVigentes + totalVencidos;

  const resolucionesPorRazonSocial =
    filtroRazonSocial !== "Todas"
      ? resolucionesBuscadas.filter((r) => r.razon_social === filtroRazonSocial)
      : resolucionesBuscadas;

  const resolucionesFiltradas = filtroEstado && filtroEstado.length > 0
    ? resolucionesPorRazonSocial.filter((r) => filtroEstado.includes(r.estado))
    : resolucionesPorRazonSocial;

  const totalPaginas = Math.ceil(resolucionesFiltradas.length / itemsPorPagina);

  const resolucionesPaginadas = resolucionesFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina,
  );

  const handleBusquedaChange = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  const handleRazonSocialChange = (valor: string) => {
    setFiltroRazonSocial(valor);
    setPaginaActual(1);
  };

  const handleFiltrar = (estados: StatusResolution[]) => {
    setFiltroEstado(estados);
    setPaginaActual(1);
  };

  const handleSeleccionar = (resolucion: Resolution) => {
    setResolucionSeleccionada(resolucion);
    setPrefijoInvalido(false);
  };

  const handleLimpiar = () => {
    setResolucionSeleccionada(null);
    setPrefijoInvalido(false);
  };

  const handleIntegrar = () => {
    if (!resolucionSeleccionada) return;

    const yaExiste = resoluciones.some(
      (r) => r.numero_formulario === resolucionSeleccionada.numero_formulario,
    );

    if (yaExiste) {
      setMostrarDialogoYaIntegrada(true);
      return;
    }

    if (prefijoInvalido) {
      setMostrarDialogoPrefijoNoEncontrado(true);
      return;
    }

    setMostrarDialogoOpcionesIntegracion(true);
  };

  const integrarSoloGuardar = async () => {
    if (!resolucionSeleccionada) return;

    setMostrarDialogoOpcionesIntegracion(false);

    try {
      await createResolution({
        form_number: resolucionSeleccionada.numero_formulario,
        business_name: resolucionSeleccionada.razon_social,
        prefix: resolucionSeleccionada.prefijo,
        start_number: resolucionSeleccionada.desde_numero,
        end_number: resolucionSeleccionada.hasta_numero,
        validity: resolucionSeleccionada.vigencia,
        request_type: resolucionSeleccionada.tipo_solicitud,
        creation_date: resolucionSeleccionada.fecha_creacion,
        expiration_date: resolucionSeleccionada.fecha_vencimiento,
        status: "Pendiente",
      });

      const datos = await getResolutions();
      const resolucionesAplanadas = datos.map(flattenResolution);
      setResoluciones(resolucionesAplanadas);

      setResolucionSeleccionada(null);
      showSnackbar("Resolución guardada correctamente", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Error al guardar", "error");
    }
  };

  const ejecutarUltra = (resolucion: Resolution) => {
    let empresa = "";
    if (resolucion.razon_social === "NARANKA SAS") {
      empresa = "naranka";
    } else if (resolucion.razon_social === "MARIA FERNANDA PEREZ VELEZ") {
      empresa = "kancan";
    } else if (resolucion.razon_social === "KAN CAN JEANS") {
      empresa = "kancanjeans";
    }

    const fechaSoloNumeros = resolucion.fecha_creacion.replace(/-/g, "");

    const params = [
      `caja:${resolucion.id_ultra ?? ""}`,
      `prefijo:${resolucion.prefijo}`,
      `resolucion:${resolucion.numero_formulario}`,
      `enteFacturador:${resolucion.ente_facturador?.toLowerCase()}`,
      `desde:${resolucion.desde_numero}`,
      `hasta:${resolucion.hasta_numero}`,
      `fecha:${fechaSoloNumeros}`,
      `vigencia:${resolucion.vigencia}`,
      `motivo:${resolucion.tipo_solicitud}`,
      `empresa:${empresa}`,
    ].join(" ");

    window.location.href = `ResolucionesUltra://?${encodeURIComponent(params)}`;
  };

  const integrarGuardarYSubirUltra = async () => {
    if (!resolucionSeleccionada) return;

    setMostrarDialogoOpcionesIntegracion(false);

    try {
      await createResolution({
        form_number: resolucionSeleccionada.numero_formulario,
        business_name: resolucionSeleccionada.razon_social,
        prefix: resolucionSeleccionada.prefijo,
        start_number: resolucionSeleccionada.desde_numero,
        end_number: resolucionSeleccionada.hasta_numero,
        validity: resolucionSeleccionada.vigencia,
        request_type: resolucionSeleccionada.tipo_solicitud,
        creation_date: resolucionSeleccionada.fecha_creacion,
        expiration_date: resolucionSeleccionada.fecha_vencimiento,
        status: "Activo",
      });

      ejecutarUltra(resolucionSeleccionada);

      const datos = await getResolutions();
      const resolucionesAplanadas = datos.map(flattenResolution);
      setResoluciones(resolucionesAplanadas);

      setResolucionSeleccionada(null);
      showSnackbar(
        "Resolución integrada y subida a Ultra correctamente",
        "success",
      );
    } catch (error: any) {
      showSnackbar(error.message || "Error al integrar", "error");
    }
  };

  const confirmarIntegracion = async () => {
    if (!resolucionSeleccionada) return;

    setMostrarConfirmacion(false);

    try {
      await createResolution({
        form_number: resolucionSeleccionada.numero_formulario,
        business_name: resolucionSeleccionada.razon_social,
        prefix: resolucionSeleccionada.prefijo,
        start_number: resolucionSeleccionada.desde_numero,
        end_number: resolucionSeleccionada.hasta_numero,
        validity: resolucionSeleccionada.vigencia,
        request_type: resolucionSeleccionada.tipo_solicitud,
        creation_date: resolucionSeleccionada.fecha_creacion,
        expiration_date: resolucionSeleccionada.fecha_vencimiento,
        status: "Activo",
      });

      ejecutarUltra(resolucionSeleccionada);

      const datos = await getResolutions();
      const resolucionesAplanadas = datos.map(flattenResolution);
      setResoluciones(resolucionesAplanadas);

      setResolucionSeleccionada(null);
      showSnackbar("Resolución integrada correctamente", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Error al integrar", "error");
    }
  };

  const handleSubirArchivo = async (
    archivo: File,
    leerPDF: (archivo: File) => Promise<any>,
  ) => {
    setCargando(true);

    const resultado = await leerPDF(archivo);

    if (typeof resultado === "string") {
      showSnackbar(resultado, "error");
      setCargando(false);
      return;
    }

    const prefixRes = await checkPrefixExists(resultado.prefijo, resultado.razon_social);
    setPrefijoInvalido(!prefixRes.exists);

    const nuevaResolucion: Resolution = {
      id: Date.now(),
      numero_formulario: resultado.numero_formulario,
      razon_social: resultado.razon_social,
      prefijo: resultado.prefijo,
      desde_numero: resultado.desde_numero,
      hasta_numero: resultado.hasta_numero,
      vigencia: resultado.vigencia,
      tipo_solicitud: resultado.tipo_solicitud,
      fecha_creacion: resultado.fecha_creacion,
      fecha_vencimiento: calculateMaturity(
        resultado.fecha_creacion,
        resultado.vigencia,
      ),
      ultima_factura: 0,
      estado: "Pendiente",
      tienda_nombre: resultado.tienda_nombre,
      ente_facturador: "Principal",
      empresa: "",
      id_ultra: prefixRes.ultra_id || undefined,
    };

    setResolucionSeleccionada(nuevaResolucion);
    setCargando(false);
  };

  const ejecutarAppUltra = () => {
    if (!resolucionSeleccionada) return;

    ejecutarUltra(resolucionSeleccionada);

    setMostrarDialogoYaIntegrada(false);
    showSnackbar("Aplicación Ultra ejecutada", "info");
  };

  const handleHabilitar = async () => {
    if (!resolucionSeleccionada) return;

    try {
      await updateResolutionStatus(resolucionSeleccionada.id, "Activo");
      
      const datos = await getResolutions();
      const resolucionesAplanadas = datos.map(flattenResolution);
      setResoluciones(resolucionesAplanadas);

      const actualizada = resolucionesAplanadas.find(
        (r) => r.id === resolucionSeleccionada.id,
      );
      if (actualizada) {
        setResolucionSeleccionada(actualizada);
      } else {
        setResolucionSeleccionada(null);
      }

      showSnackbar("Estado de la resolución actualizado a Vigente", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Error al actualizar estado", "error");
    }
  };

  return {
    busqueda,
    filtroRazonSocial,
    filtroEstado,
    criterioOrden,
    setCriterioOrden,
    resolucionSeleccionada,
    paginaActual,
    resoluciones,
    cargandoDatos,
    itemsPorPagina,
    mostrarConfirmacion,
    mostrarDialogoYaIntegrada,
    mostrarDialogoOpcionesIntegracion,
    totalResoluciones,
    totalPendientes,
    totalPorVencer,
    totalVigentes,
    totalVencidos,
    resolucionesFiltradas,
    totalPaginas,
    resolucionesPaginadas,
    handleBusquedaChange,
    handleRazonSocialChange,
    handleFiltrar,
        handleSeleccionar,
    handleLimpiar,
    handleIntegrar,
    confirmarIntegracion,
    ejecutarAppUltra,
    handleSubirArchivo,
    integrarSoloGuardar,
    integrarGuardarYSubirUltra,
    handleHabilitar,
    setPaginaActual,
    setMostrarConfirmacion,
    setMostrarDialogoYaIntegrada,
    setMostrarDialogoOpcionesIntegracion,
    cargandoArchivo,
    prefijoInvalido,
    mostrarDialogoPrefijoNoEncontrado,
    setMostrarDialogoPrefijoNoEncontrado,
  };
};
