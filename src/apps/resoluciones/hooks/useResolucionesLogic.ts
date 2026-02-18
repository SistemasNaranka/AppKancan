import { useState, useEffect } from "react";
import { Resolucion, EstadoResolucion } from "../types";
import { obtenerResoluciones } from "../api/read";
import { crearResolucion } from "../api/create";
import { aplanarResolucion, calcularVencimiento } from "../utils/calculos";
import { useResponsiveItems } from "./useResponsiveItems";

interface SnackbarState {
  open: boolean;
  mensaje: string;
  tipo: "success" | "error";
}

export const useResolucionesLogic = () => {
  // Estado para la búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Estado para el filtro RazonSocial
  const [filtroRazonSocial, setFiltroRazonSocial] = useState("Todas");

  // Estado para el filtro activo
  const [filtroEstado, setFiltroEstado] = useState<EstadoResolucion | null>(
    null,
  );

  // Estado para la resolución seleccionada
  const [resolucionSeleccionada, setResolucionSeleccionada] =
    useState<Resolucion | null>(null);

  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    mensaje: "",
    tipo: "success",
  });
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Configuración de paginación responsiva
  const itemsPorPagina = useResponsiveItems();

  // Estado de cargado
  const [, setCargando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargandoDatos(true);
        const datos = await obtenerResoluciones();
        const resolucionesAplanadas = datos.map(aplanarResolucion);
        setResoluciones(resolucionesAplanadas);
      } catch (error) {
        console.error("Error cargando resoluciones:", error);
        setSnackbar({
          open: true,
          mensaje: "Error al cargar resoluciones",
          tipo: "error",
        });
      } finally {
        setCargandoDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // Timer para cerrar automáticamente las alertas
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  // Función para ordenar por urgencia de estado
  const ordenarPorEstado = (registros: Resolucion[]) => {
    const ordenEstado: { [key: string]: number } = {
      Pendiente: 0,
      "Por vencer": 1,
      Vigente: 2,
      Vencido: 3,
    };
    return [...registros].sort(
      (a, b) => ordenEstado[a.estado] - ordenEstado[b.estado],
    );
  };

  const todasResoluciones = ordenarPorEstado([...resoluciones]);

  // Filtrar por búsqueda
  const resolucionesBuscadas = busqueda
    ? todasResoluciones.filter(
        (r) =>
          r.numero_formulario.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.tienda_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.prefijo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : todasResoluciones;

  // Calcular totales por estado
  const totalPendientes = todasResoluciones.filter(
    (r) => r.estado === "Pendiente",
  ).length;
  const totalPorVencer = todasResoluciones.filter(
    (r) => r.estado === "Por vencer",
  ).length;
  const totalVigentes = todasResoluciones.filter(
    (r) => r.estado === "Vigente",
  ).length;
  const totalVencidos = todasResoluciones.filter(
    (r) => r.estado === "Vencido",
  ).length;
  const totalResoluciones =
    totalPendientes + totalPorVencer + totalVigentes + totalVencidos;

  // Filtrar por razón social
  const resolucionesPorRazonSocial =
    filtroRazonSocial !== "Todas"
      ? resolucionesBuscadas.filter((r) => r.razon_social === filtroRazonSocial)
      : resolucionesBuscadas;

  // Filtrar por estado
  const resolucionesFiltradas = filtroEstado
    ? resolucionesPorRazonSocial.filter((r) => r.estado === filtroEstado)
    : resolucionesPorRazonSocial;

  // Configuración de paginación
  const totalPaginas = Math.ceil(resolucionesFiltradas.length / itemsPorPagina);

  // Obtener resoluciones de la página actual
  const resolucionesPaginadas = resolucionesFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina,
  );

  // Handlers
  const handleBusquedaChange = (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  const handleRazonSocialChange = (valor: string) => {
    setFiltroRazonSocial(valor);
    setPaginaActual(1);
  };

  const handleFiltrar = (estado: EstadoResolucion | null) => {
    setFiltroEstado(estado);
  };

  const handleSeleccionar = (resolucion: Resolucion) => {
    setResolucionSeleccionada(resolucion);
  };

  const handleLimpiar = () => {
    setResolucionSeleccionada(null);
  };

  const handleIntegrar = () => {
    if (!resolucionSeleccionada) return;

    const yaExiste = resoluciones.some(
      (r) => r.numero_formulario === resolucionSeleccionada.numero_formulario,
    );

    if (yaExiste) {
      setSnackbar({
        open: true,
        mensaje: "Esta resolución ya está integrada",
        tipo: "error",
      });
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarIntegracion = async () => {
    if (!resolucionSeleccionada) return;

    let empresa = "";
    if (resolucionSeleccionada.razon_social === "NARANKA SAS") {
      empresa = "naranka";
    } else if (
      resolucionSeleccionada.razon_social === "MARIA FERNANDA PEREZ VELEZ"
    ) {
      empresa = "kancan";
    } else if (resolucionSeleccionada.razon_social === "KAN CAN JEANS") {
      empresa = "kancanjeans";
    }

    // Formatear fecha: quitar guiones para enviar solo números
    const fechaSoloNumeros = resolucionSeleccionada.fecha_creacion.replace(
      /-/g,
      "",
    );

    // Parámetros en el orden correcto según actualizarResolucion.exe
    const params = [
      `caja:${resolucionSeleccionada.id_ultra || 0}`,
      `prefijo:${resolucionSeleccionada.prefijo}`,
      `resolucion:${resolucionSeleccionada.numero_formulario}`,
      `enteFacturador:${resolucionSeleccionada.ente_facturador?.toLowerCase()}`,
      `desde:${resolucionSeleccionada.desde_numero}`,
      `hasta:${resolucionSeleccionada.hasta_numero}`,
      `fecha:${fechaSoloNumeros}`,
      `vigencia:${resolucionSeleccionada.vigencia}`,
      `motivo:${resolucionSeleccionada.tipo_solicitud}`,
      `empresa:${empresa}`,
    ].join(" ");

    setMostrarConfirmacion(false);

    try {
      await crearResolucion({
        numero_formulario: resolucionSeleccionada.numero_formulario,
        razon_social: resolucionSeleccionada.razon_social,
        prefijo: resolucionSeleccionada.prefijo,
        desde_numero: resolucionSeleccionada.desde_numero,
        hasta_numero: resolucionSeleccionada.hasta_numero,
        vigencia: resolucionSeleccionada.vigencia,
        tipo_solicitud: resolucionSeleccionada.tipo_solicitud,
        fecha_creacion: resolucionSeleccionada.fecha_creacion,
        fecha_vencimiento: resolucionSeleccionada.fecha_vencimiento,
      });

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `empresa://?${params}`;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);

      const datos = await obtenerResoluciones();
      const resolucionesAplanadas = datos.map(aplanarResolucion);
      setResoluciones(resolucionesAplanadas);

      setResolucionSeleccionada(null);
      setSnackbar({
        open: true,
        mensaje: "Resolución integrada correctamente",
        tipo: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        mensaje: error.message || "Error al integrar",
        tipo: "error",
      });
    }
  };

  const handleSubirArchivo = async (
    archivo: File,
    leerPDF: (archivo: File) => Promise<any>,
  ) => {
    setCargando(true);

    const resultado = await leerPDF(archivo);

    if (typeof resultado === "string") {
      setSnackbar({ open: true, mensaje: resultado, tipo: "error" });
      setCargando(false);
      return;
    }

    const nuevaResolucion: Resolucion = {
      id: Date.now(),
      numero_formulario: resultado.numero_formulario,
      razon_social: resultado.razon_social,
      prefijo: resultado.prefijo,
      desde_numero: resultado.desde_numero,
      hasta_numero: resultado.hasta_numero,
      vigencia: resultado.vigencia,
      tipo_solicitud: resultado.tipo_solicitud,
      fecha_creacion: resultado.fecha_creacion,
      fecha_vencimiento: calcularVencimiento(
        resultado.fecha_creacion,
        resultado.vigencia,
      ),
      ultima_factura: 0,
      estado: "Pendiente",
      tienda_nombre: resultado.tienda_nombre,
      ente_facturador: "Principal",
      empresa: "",
    };

    setResolucionSeleccionada(nuevaResolucion);
    setCargando(false);
  };

  const cerrarSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    // Estados
    busqueda,
    filtroRazonSocial,
    filtroEstado,
    resolucionSeleccionada,
    paginaActual,
    snackbar,
    resoluciones,
    cargandoDatos,
    itemsPorPagina,
    mostrarConfirmacion,

    // Datos calculados
    totalResoluciones,
    totalPendientes,
    totalPorVencer,
    totalVigentes,
    totalVencidos,
    resolucionesFiltradas,
    totalPaginas,
    resolucionesPaginadas,

    // Handlers
    handleBusquedaChange,
    handleRazonSocialChange,
    handleFiltrar,
    handleSeleccionar,
    handleLimpiar,
    handleIntegrar,
    confirmarIntegracion,
    handleSubirArchivo,
    setPaginaActual,
    setMostrarConfirmacion,
    cerrarSnackbar,
  };
};
