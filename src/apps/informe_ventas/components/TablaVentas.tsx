/**
 * Componente de tabla de ventas para el Informe de Ventas
 *
 * Muestra:
 * - Nombre del asesor
 * - Tienda/Bodega
 * - Ciudad/Zona
 * - Unidades vendidas (total)
 * - Valor de ventas
 * - Líneas de venta como columnas fijas (Colección, Básicos, Promoción)
 * - Agrupaciones como columnas seleccionables (Indigo, Tela Liviana, Calzado, Complemento)
 */

import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  TextField,
  Checkbox,
  TablePagination,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { TablaVentasFila, Agrupacion } from "../types";

interface TablaVentasProps {
  datos: TablaVentasFila[];
  loading?: boolean;
}

type OrdenDireccion = "asc" | "desc";
type CampoOrden = keyof TablaVentasFila;

const AGRUPACIONES: Agrupacion[] = [
  "Indigo",
  "Tela Liviana",
  "Calzado",
  "Complemento",
];

export function TablaVentas({ datos, loading }: TablaVentasProps) {
  const [ordenCampo, setOrdenCampo] = useState<CampoOrden>("unidades");
  const [ordenDireccion, setOrdenDireccion] = useState<OrdenDireccion>("desc");
  const [busqueda, setBusqueda] = useState("");
  const [agrupacionesSeleccionadas, setAgrupacionesSeleccionadas] = useState<
    Agrupacion[]
  >([]);
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

  const handleSelectAll = () => {
    if (agrupacionesSeleccionadas.length === AGRUPACIONES.length) {
      setAgrupacionesSeleccionadas([]);
    } else {
      setAgrupacionesSeleccionadas([...AGRUPACIONES]);
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-CO").format(value);
  };

  // Columnas fijas - todas con el mismo ancho base
  const columnasFijas: {
    id: CampoOrden;
    label: string;
    align?: "left" | "center" | "right";
  }[] = [
    { id: "asesor", label: "Asesor", align: "left" },
    { id: "bodega", label: "Tienda", align: "left" },
    { id: "ciudad", label: "Ciudad", align: "left" },
    { id: "zona", label: "Zona", align: "left" },
    { id: "unidades", label: "Total Und", align: "right" },
    { id: "valor", label: "Valor", align: "right" },
    // Líneas de venta - unidades
    { id: "unidades_coleccion", label: "Und Colección", align: "right" },
    { id: "unidades_basicos", label: "Und Básicos", align: "right" },
    { id: "unidades_promocion", label: "Und Promoción", align: "right" },
    // Líneas de venta - valores
    { id: "valor_coleccion", label: "Val Colección", align: "right" },
    { id: "valor_basicos", label: "Val Básicos", align: "right" },
    { id: "valor_promocion", label: "Val Promoción", align: "right" },
  ];

  // Columnas de agrupaciones según selección (filtrar valores undefined)
  const columnasAgrupaciones: {
    id: CampoOrden;
    label: string;
    align?: "left" | "center" | "right";
  }[] = agrupacionesSeleccionadas
    .filter(
      (agrup): agrup is Agrupacion => !!agrup && AGRUPACIONES.includes(agrup),
    )
    .map((agrup) => {
      const id =
        `unidades_${agrup.toLowerCase().replace(/ /g, "_")}` as CampoOrden;
      return {
        id,
        label: agrup,
        align: "right" as const,
      };
    });

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Cargando datos...</Typography>
      </Paper>
    );
  }

  if (datos.length === 0) {
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
      {/* Barra de herramientas compacta */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "grey.50",
          flexShrink: 0,
        }}
      >
        {/* Buscador a la izquierda */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            width: 400,
          }}
        >
          <SearchIcon color="action" fontSize="small" />
          <TextField
            placeholder="Asesor, tienda, ciudad, zona..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(0);
            }}
            size="small"
            variant="standard"
            sx={{ flex: 1 }}
            slotProps={{
              input: { disableUnderline: false },
            }}
          />
        </Box>

        {/* Agrupaciones a la derecha - Chips seleccionables */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Agrupaciones:
          </Typography>
          {AGRUPACIONES.map((agrup) => {
            const isSelected = agrupacionesSeleccionadas.includes(agrup);
            return (
              <Box
                key={agrup}
                onClick={() => {
                  if (isSelected) {
                    setAgrupacionesSeleccionadas((prev) =>
                      prev.filter((a) => a !== agrup),
                    );
                  } else {
                    setAgrupacionesSeleccionadas((prev) => [...prev, agrup]);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  backgroundColor: isSelected
                    ? "primary.light"
                    : "background.paper",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: isSelected
                      ? "primary.light"
                      : "action.hover",
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={isSelected}
                  sx={{ p: 0, mr: 0.5 }}
                  tabIndex={-1}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? "primary.main" : "text.primary",
                  }}
                >
                  {agrup}
                </Typography>
              </Box>
            );
          })}
          {/* Botón seleccionar/deseleccionar todas */}
          <Typography
            variant="caption"
            color="primary"
            sx={{
              cursor: "pointer",
              ml: 1,
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={handleSelectAll}
          >
            {agrupacionesSeleccionadas.length === AGRUPACIONES.length
              ? "Ninguna"
              : "Todas"}
          </Typography>
        </Box>
      </Box>

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
              {columnasFijas.map((columna) => (
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
                <TableCell sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {fila.asesor}
                  </Typography>
                </TableCell>
                <TableCell sx={{ px: 1.5 }}>{fila.bodega}</TableCell>
                <TableCell sx={{ px: 1.5 }}>{fila.ciudad}</TableCell>
                <TableCell sx={{ px: 1.5 }}>{fila.zona}</TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {formatNumber(fila.unidades)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(fila.valor)}
                  </Typography>
                </TableCell>
                {/* Líneas de venta - unidades */}
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatNumber(fila.unidades_coleccion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatNumber(fila.unidades_basicos)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatNumber(fila.unidades_promocion)}
                  </Typography>
                </TableCell>
                {/* Líneas de venta - valores */}
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_coleccion)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_basicos)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ px: 1.5 }}>
                  <Typography variant="body2">
                    {formatCurrency(fila.valor_promocion)}
                  </Typography>
                </TableCell>
                {/* Agrupaciones seleccionadas - sin colores */}
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
