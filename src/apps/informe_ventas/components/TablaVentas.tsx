import { useState, useMemo, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  TablePagination,
} from "@mui/material";
import { TablaVentasFila, FiltrosVentas, Agrupacion } from "../types";
import {
  AGRUPACIONES,
  COLUMNAS_POR_DEFECTO,
  COLUMNAS_OBLIGATORIAS,
  COLUMNAS_PRESUPUESTO_COMISION,
  getColumnasAgrupaciones,
  ColumnaOpcional,
  formatCurrency,
  formatNumber,
  formatPercentage,
  getCumplimientoColor,
  TableToolbar,
} from "./TablaVentasColumns";

interface TablaVentasProps {
  datos: TablaVentasFila[];
  loading?: boolean;
  // Indica si ya se han cargado datos al menos una vez - evita parpadeo
  hasLoadedAtLeastOnce?: boolean;
  // Filtros actuales para detectar si el usuario ha filtrado
  filtros?: FiltrosVentas;
  getVisibleColumnsRef?: React.MutableRefObject<(() => string[]) | null>;
}

type OrdenDireccion = "asc" | "desc";
type CampoOrden = keyof TablaVentasFila;

export function TablaVentas({
  datos,
  loading,
  hasLoadedAtLeastOnce,
  filtros,
  getVisibleColumnsRef,
}: TablaVentasProps) {
  const [ordenCampo, setOrdenCampo] = useState<CampoOrden>("valor");
  const [ordenDireccion, setOrdenDireccion] = useState<OrdenDireccion>("desc");
  const [busqueda, setBusqueda] = useState("");
  const [agrupacionesSeleccionadas, setAgrupacionesSeleccionadas] = useState<
    Agrupacion[]
  >([]);
  const [columnasOpcionales, setColumnasOpcionales] =
    useState<ColumnaOpcional[]>(COLUMNAS_POR_DEFECTO);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Filtrar datos por búsqueda
  const datosFiltrados = useMemo(() => {
    if (!busqueda) return datos;
    const busquedaLower = busqueda.toLowerCase();
    return datos.filter(
      (fila) =>
        fila.asesor?.toLowerCase().includes(busquedaLower) ||
        fila.bodega?.toLowerCase().includes(busquedaLower) ||
        fila.ciudad?.toLowerCase().includes(busquedaLower) ||
        fila.zona?.toLowerCase().includes(busquedaLower),
    );
  }, [datos, busqueda]);

  // Ordenar datos
  const datosOrdenados = useMemo(() => {
    return [...datosFiltrados].sort((a, b) => {
      const valorA = a[ordenCampo];
      const valorB = b[ordenCampo];

      if (typeof valorA === "number" && typeof valorB === "number") {
        return ordenDireccion === "asc" ? valorA - valorB : valorB - valorA;
      }

      if (typeof valorA === "string" && typeof valorB === "string") {
        return ordenDireccion === "asc"
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      }

      return 0;
    });
  }, [datosFiltrados, ordenCampo, ordenDireccion]);

  // Paginación
  const datosPaginados = useMemo(() => {
    return datosOrdenados.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [datosOrdenados, page, rowsPerPage]);

  const handleOrdenar = (campo: CampoOrden) => {
    if (ordenCampo === campo) {
      setOrdenDireccion(ordenDireccion === "asc" ? "desc" : "asc");
    } else {
      setOrdenCampo(campo);
      setOrdenDireccion("desc");
    }
  };

  const handleToggleColumna = (columnaId: CampoOrden) => {
    setColumnasOpcionales((prev) =>
      prev.map((col) =>
        col.id === columnaId ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Columnas obligatorias - siempre visibles
  const columnasObligatorias = COLUMNAS_OBLIGATORIAS;

  // Columnas de presupuesto y comisión por línea de venta (obligatorias)
  const columnasPresupuestoComision = COLUMNAS_PRESUPUESTO_COMISION;

  // Columnas opcionales (seleccionables via checkboxes)
  const columnasOpcionalesVisibles = columnasOpcionales.filter(
    (col) => col.visible,
  );

  // Columnas de agrupaciones según selección
  const columnasAgrupaciones = getColumnasAgrupaciones(
    agrupacionesSeleccionadas,
  );

  // Columnas visibles computadas (memoized para rendimiento)
  const columnasVisibles = useMemo(() => {
    return [
      ...COLUMNAS_OBLIGATORIAS.map((c) => c.id),
      ...COLUMNAS_PRESUPUESTO_COMISION.map((c) => c.id),
      ...columnasOpcionales.filter((col) => col.visible).map((c) => c.id),
      ...columnasAgrupaciones.map((c) => c.id),
    ];
  }, [columnasOpcionales, columnasAgrupaciones]);

  useEffect(() => {
    if (getVisibleColumnsRef) {
      getVisibleColumnsRef.current = () => columnasVisibles;
    }
  }, [getVisibleColumnsRef, columnasVisibles]);

  // Función para verificar si el usuario ha aplicado filtros
  const usuarioHaFiltrado = Boolean(
    filtros?.zona ||
    filtros?.ciudad ||
    filtros?.bodega ||
    filtros?.asesor ||
    filtros?.linea_venta ||
    filtros?.agrupacion,
  );

  // Determinar si mostrar mensaje de "no hay datos"
  // Solo mostrar cuando: NO hay datos Y el usuario ha filtrado
  const noHayDatosYFiltrado =
    !loading &&
    hasLoadedAtLeastOnce &&
    datos &&
    Array.isArray(datos) &&
    datos.length === 0 &&
    usuarioHaFiltrado;

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Cargando datos...</Typography>
      </Paper>
    );
  }

  // Mostrar mensaje si no hay resultados Y el usuario ha filtrado
  if (noHayDatosYFiltrado) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No hay datos de ventas para mostrar con los filtros seleccionados.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        width: "100%",
        maxHeight: 650,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Barra de herramientas */}
      <TableToolbar
        busqueda={busqueda}
        onBusquedaChange={(value) => {
          setBusqueda(value);
          setPage(0);
        }}
        anchorEl={anchorEl}
        onOpenMenu={(element) => setAnchorEl(element)}
        onCloseMenu={() => setAnchorEl(null)}
        columnasOpcionales={columnasOpcionales}
        onToggleColumna={(columnaId) =>
          handleToggleColumna(columnaId as CampoOrden)
        }
        agrupacionesSeleccionadas={agrupacionesSeleccionadas}
        onToggleAgrupacion={(agrup) => {
          if (agrupacionesSeleccionadas.includes(agrup)) {
            setAgrupacionesSeleccionadas((prev) =>
              prev.filter((a) => a !== agrup),
            );
          } else {
            setAgrupacionesSeleccionadas((prev) => [...prev, agrup]);
          }
        }}
        onSelectAllAgrupaciones={(selectAll) => {
          if (selectAll) {
            setAgrupacionesSeleccionadas([]);
          } else {
            setAgrupacionesSeleccionadas([...AGRUPACIONES]);
          }
        }}
      />

      {/* Tabla */}
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{ tableLayout: "auto", width: "100%", minWidth: "max-content" }}
        >
          <TableHead>
            <TableRow>
              {columnasObligatorias.map((columna) => (
                <TableCell
                  key={columna.id}
                  align={columna.align || "left"}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "background.paper",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    px: 1.5,
                  }}
                >
                  <TableSortLabel
                    active={ordenCampo === columna.id}
                    direction={
                      ordenCampo === columna.id ? ordenDireccion : "desc"
                    }
                    onClick={() => handleOrdenar(columna.id)}
                    hideSortIcon={ordenCampo !== columna.id}
                  >
                    {columna.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {columnasPresupuestoComision.map((columna) => (
                <TableCell
                  key={columna.id}
                  align={columna.align || "left"}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "background.paper",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    px: 1.5,
                  }}
                >
                  <TableSortLabel
                    active={ordenCampo === columna.id}
                    direction={
                      ordenCampo === columna.id ? ordenDireccion : "desc"
                    }
                    onClick={() => handleOrdenar(columna.id)}
                    hideSortIcon={ordenCampo !== columna.id}
                  >
                    {columna.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {/* Columnas opcionales */}
              {columnasOpcionalesVisibles.map((columna) => (
                <TableCell
                  key={columna.id}
                  align={columna.align || "left"}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "background.paper",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    px: 1.5,
                  }}
                >
                  <TableSortLabel
                    active={ordenCampo === columna.id}
                    direction={
                      ordenCampo === columna.id ? ordenDireccion : "desc"
                    }
                    onClick={() => handleOrdenar(columna.id)}
                    hideSortIcon={ordenCampo !== columna.id}
                  >
                    {columna.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {/* Columnas de Agrupaciones */}
              {columnasAgrupaciones.map((columna) => (
                <TableCell
                  key={columna.id}
                  align={columna.align || "left"}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "background.paper",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    whiteSpace: "nowrap",
                    px: 1.5,
                  }}
                >
                  <TableSortLabel
                    active={ordenCampo === columna.id}
                    direction={
                      ordenCampo === columna.id ? ordenDireccion : "desc"
                    }
                    onClick={() => handleOrdenar(columna.id)}
                    hideSortIcon={ordenCampo !== columna.id}
                  >
                    {columna.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {datosPaginados.map((fila, index) => (
              <TableRow
                key={index}
                hover
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                {/* Columnas obligatorias */}
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {fila.asesor}
                  </Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>{fila.bodega}</TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(fila.valor)}
                  </Typography>
                </TableCell>
                {/* Columnas de Presupuesto y Comisión */}
                {/* Colección */}
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(fila.presupuesto_coleccion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_coleccion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography
                    variant="body2"
                    color={getCumplimientoColor(fila.cumplimiento_coleccion)}
                    fontWeight={600}
                  >
                    {formatPercentage(fila.cumplimiento_coleccion)}
                  </Typography>
                </TableCell>
                {/* Básicos */}
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(fila.presupuesto_basicos)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_basicos)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography
                    variant="body2"
                    color={getCumplimientoColor(fila.cumplimiento_basicos)}
                    fontWeight={600}
                  >
                    {formatPercentage(fila.cumplimiento_basicos)}
                  </Typography>
                </TableCell>
                {/* Promoción */}
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(fila.presupuesto_promocion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_promocion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography
                    variant="body2"
                    color={getCumplimientoColor(fila.cumplimiento_promocion)}
                    fontWeight={600}
                  >
                    {formatPercentage(fila.cumplimiento_promocion)}
                  </Typography>
                </TableCell>
                {/* Columnas opcionales */}
                {columnasOpcionalesVisibles.map((columna) => {
                  const valor = fila[columna.id];
                  const esTexto = typeof valor === "string";
                  return (
                    <TableCell
                      key={columna.id}
                      align={esTexto ? "left" : "right"}
                      sx={{ px: 1.5 }}
                    >
                      <Typography variant="body2">
                        {esTexto ? valor : formatNumber(valor as number)}
                      </Typography>
                    </TableCell>
                  );
                })}
                {/* Columnas de Agrupaciones */}
                {columnasAgrupaciones.map((columna) => {
                  const valor = fila[columna.id] as number;
                  return (
                    <TableCell key={columna.id} align="right" sx={{ px: 1.5 }}>
                      <Typography variant="body2">
                        {formatNumber(valor)}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        rowsPerPageOptions={[25, 50, 100, 250]}
        component="div"
        count={datosOrdenados.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
}

export default TablaVentas;
