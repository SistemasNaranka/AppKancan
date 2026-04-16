import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { useCurvasPolicies } from "../hooks/useCurvasPolicies";
import { useAuth } from "@/auth/hooks/useAuth";
import type {
  UserRole,
  RolePermissions,
  DatosCurvas,
  MatrizGeneralCurvas,
  DetalleProducto,
  ArchivoSubido,
  EstadoCarga,
  CeldaEditada,
  EnvioTienda,
  ArticuloEscaneado,
  ComparacionEnvio,
  ReporteDiscrepancias,
  FilaMatrizGeneral,
  FilaDetalleProducto,
  BloqueoEscaner,
} from "../types";

// Importar permisos
import { PERMISSIONS as DEFAULT_PERMISSIONS } from "../types";

// Importar procesador de Excel
import {
  procesarMatrizGeneral as procesarExcelMatriz,
  procesarDetalleProducto as procesarExcelDetalle,
} from "../utils/excelProcessor";

// Importar API de Directus
import {
  saveMatrizGeneral,
  saveDetalleProducto,
  saveHistorialCarga,
  saveBatchCurvas,
  saveLogCurvas,
  saveLogsBatch,
  saveEnvioCurva,
  saveEnviosBatch,
  deleteEnvioDrafts,
  deleteLogCurvasByRef,
} from "../api/directus/create";
import { getLogCurvas, getTiendas } from "../api/directus/read";
import {
  obtenerBloqueosActivos,
  intentarBloquearTienda,
  liberarTodosLosBloqueosDeUsuario,
  liberarTienda,
} from "../api/directus/bloqueos";

/**
 * Contexto para el módulo de curvas
 */
interface CurvasContextType {
  // Estado de usuario y permisos
  userRole: UserRole;
  permissions: RolePermissions;
  setUserRole: (role: UserRole) => void;

  // Estado de datos
  datosCurvas: DatosCurvas | null;
  archivos: ArchivoSubido[];

  // Estado de edición
  celdasEditadas: CeldaEditada[];
  hasChanges: boolean;

  // Estado de envíos
  envios: EnvioTienda[];
  articulosEscaneados: ArticuloEscaneado[];

  // Acciones de carga
  procesarArchivo: (file: File, tipo: ArchivoSubido["tipo"]) => Promise<void>;
  cargarDatosManuales: (
    data: MatrizGeneralCurvas | DetalleProducto,
    tipo: ArchivoSubido["tipo"],
  ) => void;
  limpiarDatos: () => void;
  cargarDatosGuardados: (fecha?: string) => Promise<void>;

  // Acciones de edición (solo Admin)
  editarCelda: (
    sheetId: string,
    filaId: string,
    columna: string,
    valorNuevo: number | string,
  ) => void;
  cambiarTalla: (
    sheetId: string,
    tallaActual: string,
    tallaNueva: string,
  ) => void;
  guardarCambios: (
    datosLog?: {
      tiendaId: string;
      tiendaNombre: string;
      plantilla: "matriz_general" | "productos";
      cantidadTalla: { talla: number; cantidad: number }[];
      referencia?: string;
      estado?: "borrador" | "confirmado";
    }[],
  ) => Promise<boolean>;
  guardarLogCurvas: (data: {
    tiendaId: string;
    tiendaNombre: string;
    plantilla: "matriz_general" | "productos";
    cantidadTalla: { talla: number; cantidad: number }[];
    referencia?: string;
    estado?: "borrador" | "confirmado";
  }) => Promise<boolean>;
  confirmarLote: (
    tipo: "general" | "producto_a" | "producto_b",
    sheetId: string,
  ) => Promise<boolean>;
  confirmarLoteConDatos: (
    tipo: "general" | "producto_a" | "producto_b",
    sheetId: string,
    sheetData?: MatrizGeneralCurvas | DetalleProducto | null,
  ) => Promise<boolean>;
  descartarCambios: () => void;
  setHasChanges: (val: boolean) => void;

  // Acciones de validación (Despacho)
  actualizarValorValidacion: (
    sheetId: string,
    filaId: string,
    columna: string,
    valor: number,
    codigoBarra?: string | null,
  ) => void;

  limpiarValidacion: (sheetId?: string) => void;
  guardarEnvioDespacho: (
    sheetId: string,
    overrideData?: Record<string, Record<string, any>>,
    overridePlantilla?: "matriz_general" | "productos",
    overrideRef?: string,
  ) => Promise<{ success: boolean; logIds?: string[] }>;
  validationData: Record<
    string,
    Record<
      string,
      Record<string, number | { cantidad: number; barcodes: string[] }>
    >
  >;
  setValidationData: Dispatch<
    SetStateAction<
      Record<
        string,
        Record<
          string,
          Record<string, number | { cantidad: number; barcodes: string[] }>
        >
      >
    >
  >;

  // Concurrencia (Bloqueos)
  bloqueosActivos: BloqueoEscaner[];
  intentarBloquear: (tienda_id: string, referencia: string) => Promise<boolean>;
  desmarcarTienda: (tienda_id: string, referencia: string) => Promise<void>;
  saveEnviosBatch: (enviosData: any[]) => Promise<boolean>;

  // Acciones de envío (Bodega)
  agregarArticuloEscaneado: (
    articulo: Omit<ArticuloEscaneado, "id" | "fechaEscaneo">,
  ) => void;
  crearEnvio: (tiendaId: string) => EnvioTienda | null;
  actualizarEstadoEnvio: (
    envioId: string,
    estado: EnvioTienda["estado"],
  ) => void;

  // Acciones de comparación
  generarComparacion: (envioId: string) => ComparacionEnvio[];
  generarReporteDiscrepancias: (envioId: string) => ReporteDiscrepancias | null;

  // Mecanismo de refresco global
  refreshLogs: () => void;
  lastLogsUpdate: number;

  // Notificaciones de cambios
  notificacionCambios: {
    open: boolean;
    mensaje: string;
    ubicacion: string;
    timestamp: number;
  } | null;
  setNotificacionCambios: (
    val: {
      open: boolean;
      mensaje: string;
      ubicacion: string;
      timestamp: number;
    } | null,
  ) => void;

  // Tiendas
  tiendasDict: Record<string, string>;

  // Helpers
  extractRef: (sheet: any) => string;

  // Filtrado por fecha desde BD
  cargarDatosPorFecha: (fecha?: string) => Promise<void>;

  // Reutilizar lote de fecha anterior (crea nuevo registro con fecha actual)
  reutilizarLote: (sheetId: string) => Promise<boolean>;
}

const CurvasContext = createContext<CurvasContextType | undefined>(undefined);

/**
 * Provider del contexto de curvas
 */
export const CurvasProvider = ({ children }: { children: ReactNode }) => {
  const { userRole } = useCurvasPolicies();
  const { user } = useAuth();

  // Estado de usuario derived del sistema de auth
  const [permissions, setPermissions] = useState<RolePermissions>(
    DEFAULT_PERMISSIONS.admin,
  );

  // Actualizar permisos cuando cambia el rol
  useEffect(() => {
    // Asegurar que userRole sea una de las claves esperadas
    // Si el rol contiene 'admin', 'gerente' o 'director', lo tratamos como admin de curvas
    const lowerRole = (userRole || "").toLowerCase();
    const isActuallyAdmin =
      lowerRole.includes("admin") ||
      lowerRole.includes("gerente") ||
      lowerRole.includes("director");

    const validRole: UserRole = isActuallyAdmin
      ? "admin"
      : lowerRole.includes("bodega")
        ? "bodega"
        : "produccion";

    setPermissions(DEFAULT_PERMISSIONS[validRole]);
    setInternalRole(validRole);
  }, [userRole]);

  const setUserRole = useCallback((_role: UserRole) => {}, []);

  // Estado de datos
  const [datosCurvas, setDatosCurvas] = useState<DatosCurvas | null>(null);
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [internalRole, setInternalRole] = useState<UserRole>("produccion");

  // Estado de edición
  const [celdasEditadas, setCeldasEditadas] = useState<CeldaEditada[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  // Notificaciones de cambios para bodega
  const [notificacionCambios, setNotificacionCambios] = useState<{
    open: boolean;
    mensaje: string;
    ubicacion: string;
    timestamp: number;
  } | null>(null);

  // Estado de concurrencia (bloqueos)
  const [bloqueosActivos, setBloqueosActivos] = useState<BloqueoEscaner[]>([]);

  // Efecto para polling de bloqueos
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchLocks = async () => {
      try {
        const locks = await obtenerBloqueosActivos();
        if (isMounted) setBloqueosActivos(locks);
      } catch (e) {
        // ignore
      }
    };

    fetchLocks();
    const interval = setInterval(fetchLocks, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      // Liberar mis bloqueos al desmontar el contexto
      liberarTodosLosBloqueosDeUsuario(user.id);
    };
  }, [user]);

  const intentarBloquear = useCallback(
    async (tienda_id: string, referencia: string) => {
      if (!user) return false;
      const success = await intentarBloquearTienda(
        referencia,
        tienda_id,
        user.id,
      );
      if (success) {
        const locks = await obtenerBloqueosActivos();
        setBloqueosActivos(locks);
      }
      return success;
    },
    [user],
  );

  const desmarcarTienda = useCallback(
    async (tienda_id: string, referencia: string) => {
      if (!user) return;
      await liberarTienda(referencia, tienda_id, user.id);
      const locks = await obtenerBloqueosActivos();
      setBloqueosActivos(locks);
    },
    [user],
  );

  // Estado de envíos
  const [envios, setEnvios] = useState<EnvioTienda[]>([]);
  const [articulosEscaneados, setArticulosEscaneados] = useState<
    ArticuloEscaneado[]
  >([]);
  const [lastLogsUpdate, setLastLogsUpdate] = useState<number>(Date.now());
  const [tiendasDict, setTiendasDict] = useState<Record<string, string>>({});

  // Tipo para datos de validación: acepta números (retrocompatibilidad) o objetos con cantidad y barcodes
  type ValidationCellValue = number | { cantidad: number; barcodes: string[] };
  const [validationData, setValidationData] = useState<
    Record<string, Record<string, Record<string, ValidationCellValue>>>
  >({}); // { sheetId: { filaId: { col: valor } } }
  const refreshLogs = useCallback(() => {
    setLastLogsUpdate(Date.now());
  }, []);

  // Cargar diccionario de tiendas al montar
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const tiendas = await getTiendas();
        const dict: Record<string, string> = {};
        tiendas.forEach((t) => {
          dict[t.id] = t.nombre;
        });
        setTiendasDict(dict);
      } catch (err) {
        console.error("Error fetching stores in CurvasContext:", err);
      }
    };
    fetchStores();
  }, []);

  // ============================================
  // ACCIONES DE CARGA
  // ============================================

  const procesarArchivo = useCallback(
    async (file: File, tipo: ArchivoSubido["tipo"]) => {
      // Crear entrada de archivo
      const archivoId = Date.now().toString();
      const nuevoArchivo: ArchivoSubido = {
        id: archivoId,
        nombre: file.name,
        tipo,
        estado: "cargando",
        progreso: 10,
        errores: [],
        fechaSubida: new Date(),
      };

      setArchivos((prev) => {
        // Si ya existe un archivo de este tipo, reemplazarlo
        const existe = prev.find((a) => a.tipo === tipo);
        if (existe) {
          return prev.map((a) => (a.tipo === tipo ? nuevoArchivo : a));
        }
        return [...prev, nuevoArchivo];
      });

      try {
        // Actualizar progreso
        setArchivos((prev) =>
          prev.map((a) =>
            a.id === archivoId
              ? { ...a, estado: "procesando" as EstadoCarga, progreso: 50 }
              : a,
          ),
        );

        // Procesar según el tipo usando el procesador de Excel real (Retorna ARRAYS de hojas)
        let datosProcesados:
          | MatrizGeneralCurvas[]
          | DetalleProducto[]
          | undefined;

        if (tipo === "matriz_general") {
          datosProcesados = await procesarExcelMatriz(file);
        } else {
          datosProcesados = await procesarExcelDetalle(file, tipo);
        }

        // Actualizar archivo como exitoso
        setArchivos((prev) =>
          prev.map((a) =>
            a.id === archivoId
              ? {
                  ...a,
                  estado: "exito" as EstadoCarga,
                  progreso: 100,
                  datos: datosProcesados,
                }
              : a,
          ),
        );

        // Actualizar datos generales
        setDatosCurvas((prev) => {
          const nuevosDatos: DatosCurvas = prev || {
            matrizGeneral: [],
            productos: [],
            fechaCarga: new Date(),
          };

          if (tipo === "matriz_general" && datosProcesados) {
            return {
              ...nuevosDatos,
              matrizGeneral: datosProcesados as MatrizGeneralCurvas[],
              fechaCarga: new Date(),
            };
          } else if (
            (tipo === "detalle_producto_a" || tipo === "detalle_producto_b") &&
            datosProcesados
          ) {
            return {
              ...nuevosDatos,
              productos: [
                ...nuevosDatos.productos,
                ...(datosProcesados as DetalleProducto[]),
              ],
              fechaCarga: new Date(),
            };
          }

          return nuevosDatos;
        });
      } catch (error) {
        console.error("Error procesando archivo:", error);
        setArchivos((prev) =>
          prev.map((a) =>
            a.id === archivoId
              ? {
                  ...a,
                  estado: "error" as EstadoCarga,
                  errores: [
                    {
                      fila: 0,
                      columna: "general",
                      valor: file.name,
                      mensaje:
                        error instanceof Error
                          ? error.message
                          : "Error desconocido",
                      severidad: "error" as const,
                    },
                  ],
                }
              : a,
          ),
        );
      }
    },
    [],
  );

  const cargarDatosManuales = useCallback(
    (
      data: MatrizGeneralCurvas | DetalleProducto,
      tipo: ArchivoSubido["tipo"],
    ) => {
      const archivoId = `manual - ${Date.now()} `;
      const nuevoArchivo: ArchivoSubido = {
        id: archivoId,
        nombre: `Ingreso Manual - ${data.nombreHoja} `,
        tipo,
        estado: "exito",
        progreso: 100,
        errores: [],
        fechaSubida: new Date(),
        datos: [data] as any,
      };

      setArchivos((prev) => {
        const existe = prev.find((a) => a.tipo === tipo);
        if (existe) {
          return prev.map((a) => (a.tipo === tipo ? nuevoArchivo : a));
        }
        return [...prev, nuevoArchivo];
      });

      setDatosCurvas((prev) => {
        const nuevosDatos: DatosCurvas = prev || {
          matrizGeneral: [],
          productos: [],
          fechaCarga: new Date(),
        };

        if (tipo === "matriz_general") {
          const id = data.id || `manual-${Date.now()}`;
          const existingIndex = nuevosDatos.matrizGeneral.findIndex(
            (m) => m.id === id,
          );
          const updatedList = [...nuevosDatos.matrizGeneral];
          if (existingIndex >= 0) {
            updatedList[existingIndex] = { ...data, id } as MatrizGeneralCurvas;
          } else {
            updatedList.push({ ...data, id } as MatrizGeneralCurvas);
          }
          return {
            ...nuevosDatos,
            matrizGeneral: updatedList,
            fechaCarga: new Date(),
          };
        } else {
          const id = data.id || `manual-${Date.now()}`;
          const existingIndex = nuevosDatos.productos.findIndex(
            (p) => p.id === id,
          );
          const updatedList = [...nuevosDatos.productos];
          if (existingIndex >= 0) {
            updatedList[existingIndex] = { ...data, id } as DetalleProducto;
          } else {
            updatedList.push({ ...data, id } as DetalleProducto);
          }
          return {
            ...nuevosDatos,
            productos: updatedList,
            fechaCarga: new Date(),
          };
        }
      });

      setHasChanges(true);
    },
    [],
  );

  const limpiarDatos = useCallback(() => {
    setArchivos([]);
    setDatosCurvas(null);
    setCeldasEditadas([]);
    setHasChanges(false);
    setArticulosEscaneados([]);
    setEnvios([]);
    setValidationData({}); // Clear validation data on full data clear
  }, []);

  // ============================================
  // HIDRATACIÓN DESDE BASE DE DATOS
  // ============================================
  const cargarDatosGuardados = useCallback(
    async (fechaOverride?: string) => {
      try {
        const fecha = fechaOverride || currentDate;
        const logs = await getLogCurvas(fecha || undefined);

        const emptyState: DatosCurvas = {
          matrizGeneral: [],
          productos: [],
          fechaCarga: new Date(),
        };

        if (!logs || logs.length === 0) {
          setDatosCurvas(emptyState);
          return;
        }

        // Agrupar logs por (referencia + plantilla)
        const groups: Record<
          string,
          {
            referencia: string;
            normalizedRef: string;
            plantilla: "matriz_general" | "productos";
            logs: any[];
            lastUpdate: number;
          }
        > = {};

        logs.forEach((log) => {
          const rawRef = log.referencia || "SIN REF";

          // NORMALIZACIÓN: Eliminar prefijos y partes de color para la llave de agrupación
          let normalizedRef = rawRef.replace(/^REF:\s*/i, "").trim();
          if (normalizedRef.includes(" | ")) {
            normalizedRef = normalizedRef.split(" | ")[0].trim();
          }
          normalizedRef = normalizedRef.toUpperCase();

          const groupKey = `${log.plantilla}|${normalizedRef}`;

          if (!groups[groupKey]) {
            groups[groupKey] = {
              referencia: rawRef, // Guardamos la referencia original (el primer log dicta el nombre inicial)
              normalizedRef: normalizedRef,
              plantilla: log.plantilla,
              logs: [],
              lastUpdate: 0,
            };
          }

          // Actualizar el nombre de la referencia si el log actual es más reciente y tiene color
          const logTime = new Date(log.fecha).getTime();
          if (logTime > (groups[groupKey] as any).lastUpdate) {
            (groups[groupKey] as any).lastUpdate = logTime;
            // Si el log más reciente tiene color, lo preferimos para el nombre mostrado
            if (
              rawRef.includes("|") ||
              !groups[groupKey].referencia.includes("|")
            ) {
              groups[groupKey].referencia = rawRef;
            }
          }

          // DEDUPLICACIÓN: Solo agregar el log más reciente para cada tienda_id
          const logExistente = groups[groupKey].logs.find(
            (l) => l.tienda_id === log.tienda_id,
          );
          if (!logExistente) {
            groups[groupKey].logs.push(log);
          }
        });

        const matrizGeneral: MatrizGeneralCurvas[] = [];
        const productos: DetalleProducto[] = [];

        // Reconstruir cada grupo como una hoja (sheet)
        Object.values(groups).forEach((group) => {
          const allColumns = new Set<string>();
          const filas: any[] = [];

          group.logs.forEach((log) => {
            let cantidadTalla: any[] = [];
            try {
              cantidadTalla =
                typeof log.cantidad_talla === "string"
                  ? JSON.parse(log.cantidad_talla)
                  : log.cantidad_talla;
            } catch (e) {
              console.error(
                "Error parseando cantidad_talla en log:",
                log.id,
                e,
              );
            }

            if (!Array.isArray(cantidadTalla)) return;

            const rowData: Record<string, any> = {};
            let rowTotal = 0;

            cantidadTalla.forEach((ct) => {
              const col = String(ct.talla || ct.numero || "");
              if (!col) return;
              allColumns.add(col);
              rowData[col] = {
                valor: ct.cantidad,
                esCero: ct.cantidad === 0,
                esMayorQueCero: ct.cantidad > 0,
                id: `${log.tienda_id}-${col}`,
              };
              rowTotal += ct.cantidad;
            });

            // Crear la fila para el modelo de datos
            const fila = {
              id: `${String(log.tienda_id)}-${group.normalizedRef}`,
              tienda: {
                id: log.tienda_id,
                nombre:
                  tiendasDict[log.tienda_id] ||
                  log.tienda_nombre ||
                  "Tienda " + log.tienda_id,
                codigo: "",
              },
              [group.plantilla === "matriz_general" ? "curvas" : "tallas"]:
                rowData,
              total: rowTotal,
            };
            filas.push(fila);
          });

          // Ordenar filas alfabéticamente por nombre de tienda para evitar desorden al actualizar
          filas.sort((a, b) =>
            (a.tienda.nombre || "").localeCompare(b.tienda.nombre || ""),
          );

          const sortedColumns = Array.from(allColumns).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });

          // Totales por columna
          const colTotals: Record<string, number> = {};
          sortedColumns.forEach((col) => {
            colTotals[col] = filas.reduce((sum, f) => {
              const data =
                group.plantilla === "matriz_general" ? f.curvas : f.tallas;
              return sum + (data[col]?.valor || 0);
            }, 0);
          });

          const totalGeneral = Object.values(colTotals).reduce(
            (a, b) => a + b,
            0,
          );

          if (group.plantilla === "matriz_general") {
            matrizGeneral.push({
              id: String(group.normalizedRef || group.referencia),
              nombreHoja: group.referencia,
              referencia: group.referencia,
              filas: filas as FilaMatrizGeneral[],
              curvas: sortedColumns,
              totalesPorCurva: colTotals,
              totalGeneral,
              estado: group.logs[0]?.estado || "borrador", // Usar el estado real del primer log del grupo
            });
          } else {
            productos.push({
              id: String(group.normalizedRef || group.referencia),
              nombreHoja: group.referencia,
              metadatos: {
                referencia: group.referencia.includes("|")
                  ? group.referencia.split("|")[0].trim()
                  : group.referencia,
                imagen: "",
                color: group.referencia.includes("|")
                  ? group.referencia.split("|")[1].trim()
                  : "",
                proveedor: group.logs[0]?.proveedor || "RECUPERADO",
                precio: group.logs[0]?.precio || 0,
                linea:
                  group.plantilla === "productos"
                    ? group.referencia.includes("|")
                      ? "CALZADO"
                      : "PRODUCIDO"
                    : "GENERAL",
              },
              filas: filas as FilaDetalleProducto[],
              tallas: sortedColumns,
              totalesPorTalla: colTotals,
              totalGeneral,
              estado: group.logs[0]?.estado || "borrador",
            });
          }
        });

        setDatosCurvas((prev) => {
          const nuevosDatos: DatosCurvas = {
            matrizGeneral: [...matrizGeneral],
            productos: [...productos],
            fechaCarga: new Date(),
            // datosValidacion: prev?.datosValidacion // Preservar estado de validación (escaneos) - REMOVED
          };

          if (!prev) return nuevosDatos;

          // MERGE LOGIC: Preservar hojas que están en memoria pero NO en la base de datos
          // (Son archivos Excel subidos recientemente que no han sido guardados)

          // 1. Matriz General
          prev.matrizGeneral.forEach((oldSheet) => {
            const oldRef = extractRef(oldSheet).toUpperCase();
            const existsInDB = matrizGeneral.some(
              (dbSheet) => extractRef(dbSheet).toUpperCase() === oldRef,
            );

            if (!existsInDB && oldRef !== "SIN REF") {
              nuevosDatos.matrizGeneral.push(oldSheet);
            }
          });

          // 2. Productos
          prev.productos.forEach((oldSheet) => {
            const oldRef = extractRef(oldSheet).toUpperCase();
            const existsInDB = productos.some(
              (dbSheet) => extractRef(dbSheet).toUpperCase() === oldRef,
            );

            if (!existsInDB && oldRef !== "SIN REF") {
              nuevosDatos.productos.push(oldSheet);
            }
          });

          // Ordenar para mantener consistencia visual
          nuevosDatos.matrizGeneral.sort((a, b) =>
            extractRef(a).localeCompare(extractRef(b)),
          );
          nuevosDatos.productos.sort((a, b) =>
            extractRef(a).localeCompare(extractRef(b)),
          );

          return nuevosDatos;
        });
      } catch (error) {
        console.error("Error en hidratación de Dashboard:", error);
      }
    },
    [tiendasDict],
  );

  // Efecto para hidratación inicial y ante cambios en logs o catálogo de tiendas
  // Solo se ejecuta si hay una fecha válida (no null)
  useEffect(() => {
    if (!currentDate) return;
    cargarDatosGuardados(currentDate);
  }, [cargarDatosGuardados, lastLogsUpdate, currentDate]);

  // ============================================
  // ACCIONES DE EDICIÓN (SOLO ADMIN)
  // ============================================

  // Helper robusto para extraer referencia (disponible para todos los hooks)
  const extractRef = useCallback((sheet: any) => {
    if (!sheet) return "SIN REF";

    // Lista de candidatos en orden de prioridad
    const candidates = [
      sheet.referenciaBase, // Prioridad 1: Entrada manual directa
      sheet.referencia, // Prioridad 2: Raíz del objeto
      sheet.nombreHoja, // Prioridad 3: Nombre de hoja Excel
      sheet.metadatos?.referencia, // Prioridad 4: Metadatos (productos)
      sheet.id, // Prioridad 5: ID técnico
      sheet.metadatos?.nombreHoja,
      sheet.filas?.[0]?.referencia,
      sheet.filas?.[0]?.metadatos?.referencia,
    ];

    // Función de limpieza profunda
    const clean = (val: any) => {
      if (!val || typeof val !== "string") return "";
      let result = val.trim();
      // Remover prefijos comunes de forma insensible a mayúsculas/minúsculas y repetitiva
      while (
        result.toLowerCase().startsWith("ref:") ||
        result.toLowerCase().startsWith("hoja:") ||
        result.toLowerCase().startsWith("ingreso manual -") ||
        result.toLowerCase().startsWith("manual -") ||
        result.toLowerCase().startsWith("sheet-")
      ) {
        result = result
          .replace(/^REF:\s*/i, "")
          .replace(/^Hoja:\s*/i, "")
          .replace(/^Ingreso\s*Manual\s*-\s*/i, "")
          .replace(/^Manual\s*-\s*/i, "")
          .replace(/^sheet-\s*/i, "")
          .trim();
      }
      return result;
    };

    // Buscar el primer candidato válido que no sea una cadena vacía o "SIN REF"
    const valid = candidates
      .map(clean)
      .find(
        (c) =>
          c !== "" &&
          c.toUpperCase() !== "SIN REF" &&
          c.toUpperCase() !== "NULL" &&
          c.toUpperCase() !== "NUEVA",
      );

    if (valid) return valid;

    // Fallback: Si el ID es algo útil que no sea basura técnica
    if (sheet.id && typeof sheet.id === "string") {
      const fromId = clean(sheet.id);
      if (
        fromId &&
        fromId.toUpperCase() !== "NUEVA" &&
        fromId.toUpperCase() !== "SIN REF"
      ) {
        return fromId;
      }
    }

    // Último recurso: Devolver el primer candidato no vacío aunque sea cuestionable
    const desperateFallback = candidates
      .map((c) => (typeof c === "string" ? c.trim() : ""))
      .find(
        (c) => c !== "" && !c.includes("Manual -") && !c.startsWith("sheet-"),
      );

    return desperateFallback || "SIN REF";
  }, []);

  const editarCelda = useCallback(
    (
      sheetId: string,
      filaId: string,
      columna: string,
      valorNuevo: number | string,
    ) => {
      if (!permissions.canEdit) return;

      setDatosCurvas((prev) => {
        if (!prev) return prev;

        // Buscar si la hoja está en matrizGeneral o productos
        const isGeneral = prev.matrizGeneral.some((s) => s.id === sheetId);

        if (isGeneral) {
          const updatedData = prev.matrizGeneral.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;

            const nuevasFilas = sheet.filas.map((fila) => {
              if (fila.id !== filaId) return fila;

              const nuevasCurvas = { ...fila.curvas };
              if (typeof valorNuevo === "number") {
                nuevasCurvas[columna] = {
                  ...(nuevasCurvas[columna] || {
                    valor: 0,
                    id: `${filaId}-${columna}`,
                  }),
                  valor: valorNuevo,
                  esCero: valorNuevo === 0,
                  esMayorQueCero: valorNuevo > 0,
                };
              }
              const nuevoTotal = Object.values(nuevasCurvas).reduce(
                (sum, c) => sum + c.valor,
                0,
              );
              return { ...fila, curvas: nuevasCurvas, total: nuevoTotal };
            });

            // Recalcular totales por curva para el footer
            const nuevosTotalesPorCurva = { ...sheet.totalesPorCurva };
            sheet.curvas.forEach((c) => {
              nuevosTotalesPorCurva[c] = nuevasFilas.reduce(
                (sum, f) => sum + (f.curvas[c]?.valor || 0),
                0,
              );
            });

            return {
              ...sheet,
              filas: nuevasFilas,
              totalesPorCurva: nuevosTotalesPorCurva,
              totalGeneral: nuevasFilas.reduce((acc, f) => acc + f.total, 0),
            };
          });
          return { ...prev, matrizGeneral: updatedData };
        } else {
          const updatedData = prev.productos.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;

            if (columna === "marca" && typeof valorNuevo === "string") {
              return {
                ...sheet,
                metadatos: { ...sheet.metadatos, marca: valorNuevo },
              };
            }

            const nuevasFilas = sheet.filas.map((fila) => {
              if (fila.id !== filaId) return fila;

              const nuevasTallas = { ...fila.tallas };
              if (typeof valorNuevo === "number") {
                nuevasTallas[columna] = {
                  ...(nuevasTallas[columna] || {
                    valor: 0,
                    id: `${filaId}-${columna}`,
                  }),
                  valor: valorNuevo,
                  esCero: valorNuevo === 0,
                  esMayorQueCero: valorNuevo > 0,
                };
              }
              const nuevoTotal = Object.values(nuevasTallas).reduce(
                (sum, c) => sum + c.valor,
                0,
              );
              return { ...fila, tallas: nuevasTallas, total: nuevoTotal };
            });

            // Recalcular totales por talla para el footer
            const nuevosTotalesPorTalla = { ...sheet.totalesPorTalla };
            sheet.tallas.forEach((t) => {
              nuevosTotalesPorTalla[t] = nuevasFilas.reduce(
                (sum, f) => sum + (f.tallas[t]?.valor || 0),
                0,
              );
            });

            return {
              ...sheet,
              filas: nuevasFilas,
              totalesPorTalla: nuevosTotalesPorTalla,
              totalGeneral: nuevasFilas.reduce((acc, f) => acc + f.total, 0),
            };
          });
          return { ...prev, productos: updatedData };
        }

        return prev;
      });

      const nuevaEdicion: CeldaEditada = {
        sheetId,
        filaId,
        columna,
        valorAnterior: 0,
        valorNuevo: typeof valorNuevo === "number" ? valorNuevo : 0,
        fechaEdicion: new Date(),
        usuarioEdicion: userRole as string,
      };

      setCeldasEditadas((prev) => [...prev, nuevaEdicion]);
      setHasChanges(true);
    },
    [permissions.canEdit, userRole, datosCurvas],
  );

  const cambiarTalla = useCallback(
    (
      sheetId: string,
      tallaActual: string,
      tallaNueva: string,
    ) => {
      if (!permissions.canEdit || !tallaNueva.trim()) return;

      setDatosCurvas((prev) => {
        if (!prev) return prev;

        const isGeneral = prev.matrizGeneral.some((s) => s.id === sheetId);
        const tallaNuevaPadded = tallaNueva.padStart(2, '0');

        if (isGeneral) {
          const updatedData = prev.matrizGeneral.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;

            // Verificar si la nueva talla ya existe
            if (sheet.curvas.includes(tallaNuevaPadded)) {
              return sheet; // Ya existe, no cambiar
            }

            // Actualizar array de curvas
            const nuevasCurvas = sheet.curvas.map(c =>
              c === tallaActual ? tallaNuevaPadded : c
            );

            // Actualizar filas
            const nuevasFilas = sheet.filas.map((fila) => {
              const nuevasCurvasFila = { ...fila.curvas };
              if (nuevasCurvasFila[tallaActual]) {
                nuevasCurvasFila[tallaNuevaPadded] = nuevasCurvasFila[tallaActual];
                delete nuevasCurvasFila[tallaActual];
              }
              return { ...fila, curvas: nuevasCurvasFila };
            });

            // Recalcular totales por curva
            const nuevosTotalesPorCurva = { ...sheet.totalesPorCurva };
            delete nuevosTotalesPorCurva[tallaActual];
            nuevosTotalesPorCurva[tallaNuevaPadded] = nuevasFilas.reduce(
              (sum, f) => sum + (f.curvas[tallaNuevaPadded]?.valor || 0),
              0,
            );

            return {
              ...sheet,
              curvas: nuevasCurvas,
              filas: nuevasFilas,
              totalesPorCurva: nuevosTotalesPorCurva,
            };
          });
          return { ...prev, matrizGeneral: updatedData };
        } else {
          const updatedData = prev.productos.map((sheet) => {
            if (sheet.id !== sheetId) return sheet;

            // Verificar si la nueva talla ya existe
            if (sheet.tallas.includes(tallaNuevaPadded)) {
              return sheet; // Ya existe, no cambiar
            }

            // Actualizar array de tallas
            const nuevasTallas = sheet.tallas.map(t =>
              t === tallaActual ? tallaNuevaPadded : t
            );

            // Actualizar filas
            const nuevasFilas = sheet.filas.map((fila) => {
              const nuevasTallasFila = { ...fila.tallas };
              if (nuevasTallasFila[tallaActual]) {
                nuevasTallasFila[tallaNuevaPadded] = nuevasTallasFila[tallaActual];
                delete nuevasTallasFila[tallaActual];
              }
              return { ...fila, tallas: nuevasTallasFila };
            });

            return {
              ...sheet,
              tallas: nuevasTallas,
              filas: nuevasFilas,
            };
          });
          return { ...prev, productos: updatedData };
        }
      });
    },
    [permissions.canEdit],
  );

  const guardarCambios = useCallback(
    async (
      datosLog?: {
        tiendaId: string;
        tiendaNombre: string;
        plantilla: "matriz_general" | "productos";
        cantidadTalla: { talla: number; cantidad: number }[];
        referencia?: string;
        estado?: "borrador" | "confirmado";
      }[],
    ): Promise<boolean> => {
      // 1. Determinar qué logs guardar (explícitos o detectados de celdasEditadas)
      let logsToSave: any[] = [];
      const fechaActual = new Date().toISOString();

      if (datosLog && datosLog.length > 0) {
        // Uso de logs explícitos (vía parámetros)
        logsToSave = datosLog.map((log) => ({
          tienda_id: log.tiendaId,
          tienda_nombre: log.tiendaNombre,
          plantilla: log.plantilla,
          fecha: fechaActual,
          cantidad_talla: JSON.stringify(log.cantidadTalla),
          referencia: log.referencia || "SIN REF",
          estado: log.estado || "borrador",
        }));
      } else if (celdasEditadas.length > 0 && datosCurvas) {
        // Detección automática de cambios manuales en el DataGrid

        const affectedSheets = new Set(celdasEditadas.map((e) => e.sheetId));

        affectedSheets.forEach((sheetId) => {
          // Encontrar la hoja en matrizGeneral o productos
          const sheet =
            datosCurvas.matrizGeneral.find((s) => s.id === sheetId) ||
            datosCurvas.productos.find((s) => s.id === sheetId);

          if (!sheet) return;

          const isMatriz = "curvas" in sheet;
          const dataKey = isMatriz ? "curvas" : "tallas";
          const cols = isMatriz ? (sheet as any).curvas : (sheet as any).tallas;
          const plantilla = isMatriz ? "matriz_general" : "productos";
          const refFinal = extractRef(sheet);

          // Identificar qué filas fueron tocadas en esta hoja
          const affectedFilaIds = new Set(
            celdasEditadas
              .filter((e) => e.sheetId === sheetId)
              .map((e) => e.filaId),
          );

          affectedFilaIds.forEach((filaId) => {
            const fila = sheet.filas.find((f) => f.id === filaId);
            if (!fila) return;

            const cantidadTalla: { talla: number; cantidad: number }[] = [];
            const datosFila = (fila as any)[dataKey] || {};

            cols.forEach((c: string) => {
              const celda = datosFila[c];
              if (celda && celda.valor > 0) {
                cantidadTalla.push({
                  talla: parseFloat(c),
                  cantidad: celda.valor,
                });
              }
            });

            if (cantidadTalla.length > 0) {
              logsToSave.push({
                tienda_id: fila.tienda.id,
                tienda_nombre: fila.tienda.nombre,
                plantilla,
                fecha: fechaActual,
                cantidad_talla: JSON.stringify(cantidadTalla),
                referencia: refFinal,
                estado: (sheet as any).estado || "borrador",
              });
            }
          });
        });
      }

      try {
        if (logsToSave.length > 0) {
          const logIds = await saveLogsBatch(logsToSave);
          if (logIds.length === 0) throw new Error("Error en saveLogsBatch");
        }

        // Pequeña espera para asegurar sincronización visual si es necesario
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Notificar a bodega sobre los cambios guardados (solo si es admin/gerente)
        const isActuallyAdmin =
          userRole.toLowerCase().includes("admin") ||
          userRole.toLowerCase().includes("gerente") ||
          userRole.toLowerCase().includes("director");

        if (isActuallyAdmin && datosLog && datosLog.length > 0) {
          // Agrupar cambios por tienda para notificar
          const tiendasAgrupadas = datosLog.reduce(
            (acc, log) => {
              if (!acc[log.tiendaNombre]) {
                acc[log.tiendaNombre] = [];
              }
              log.cantidadTalla.forEach((ct) => {
                acc[log.tiendaNombre].push(`${ct.talla}(${ct.cantidad})`);
              });
              return acc;
            },
            {} as Record<string, string[]>,
          );

          const tiendasLista = Object.entries(tiendasAgrupadas)
            .map(([tienda, cambios]) => `${tienda}: ${cambios.join(", ")}`)
            .join(" | ");

          setNotificacionCambios({
            open: true,
            mensaje: `El administrador ha guardado cambios en ${datosLog[0]?.referencia || "el lote"}`,
            ubicacion: tiendasLista,
            timestamp: Date.now(),
          });
        }

        setHasChanges(false);
        setCeldasEditadas([]);
        refreshLogs();
        return true;
      } catch (error) {
        console.error("Error crítico al guardar cambios en Context:", error);
        return false;
      }
    },
    [refreshLogs, userRole, extractRef, celdasEditadas, datosCurvas],
  );

  const confirmarLote = useCallback(
    async (
      tipo: "general" | "producto_a" | "producto_b",
      sheetId: string,
    ): Promise<boolean> => {
      if (!datosCurvas) {
        console.error("No hay datosCurvas cargados para confirmar");
        return false;
      }

      // Verificar si ya está confirmado
      const isAlreadyConfirmed = (
        tipo === "general" ? datosCurvas.matrizGeneral : datosCurvas.productos
      ).some((s: any) => s.id === sheetId && s.estado === "confirmado");

      if (isAlreadyConfirmed) {
        console.warn("⚠️ [confirmarLote] El lote ya está confirmado:", sheetId);
        return true;
      }

      try {
        let sheetToPersist: any = null;
        // Limpiar sheetId de prefijos como "sheet-" y buscar coincidencias parciales
        const cleanSheetId = String(sheetId)
          .replace(/^sheet-/, "")
          .trim();

        // Función helper para buscar una hoja con múltiples estrategias de matching
        const findSheet = (sheets: any[]) => {
          // Estrategia 1: Match exacto por ID
          let found = sheets.find((s) => s.id === sheetId);
          if (found) return found;

          // Estrategia 2: Match por ID limpio (sin prefijo sheet-)
          found = sheets.find((s) => s.id === cleanSheetId);
          if (found) return found;

          // Estrategia 3: Match por conversión a string
          found = sheets.find((s) => String(s.id) === cleanSheetId);
          if (found) return found;

          // Estrategia 4: Match parcial - el ID de la hoja contiene el cleanSheetId
          found = sheets.find((s) => String(s.id).includes(cleanSheetId));
          if (found) return found;

          // Estrategia 5: Match parcial - cleanSheetId contiene el ID de la hoja
          found = sheets.find((s) => cleanSheetId.includes(String(s.id)));
          if (found) return found;

          // Estrategia 6: Match por referencia exacta
          found = sheets.find((s) => s.referencia === sheetId);
          if (found) return found;

          // Estrategia 7: Match por referencia limpia
          found = sheets.find((s) => s.referencia === cleanSheetId);
          if (found) return found;

          // Estrategia 8: Match por referenciaBase
          found = sheets.find(
            (s) =>
              s.referenciaBase === sheetId || s.referenciaBase === cleanSheetId,
          );
          if (found) return found;

          // Estrategia 9: Match parcial por referencia (contiene)
          found = sheets.find(
            (s) =>
              (s.referencia && String(s.referencia).includes(cleanSheetId)) ||
              (s.referenciaBase &&
                String(s.referenciaBase).includes(cleanSheetId)),
          );
          if (found) return found;

          // Estrategia 10: Match por nombreHoja
          found = sheets.find(
            (s) =>
              (s.nombreHoja && s.nombreHoja === sheetId) ||
              (s.nombreHoja && s.nombreHoja === cleanSheetId) ||
              (s.nombreHoja && String(s.nombreHoja).includes(cleanSheetId)),
          );
          if (found) return found;

          return null;
        };

        if (tipo === "general") {
          sheetToPersist = findSheet(datosCurvas.matrizGeneral);
          // Si no se encuentra, tomar el primero disponible como fallback
          if (!sheetToPersist && datosCurvas.matrizGeneral.length > 0) {
            sheetToPersist = datosCurvas.matrizGeneral[0];
          }
        } else {
          sheetToPersist = findSheet(datosCurvas.productos);
          if (!sheetToPersist && datosCurvas.productos.length > 0) {
            sheetToPersist = datosCurvas.productos[0];
          }
        }

        if (!sheetToPersist) {
          console.error("No se encontró la hoja para confirmar:", sheetId);
          console.error("IDs disponibles:", {
            matrizGeneral: datosCurvas.matrizGeneral.map((s: any) => ({
              id: s.id,
              ref: s.referencia,
            })),
            productos: datosCurvas.productos.map((s: any) => ({
              id: s.id,
              ref: s.referencia,
            })),
          });
          return false;
        }

        const isMatriz = tipo === "general";
        const dataKey = isMatriz ? "curvas" : "tallas";
        const columnas = sheetToPersist[dataKey] || [];
        const plantilla = isMatriz ? "matriz_general" : "productos";

        const baseRef = extractRef(sheetToPersist);
        let ref = typeof baseRef === "string" ? baseRef.trim() : "SIN REF";

        // Recuperar color de metadatos o referencia
        let color = sheetToPersist.metadatos?.color || "—";
        if (ref.includes(" | ")) {
          const parts = ref.split(" | ");
          ref = parts[0].trim();
          if (color === "—" || !color) color = parts[1].trim();
        }
        const refFinal =
          color !== "—" && !ref.includes("|") ? `${ref} | ${color}` : ref;

        const logsBatch: any[] = [];
        const fechaActual = new Date().toISOString();

        // Preparar cada tienda para el registro en log_curvas
        for (const fila of sheetToPersist.filas) {
          if (!fila.tienda || !fila.tienda.id || fila.id === "row-total-final")
            continue;

          const cantidadTalla: { talla: number; cantidad: number }[] = [];
          const datosFila = fila[dataKey] || {};

          columnas.forEach((col: string) => {
            const celda = datosFila[col];
            if (celda && celda.valor > 0) {
              cantidadTalla.push({
                talla: parseFloat(col),
                cantidad: celda.valor,
              });
            }
          });

          if (cantidadTalla.length > 0) {
            logsBatch.push({
              tienda_id: fila.tienda.id,
              tienda_nombre: fila.tienda?.nombre || "",
              plantilla,
              fecha: fechaActual,
              cantidad_talla: JSON.stringify(cantidadTalla),
              referencia: refFinal || "SIN REF",
              estado: "confirmado",
            });
          }
        }

        if (logsBatch.length > 0) {
          const logIds = await saveLogsBatch(logsBatch);
          if (logIds.length === 0)
            throw new Error("Error al guardar el lote confirmado");
        }

        // Actualizar estado en memoria SOLO si la persistencia fue exitosa
        setDatosCurvas((prev) => {
          if (!prev) return prev;
          if (tipo === "general") {
            const matrizGeneral = prev.matrizGeneral.map((s) =>
              s.id === sheetId ? { ...s, estado: "confirmado" as const } : s,
            );
            return { ...prev, matrizGeneral };
          } else {
            const updated = prev.productos.map((s) =>
              s.id === sheetId ? { ...s, estado: "confirmado" as const } : s,
            );
            return { ...prev, productos: updated };
          }
        });

        refreshLogs();

        return true;
      } catch (error) {
        console.error("Error persistiendo lote confirmado:", error);
        return false;
      }
    },
    [datosCurvas, refreshLogs, extractRef],
  );

  // NUEVA FUNCIÓN: Confirmar lote con datos pasados directamente (no depende del estado)
  const confirmarLoteConDatos = useCallback(
    async (
      tipo: "general" | "producto_a" | "producto_b",
      sheetId: string,
      sheetDataOverride?: MatrizGeneralCurvas | DetalleProducto | null,
    ): Promise<boolean> => {
      try {
        // Usar sheetDataOverride si está disponible, si no buscar en datosCurvas
        let sheetToPersist: any = sheetDataOverride || null;

        if (!sheetToPersist && datosCurvas) {
          const cleanSheetId = String(sheetId)
            .replace(/^sheet-/, "")
            .trim();

          const findSheet = (sheets: any[]) => {
            let found = sheets.find((s) => s.id === sheetId);
            if (found) return found;
            found = sheets.find((s) => s.id === cleanSheetId);
            if (found) return found;
            found = sheets.find((s) => String(s.id) === cleanSheetId);
            if (found) return found;
            found = sheets.find((s) => String(s.id).includes(cleanSheetId));
            if (found) return found;
            found = sheets.find((s) => cleanSheetId.includes(String(s.id)));
            if (found) return found;
            found = sheets.find((s) => s.referencia === sheetId);
            if (found) return found;
            found = sheets.find((s) => s.referencia === cleanSheetId);
            if (found) return found;
            found = sheets.find(
              (s) =>
                s.referenciaBase === sheetId ||
                s.referenciaBase === cleanSheetId,
            );
            if (found) return found;
            found = sheets.find(
              (s) =>
                (s.referencia && String(s.referencia).includes(cleanSheetId)) ||
                (s.referenciaBase &&
                  String(s.referenciaBase).includes(cleanSheetId)),
            );
            if (found) return found;
            return null;
          };

          if (tipo === "general") {
            sheetToPersist = findSheet(datosCurvas.matrizGeneral);
            if (!sheetToPersist && datosCurvas.matrizGeneral.length > 0) {
              sheetToPersist = datosCurvas.matrizGeneral[0];
            }
          } else {
            sheetToPersist = findSheet(datosCurvas.productos);
            if (!sheetToPersist && datosCurvas.productos.length > 0) {
              sheetToPersist = datosCurvas.productos[0];
            }
          }
        }

        if (!sheetToPersist) {
          console.error("No se encontró la hoja para confirmar:", sheetId);
          return false;
        }

        const isMatriz = tipo === "general";
        const dataKey = isMatriz ? "curvas" : "tallas";
        const columnas = sheetToPersist[dataKey] || [];
        const plantilla = isMatriz ? "matriz_general" : "productos";

        const baseRef = extractRef(sheetToPersist);
        let ref = typeof baseRef === "string" ? baseRef.trim() : "SIN REF";

        let color = sheetToPersist.metadatos?.color || "—";
        if (ref.includes(" | ")) {
          const parts = ref.split(" | ");
          ref = parts[0].trim();
          if (color === "—" || !color) color = parts[1].trim();
        }
        const refFinal =
          color !== "—" && !ref.includes("|") ? `${ref} | ${color}` : ref;

        const logsBatch: any[] = [];
        const fechaActual = new Date().toISOString();

        for (const fila of sheetToPersist.filas) {
          if (!fila.tienda || !fila.tienda.id || fila.id === "row-total-final")
            continue;

          const cantidadTalla: { talla: number; cantidad: number }[] = [];
          const datosFila = fila[dataKey] || {};

          columnas.forEach((col: string) => {
            const celda = datosFila[col];
            if (celda && celda.valor > 0) {
              cantidadTalla.push({
                talla: parseFloat(col),
                cantidad: celda.valor,
              });
            }
          });

          if (cantidadTalla.length > 0) {
            logsBatch.push({
              tienda_id: fila.tienda.id,
              tienda_nombre: fila.tienda?.nombre || "",
              plantilla,
              fecha: fechaActual,
              cantidad_talla: JSON.stringify(cantidadTalla),
              referencia: refFinal || "SIN REF",
              estado: "confirmado",
            });
          }
        }

        if (logsBatch.length > 0) {
          const logIds = await saveLogsBatch(logsBatch);
          if (logIds.length === 0)
            throw new Error("Error al guardar el lote confirmado");
        }

        // Actualizar estado en memoria si es posible
        setDatosCurvas((prev) => {
          if (!prev) return prev;
          if (tipo === "general") {
            const matrizGeneral = prev.matrizGeneral.map((s) =>
              s.id === sheetId || s.id === sheetToPersist.id
                ? { ...s, estado: "confirmado" as const }
                : s,
            );
            return { ...prev, matrizGeneral };
          } else {
            const updated = prev.productos.map((s) =>
              s.id === sheetId || s.id === sheetToPersist.id
                ? { ...s, estado: "confirmado" as const }
                : s,
            );
            return { ...prev, productos: updated };
          }
        });

        refreshLogs();

        return true;
      } catch (error) {
        console.error("Error persistiendo lote confirmado:", error);
        return false;
      }
    },
    [datosCurvas, refreshLogs, extractRef],
  );

  const descartarCambios = useCallback(() => {
    setCeldasEditadas([]);
    setHasChanges(false);
    cargarDatosGuardados();
  }, [cargarDatosGuardados]);

  // ============================================
  // CARGAR DATOS POR FECHA ESPECÍFICA (para Dashboard)
  // ============================================
  const cargarDatosPorFecha = useCallback(
    async (fecha?: string) => {
      setCurrentDate(fecha || null);
      try {
        const logs = await getLogCurvas(fecha);

        const emptyState: DatosCurvas = {
          matrizGeneral: [],
          productos: [],
          fechaCarga: new Date(),
        };

        if (!logs || logs.length === 0) {
          setDatosCurvas(emptyState);
          return;
        }

        // Reusar la misma lógica de agrupación que cargarDatosGuardados
        const groups: Record<
          string,
          {
            referencia: string;
            normalizedRef: string;
            plantilla: "matriz_general" | "productos";
            logs: any[];
            lastUpdate: number;
          }
        > = {};

        logs.forEach((log) => {
          const rawRef = log.referencia || "SIN REF";
          let normalizedRef = rawRef.replace(/^REF:\s*/i, "").trim();
          if (normalizedRef.includes(" | "))
            normalizedRef = normalizedRef.split(" | ")[0].trim();
          normalizedRef = normalizedRef.toUpperCase();

          const groupKey = `${log.plantilla}|${normalizedRef}`;
          if (!groups[groupKey]) {
            groups[groupKey] = {
              referencia: rawRef,
              normalizedRef,
              plantilla: log.plantilla,
              logs: [],
              lastUpdate: 0,
            };
          }
          const logTime = new Date(log.fecha).getTime();
          if (logTime > groups[groupKey].lastUpdate) {
            groups[groupKey].lastUpdate = logTime;
            if (
              rawRef.includes("|") ||
              !groups[groupKey].referencia.includes("|")
            ) {
              groups[groupKey].referencia = rawRef;
            }
          }
          const exists = groups[groupKey].logs.find(
            (l) => l.tienda_id === log.tienda_id,
          );
          if (!exists) groups[groupKey].logs.push(log);
        });

        const matrizGeneral: MatrizGeneralCurvas[] = [];
        const productos: DetalleProducto[] = [];

        Object.values(groups).forEach((group) => {
          const allColumns = new Set<string>();
          const filas: any[] = [];

          group.logs.forEach((log) => {
            let cantidadTalla: any[] = [];
            try {
              cantidadTalla =
                typeof log.cantidad_talla === "string"
                  ? JSON.parse(log.cantidad_talla)
                  : log.cantidad_talla;
            } catch {
              return;
            }
            if (!Array.isArray(cantidadTalla)) return;

            const rowData: Record<string, any> = {};
            let rowTotal = 0;
            cantidadTalla.forEach((ct) => {
              const col = String(ct.talla || ct.numero || "");
              if (!col) return;
              allColumns.add(col);
              rowData[col] = {
                valor: ct.cantidad,
                esCero: ct.cantidad === 0,
                esMayorQueCero: ct.cantidad > 0,
                id: `${log.tienda_id}-${col}`,
              };
              rowTotal += ct.cantidad;
            });

            filas.push({
              id: `${String(log.tienda_id)}-${group.normalizedRef}`,
              tienda: {
                id: log.tienda_id,
                nombre:
                  tiendasDict[log.tienda_id] ||
                  log.tienda_nombre ||
                  "Tienda " + log.tienda_id,
                codigo: "",
              },
              [group.plantilla === "matriz_general" ? "curvas" : "tallas"]:
                rowData,
              total: rowTotal,
            });
          });

          filas.sort((a, b) =>
            (a.tienda.nombre || "").localeCompare(b.tienda.nombre || ""),
          );

          const sortedColumns = Array.from(allColumns).sort((a, b) => {
            const nA = parseFloat(a),
              nB = parseFloat(b);
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
            return a.localeCompare(b);
          });

          const colTotals: Record<string, number> = {};
          sortedColumns.forEach((col) => {
            colTotals[col] = filas.reduce((sum, f) => {
              const data =
                group.plantilla === "matriz_general" ? f.curvas : f.tallas;
              return sum + (data[col]?.valor || 0);
            }, 0);
          });
          const totalGeneral = Object.values(colTotals).reduce(
            (a, b) => a + b,
            0,
          );

          if (group.plantilla === "matriz_general") {
            matrizGeneral.push({
              id: String(group.normalizedRef || group.referencia),
              nombreHoja: group.referencia,
              referencia: group.referencia,
              filas: filas as FilaMatrizGeneral[],
              curvas: sortedColumns,
              totalesPorCurva: colTotals,
              totalGeneral,
              estado: group.logs[0]?.estado || "borrador",
            });
          } else {
            productos.push({
              id: String(group.normalizedRef || group.referencia),
              nombreHoja: group.referencia,
              metadatos: {
                referencia: group.referencia.includes("|")
                  ? group.referencia.split("|")[0].trim()
                  : group.referencia,
                imagen: "",
                color: group.referencia.includes("|")
                  ? group.referencia.split("|")[1].trim()
                  : "",
                proveedor: group.logs[0]?.proveedor || "RECUPERADO",
                precio: group.logs[0]?.precio || 0,
                linea: group.plantilla === "productos" ? "CALZADO" : "GENERAL",
              },
              filas: filas as FilaDetalleProducto[],
              tallas: sortedColumns,
              totalesPorTalla: colTotals,
              totalGeneral,
              estado: group.logs[0]?.estado || "borrador",
            });
          }
        });

        setDatosCurvas({ matrizGeneral, productos, fechaCarga: new Date() });
      } catch (error) {
        console.error("Error en cargarDatosPorFecha:", error);
      }
    },
    [tiendasDict],
  );

  // ============================================
  // REUTILIZAR LOTE (Duplicar con fecha actual → despacho)
  // ============================================
  const reutilizarLote = useCallback(
    async (sheetId: string): Promise<boolean> => {
      if (!datosCurvas || !user) return false;
      try {
        let sheet: any =
          datosCurvas.matrizGeneral.find((s) => s.id === sheetId) ||
          datosCurvas.productos.find((s) => s.id === sheetId);
        if (!sheet) return false;

        const isMatriz = "curvas" in sheet;
        const dataKey = isMatriz ? "curvas" : "tallas";
        const columnas: string[] = sheet[dataKey] || [];
        const plantilla: "matriz_general" | "productos" = isMatriz
          ? "matriz_general"
          : "productos";
        const baseRef = extractRef(sheet);

        const fechaActual = new Date().toISOString();
        const logsBatch: any[] = [];

        for (const fila of sheet.filas) {
          if (!fila.tienda || !fila.tienda.id || fila.id === "row-total-final")
            continue;
          const cantidadTalla: { talla: number; cantidad: number }[] = [];
          const datosFila = fila[dataKey] || {};

          columnas.forEach((col: string) => {
            const celda = datosFila[col];
            if (celda && celda.valor > 0) {
              cantidadTalla.push({
                talla: parseFloat(col),
                cantidad: celda.valor,
              });
            }
          });

          if (cantidadTalla.length === 0) continue;

          const ctJson = JSON.stringify(cantidadTalla);

          logsBatch.push({
            tienda_id: fila.tienda.id,
            tienda_nombre: fila.tienda.nombre || "",
            plantilla,
            fecha: fechaActual,
            cantidad_talla: ctJson,
            referencia: baseRef,
            estado: "borrador", // Se crea como borrador para permitir edición en el Dashboard
          });
        }

        if (logsBatch.length === 0) return false;

        const logIds = await saveLogsBatch(logsBatch);

        if (logIds.length === 0)
          throw new Error("Error guardando reutilización");

        refreshLogs();
        return true;
      } catch (error) {
        console.error("Error en reutilizarLote:", error);
        return false;
      }
    },
    [datosCurvas, user, extractRef, refreshLogs],
  );

  // ============================================
  // ACCIONES DE LOG CURVAS (GUARDAR EN DIRECTUS)
  // ============================================

  const guardarLogCurvas = useCallback(
    async (data: {
      tiendaId: string;
      tiendaNombre: string;
      plantilla: "matriz_general" | "productos";
      cantidadTalla: { talla: number; cantidad: number }[];
      referencia?: string;
      estado?: "borrador" | "confirmado";
    }): Promise<boolean> => {
      try {
        // Convertir el array de cantidad_talla a JSON
        const cantidadTallaJson = JSON.stringify(data.cantidadTalla);

        // Fecha actual en formato ISO
        const fechaActual = new Date().toISOString();

        const ok = await saveLogCurvas({
          tienda_id: data.tiendaId,
          tienda_nombre: data.tiendaNombre,
          plantilla: data.plantilla,
          fecha: fechaActual,
          cantidad_talla: cantidadTallaJson,
          referencia: data.referencia || "",
          estado: data.estado || "borrador",
        });

        return ok;
      } catch (error) {
        console.error("Error al guardar log curvas:", error);
        return false;
      }
    },
    [],
  );

  // ============================================
  // ACCIONES DE ENVÍO (BODEGA)
  // ============================================

  const agregarArticuloEscaneado = useCallback(
    (articulo: Omit<ArticuloEscaneado, "id" | "fechaEscaneo">) => {
      if (!permissions.canScan) return;

      const nuevoArticulo: ArticuloEscaneado = {
        ...articulo,
        id: Date.now().toString(),
        fechaEscaneo: new Date(),
      };

      setArticulosEscaneados((prev) => [...prev, nuevoArticulo]);
    },
    [permissions.canScan],
  );

  const crearEnvio = useCallback(
    (tiendaId: string): EnvioTienda | null => {
      if (!permissions.canManageShipments) return null;

      const articulosTienda = articulosEscaneados.filter(
        (a) => a.tiendaDestino.id === tiendaId,
      );

      if (articulosTienda.length === 0) return null;

      const nuevoEnvio: EnvioTienda = {
        id: Date.now().toString(),
        tienda: articulosTienda[0].tiendaDestino,
        articulos: articulosTienda,
        totalArticulos: articulosTienda.reduce((sum, a) => sum + a.cantidad, 0),
        estado: "pendiente",
        fechaCreacion: new Date(),
        usuarioCreacion: userRole as string,
      };

      setEnvios((prev) => [...prev, nuevoEnvio]);
      setArticulosEscaneados((prev) =>
        prev.filter((a) => a.tiendaDestino.id !== tiendaId),
      );

      return nuevoEnvio;
    },
    [permissions.canManageShipments, articulosEscaneados, userRole],
  );

  const actualizarEstadoEnvio = useCallback(
    (envioId: string, estado: EnvioTienda["estado"]) => {
      if (!permissions.canManageShipments) return;

      setEnvios((prev) =>
        prev.map((e) =>
          e.id === envioId
            ? {
                ...e,
                estado,
                fechaDespacho:
                  estado === "despachado" ? new Date() : e.fechaDespacho,
                usuarioDespacho:
                  estado === "despachado" ? userRole : e.usuarioDespacho,
              }
            : e,
        ),
      );
    },
    [permissions.canManageShipments, userRole],
  );

  // ============================================
  // ACCIONES DE VALIDACIÓN (DESPACHO)
  // ============================================

  const actualizarValorValidacion = useCallback(
    (
      sheetId: string,
      filaId: string,
      col: string,
      valor: number,
      codigoBarra?: string | null,
    ) => {
      setValidationData((prev) => {
        const sId = String(sheetId);
        const fId = String(filaId);
        const c = String(col);

        // Obtener datos existentes
        const existingData = prev[sId]?.[fId]?.[c];
        const currentCantidad =
          typeof existingData === "object"
            ? (existingData as any).cantidad || 0
            : typeof existingData === "number"
              ? existingData
              : 0;
        const existingBarcodes: string[] =
          typeof existingData === "object"
            ? (existingData as any).barcodes || []
            : [];

        // Nuevo valor
        const newCantidad =
          typeof existingData === "number"
            ? existingData + valor
            : currentCantidad + valor;

        // Manejar códigos de barra
        let newBarcodes: string[];
        if (codigoBarra === null && newCantidad >= 0) {
          // Caso especial: quitar el último barcode (decremento)
          newBarcodes = existingBarcodes.slice(0, -1);
        } else if (codigoBarra && codigoBarra.length > 0) {
          // Agregar nuevo barcode
          newBarcodes = [...existingBarcodes, codigoBarra];
        } else {
          // Mantener barcodes existentes
          newBarcodes = existingBarcodes;
        }

        // Crear nuevas referencias en cada nivel para que React.memo detecte el cambio
        return {
          ...prev,
          [sId]: {
            ...(prev[sId] || {}),
            [fId]: {
              ...(prev[sId]?.[fId] || {}),
              [c]: {
                cantidad: newCantidad,
                barcodes: newBarcodes,
              },
            },
          },
        } as Record<
          string,
          Record<string, Record<string, ValidationCellValue>>
        >;
      });
    },
    [],
  );

  const limpiarValidacion = useCallback(
    (sheetId?: string) => {
      if (user) {
        liberarTodosLosBloqueosDeUsuario(user.id).then(() => {
          obtenerBloqueosActivos().then(setBloqueosActivos);
        });
      }
      if (sheetId) {
        setValidationData((prev) => {
          const next = { ...prev };
          delete next[String(sheetId)];
          return next;
        });
      } else {
        setValidationData({});
      }
    },
    [user],
  );

  const guardarEnvioDespacho = useCallback(
    async (
      sheetId: string,
      overrideData?: Record<string, Record<string, any>>,
      overridePlantilla?: "matriz_general" | "productos",
      overrideRef?: string,
    ): Promise<{ success: boolean; logIds?: string[] }> => {
      if (!user) return { success: false };
      const sheetIdStr = String(sheetId);

      let currentSheetValidation: Record<string, Record<string, any>> = {};
      if (overrideData) {
        currentSheetValidation = overrideData;
      } else {
        currentSheetValidation = validationData[sheetIdStr] || {};
      }

      if (Object.keys(currentSheetValidation).length === 0) {
        console.warn(
          "⚠️ [guardarEnvioDespacho] No hay datos de validación para enviar (lote vacío)",
        );
        return { success: false };
      }

      try {
        // 1. Intentar encontrar la hoja original (plantilla)
        let template: any = [
          ...(datosCurvas?.matrizGeneral || []),
          ...(datosCurvas?.productos || []),
        ].find(
          (s) =>
            String(s.id) === sheetIdStr ||
            extractRef(s).toUpperCase() === sheetIdStr.toUpperCase() ||
            String(s.nombreHoja).toUpperCase() === sheetIdStr.toUpperCase(),
        );

        // Si no hay plantilla, usamos los overrides o valores por defecto
        const refFinal =
          overrideRef || (template ? extractRef(template) : sheetIdStr);
        const isMatriz =
          overridePlantilla === "matriz_general" ||
          (template
            ? datosCurvas?.matrizGeneral?.some((s) => s.id === template.id)
            : refFinal.length < 6);
        const plantilla: "matriz_general" | "productos" = isMatriz
          ? "matriz_general"
          : "productos";
        const fechaActual = new Date().toISOString();

        const logsBatch: any[] = [];
        const enviosBatch: any[] = [];
        const logIdMap: Record<string, string> = {}; // mapa tienda_id -> log_id

        // 2. Procesar cada tienda en la validación
        for (const [filaId, tallas] of Object.entries(currentSheetValidation)) {
          // Sanitizar filaId - asegurar que es string
          const filaIdStr =
            typeof filaId === "object"
              ? JSON.stringify(filaId)
              : String(filaId);

          // Buscamos info de la tienda:
          // a) En la plantilla local (si existe)
          // b) O asumimos que filaId es el tienda_id (común en lotes cargados de BD)
          const fila = template?.filas?.find(
            (f: any) =>
              String(f.id) === filaIdStr ||
              String(f.tienda?.id) === filaIdStr ||
              String(f.tienda?.codigo) === filaIdStr,
          );

          const tiendaIdFinal =
            fila?.tienda?.id || (tiendasDict[filaIdStr] ? filaIdStr : null);

          if (!tiendaIdFinal) {
            console.warn(
              `❓ [guardarEnvioDespacho] No se pudo resolver ID de tienda para la fila ${filaIdStr}. Saltando...`,
            );
            continue;
          }

          // Construir cantidad_talla con codigo_barra
          const cantidadTalla: {
            talla: number;
            cantidad: number;
            codigo_barra: string;
          }[] = [];

          for (const [col, data] of Object.entries(tallas)) {
            // data puede ser number (compatibilidad hacia atrás) o { cantidad, barcodes }
            const cellData =
              typeof data === "object"
                ? data
                : { cantidad: data, barcodes: [] };
            const cantidad = cellData.cantidad || 0;
            const barcodes = cellData.barcodes || [];

            if (cantidad > 0) {
              // Si hay barcodes guardados, crear una entrada por cada barcode
              if (barcodes.length > 0) {
                // Contar ocurrencias de cada barcode
                const barcodeCount: Record<string, number> = {};
                barcodes.forEach((bc: string) => {
                  barcodeCount[bc] = (barcodeCount[bc] || 0) + 1;
                });

                Object.entries(barcodeCount).forEach(([codigoBarra, qty]) => {
                  cantidadTalla.push({
                    talla: parseFloat(col),
                    cantidad: qty,
                    codigo_barra: codigoBarra,
                  });
                });
              } else {
                // Sin barcodes, crear entrada simple
                cantidadTalla.push({
                  talla: parseFloat(col),
                  cantidad: cantidad,
                  codigo_barra: "",
                });
              }
            }
          }

          if (cantidadTalla.length > 0) {
            // Crear registro en log_curvas
            logsBatch.push({
              tienda_id: String(tiendaIdFinal),
              tienda_nombre:
                fila?.tienda?.nombre || tiendasDict[filaIdStr] || "",
              plantilla,
              fecha: fechaActual,
              cantidad_talla: JSON.stringify(cantidadTalla),
              referencia: refFinal,
              estado: "confirmado",
            });
          }
        }

        // 3. Guardar logs y obtener IDs
        let logIds: string[] = [];
        if (logsBatch.length > 0) {
          logIds = await saveLogsBatch(logsBatch);
          if (logIds.length === 0) {
            console.error(
              "❌ [guardarEnvioDespacho] Error al guardar logs - no se obtuvo ID",
            );
            return { success: false };
          }

          // Crear mapa de tienda_id -> log_id
          logsBatch.forEach((log, index) => {
            if (logIds[index]) {
              logIdMap[log.tienda_id] = logIds[index];
            }
          });
        }

        if (Object.keys(logIdMap).length === 0) {
          console.warn(
            "⚠️ [guardarEnvioDespacho] El lote de envío está vacío tras procesar tiendas",
          );
          return { success: true, logIds: [] };
        }

        // 4. Crear registros en envios_curvas con referencia al log
        for (const [filaId, tallas] of Object.entries(currentSheetValidation)) {
          // Sanitizar filaId - asegurar que es string
          const filaIdStr =
            typeof filaId === "object"
              ? JSON.stringify(filaId)
              : String(filaId);

          const fila = template?.filas?.find(
            (f: any) =>
              String(f.id) === filaIdStr ||
              String(f.tienda?.id) === filaIdStr ||
              String(f.tienda?.codigo) === filaIdStr,
          );

          const tiendaIdFinal =
            fila?.tienda?.id || (tiendasDict[filaIdStr] ? filaIdStr : null);

          if (!tiendaIdFinal) continue;

          const logId = logIdMap[String(tiendaIdFinal)];
          if (!logId) continue;

          // Reconstruir cantidad_talla para el envio
          const cantidadTalla: {
            talla: number;
            cantidad: number;
            codigo_barra: string;
          }[] = [];

          for (const [col, data] of Object.entries(tallas)) {
            const cellData =
              typeof data === "object"
                ? data
                : { cantidad: data, barcodes: [] };
            const cantidad = cellData.cantidad || 0;
            const barcodes = cellData.barcodes || [];

            if (cantidad > 0) {
              if (barcodes.length > 0) {
                const barcodeCount: Record<string, number> = {};
                barcodes.forEach((bc: string) => {
                  barcodeCount[bc] = (barcodeCount[bc] || 0) + 1;
                });

                Object.entries(barcodeCount).forEach(([codigoBarra, qty]) => {
                  cantidadTalla.push({
                    talla: parseFloat(col),
                    cantidad: qty,
                    codigo_barra: codigoBarra,
                  });
                });
              } else {
                cantidadTalla.push({
                  talla: parseFloat(col),
                  cantidad: cantidad,
                  codigo_barra: "",
                });
              }
            }
          }

          if (cantidadTalla.length > 0) {
            enviosBatch.push({
              tienda_id: String(tiendaIdFinal),
              plantilla: logId, // ID del log_curvas
              fecha: new Date().toISOString().split("T")[0],
              cantidad_talla: JSON.stringify(cantidadTalla),
              referencia: refFinal,
              usuario_id: user?.id,
            });
          }
        }

        const success = await saveEnviosBatch(enviosBatch);

        if (success) {
          limpiarValidacion(sheetIdStr);
          return { success: true, logIds };
        } else {
          console.error(
            "❌ [guardarEnvioDespacho] El servidor rechazó el batch de envío",
          );
          return { success: false, logIds };
        }
      } catch (err) {
        console.error("❌ [guardarEnvioDespacho] Error crítico:", err);
        return { success: false };
      }
    },
    [
      user,
      validationData,
      datosCurvas,
      tiendasDict,
      extractRef,
      limpiarValidacion,
    ],
  );

  // ============================================
  // ACCIONES DE COMPARACIÓN
  // ============================================

  const generarComparacion = useCallback(
    (envioId: string): ComparacionEnvio[] => {
      const envio = envios.find((e) => e.id === envioId);
      if (!envio || !datosCurvas) return [];

      const comparaciones: ComparacionEnvio[] = [];

      envio.articulos.forEach((articulo) => {
        let cantidadPlanificada = 0;

        if (datosCurvas.matrizGeneral && datosCurvas.matrizGeneral.length > 0) {
          // Buscar en todas las hojas disponibles de la matriz general
          for (const sheet of datosCurvas.matrizGeneral) {
            const fila = sheet.filas.find(
              (f) =>
                f.tienda.id.includes(envio.tienda.id) ||
                f.tienda.nombre === envio.tienda.nombre,
            );
            if (fila && fila.curvas[articulo.talla]) {
              cantidadPlanificada = fila.curvas[articulo.talla].valor;
              break; // Encontrado en esta hoja, salir del loop de hojas
            }
          }
        }

        const diferencia = articulo.cantidad - cantidadPlanificada;

        comparaciones.push({
          id: `${envioId} -${articulo.id} `,
          tienda: envio.tienda,
          referencia: articulo.referencia,
          talla: articulo.talla,
          cantidadPlanificada,
          cantidadEscaneada: articulo.cantidad,
          diferencia,
          estado:
            diferencia === 0
              ? "coincide"
              : diferencia > 0
                ? "sobrante"
                : "faltante",
        });
      });

      return comparaciones;
    },
    [envios, datosCurvas],
  );

  const generarReporteDiscrepancias = useCallback(
    (envioId: string): ReporteDiscrepancias | null => {
      const envio = envios.find((e) => e.id === envioId);
      if (!envio) return null;

      const comparaciones = generarComparacion(envioId);

      const totalCoincidencias = comparaciones.filter(
        (c) => c.estado === "coincide",
      ).length;
      const totalSobrantes = comparaciones.filter(
        (c) => c.estado === "sobrante",
      ).length;
      const totalFaltantes = comparaciones.filter(
        (c) => c.estado === "faltante",
      ).length;

      const resumen = `Total: ${comparaciones.length} artículos | Coincidencias: ${totalCoincidencias} | Sobrantes: ${totalSobrantes} | Faltantes: ${totalFaltantes} `;

      return {
        id: `reporte - ${envioId} `,
        fechaGeneracion: new Date(),
        envio,
        comparaciones,
        totalCoincidencias,
        totalSobrantes,
        totalFaltantes,
        resumen,
      };
    },
    [envios, generarComparacion],
  );

  const value: CurvasContextType = useMemo(
    () => ({
      userRole: internalRole,
      permissions,
      setUserRole,
      datosCurvas,
      archivos,
      celdasEditadas,
      hasChanges,
      setHasChanges,
      envios,
      articulosEscaneados,
      procesarArchivo,
      limpiarDatos,
      cargarDatosGuardados,
      editarCelda,
       cambiarTalla,
      guardarCambios,
      guardarLogCurvas,
      confirmarLote,
      confirmarLoteConDatos,
      descartarCambios,
      agregarArticuloEscaneado,
      crearEnvio,
      actualizarEstadoEnvio,
      generarComparacion,
      generarReporteDiscrepancias,
      actualizarValorValidacion,
      limpiarValidacion,
      guardarEnvioDespacho,
      cargarDatosManuales,
      refreshLogs,
      lastLogsUpdate,
      bloqueosActivos,
      intentarBloquear,
      desmarcarTienda,
      notificacionCambios,
      setNotificacionCambios,
      tiendasDict,
      extractRef,
      cargarDatosPorFecha,
      reutilizarLote,
      validationData,
      setValidationData,
      saveEnviosBatch,
    }),
    [
      internalRole,
      permissions,
      setUserRole,
      datosCurvas,
      archivos,
      celdasEditadas,
      hasChanges,
      setHasChanges,
      envios,
      articulosEscaneados,
      procesarArchivo,
      limpiarDatos,
      cargarDatosGuardados,
      editarCelda,
       cambiarTalla,
      guardarCambios,
      guardarLogCurvas,
      confirmarLote,
      confirmarLoteConDatos,
      descartarCambios,
      agregarArticuloEscaneado,
      crearEnvio,
      actualizarEstadoEnvio,
      generarComparacion,
      generarReporteDiscrepancias,
      actualizarValorValidacion,
      limpiarValidacion,
      guardarEnvioDespacho,
      cargarDatosManuales,
      refreshLogs,
      lastLogsUpdate,
      bloqueosActivos,
      intentarBloquear,
      desmarcarTienda,
      notificacionCambios,
      setNotificacionCambios,
      tiendasDict,
      extractRef,
      cargarDatosPorFecha,
      reutilizarLote,
      validationData,
      setValidationData,
      saveEnviosBatch,
    ],
  );

  return (
    <CurvasContext.Provider value={value}>{children}</CurvasContext.Provider>
  );
};

/**
 * Hook para usar el contexto de curvas
 */
export const useCurvas = () => {
  const context = useContext(CurvasContext);
  if (!context) {
    throw new Error("useCurvas debe usarse dentro de CurvasProvider");
  }
  return context;
};

export default CurvasContext;
