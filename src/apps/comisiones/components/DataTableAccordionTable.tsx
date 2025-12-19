import React, { useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  useMediaQuery,
  Chip,
  TableSortLabel,
} from "@mui/material";
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  CalendarToday as CalendarTodayIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { TiendaResumen, Role } from "../types";
import { formatCurrency } from "../lib/utils";
import { formatProximaComision } from "../lib/calculations.next-commission";
import { grey, green, blue, orange, pink } from "@mui/material/colors";

// =============================================================================
// TIPOS Y UTILIDADES
// =============================================================================

// Tipos para el ordenamiento
type Order = "asc" | "desc";
type SortField =
  | "nombre"
  | "rol"
  | "dias_laborados"
  | "presupuesto"
  | "ventasActuales"
  | "cumplimiento_pct"
  | "comision_pct"
  | "comision_monto"
  | "proxima_comision"
  | "proxima_venta"
  | "proximo_monto_comision";

interface SortState {
  field: SortField;
  order: Order;
}

interface EmployeeRow {
  id: string;
  tiendaName: string;
  tiendaFecha: string;
  empleadoId: string;
  nombre: string;
  rol: Role;
  presupuesto: number;
  ventasOriginales: number;
  cumplimiento_pct: number;
  comision_pct: number;
  comision_monto: number;
  proxima_comision: number | string;
  proxima_venta?: number;
  proximo_monto_comision?: number;
  ventasActuales: number;
  dias_laborados: number;
}

// Estado inicial de ordenamiento (jerárquico: comision_pct > cumplimiento_pct)
const INITIAL_SORT_STATE: SortState = {
  field: "nombre", // Campo placeholder - el orden real se maneja en compareValues
  order: "desc",
};

// Función para obtener el valor a ordenar
const getSortValue = (employee: any, field: SortField): any => {
  switch (field) {
    case "nombre":
      return employee.nombre;
    case "rol":
      return employee.rol;
    case "dias_laborados":
      return employee.dias_laborados;
    case "presupuesto":
      return employee.presupuesto;
    case "ventasActuales":
      return employee.ventas;
    case "cumplimiento_pct":
      return employee.cumplimiento_pct;
    case "comision_pct":
      return employee.comision_pct;
    case "comision_monto":
      return employee.comision_monto;
    case "proxima_comision":
      return employee.proxima_comision === "NN"
        ? Number.MAX_SAFE_INTEGER
        : employee.proxima_comision;
    case "proxima_venta":
      return employee.proxima_venta || 0;
    case "proximo_monto_comision":
      return employee.proximo_monto_comision || 0;
    default:
      return "";
  }
};

// Función de comparación jerárquica para ordenamiento
const compareValues = (
  a: any,
  b: any,
  field: SortField,
  order: SortState["order"]
): number => {
  // Orden jerárquico por defecto (cuando field es "nombre")
  if (field === "nombre") {
    // Separar empleados con comisión vs sin comisión
    const aHasCommission = a.comision_pct > 0;
    const bHasCommission = b.comision_pct > 0;

    // Si uno tiene comisión y el otro no, el que tiene comisión va primero
    if (aHasCommission && !bHasCommission) return order === "desc" ? -1 : 1;
    if (!aHasCommission && bHasCommission) return order === "desc" ? 1 : -1;

    // Si ambos tienen comisión o ambos no tienen comisión
    if (aHasCommission && bHasCommission) {
      // Ambos tienen comisión: ordenar por comision_pct descendente
      if (a.comision_pct !== b.comision_pct) {
        return order === "desc"
          ? b.comision_pct - a.comision_pct
          : a.comision_pct - b.comision_pct;
      }
      // Si tienen la misma comisión, ordenar por cumplimiento_pct descendente
      return order === "desc"
        ? b.cumplimiento_pct - a.cumplimiento_pct
        : a.cumplimiento_pct - b.cumplimiento_pct;
    } else {
      // Ninguno tiene comisión: ordenar solo por cumplimiento_pct descendente
      return order === "desc"
        ? b.cumplimiento_pct - a.cumplimiento_pct
        : a.cumplimiento_pct - b.cumplimiento_pct;
    }
  }

  // usar la Para otros campos, lógica original
  const valueA = getSortValue(a, field);
  const valueB = getSortValue(b, field);

  if (typeof valueA === "string" && typeof valueB === "string") {
    return order === "desc"
      ? valueB.localeCompare(valueA, "es", { sensitivity: "base" })
      : valueA.localeCompare(valueB, "es", { sensitivity: "base" });
  }

  if (typeof valueA === "number" && typeof valueB === "number") {
    return order === "desc" ? valueB - valueA : valueA - valueB;
  }

  return 0;
};

// Función para obtener el color de fondo suave según el porcentaje
const getRowBackgroundColor = (pct: number): string => {
  if (pct >= 1.0) return green[50]; // Verde muy suave para 100%+
  if (pct >= 0.7) return blue[50]; // Azul muy suave para 70%+
  if (pct >= 0.5) return orange[50]; // Rosa muy suave para 50%+
  if (pct >= 0.35) return pink[50]; // Naranja muy suave para 35%+
  return grey[100]; // Sin fondo para <35%
};

// Función para obtener el color de hover según el porcentaje
const getRowHoverColor = (pct: number): string => {
  if (pct >= 1.0) return green[100]; // Verde más intenso en hover
  if (pct >= 0.7) return blue[100]; // Azul más intenso en hover
  if (pct >= 0.5) return orange[100]; // Rosa muy suave para 50%+
  if (pct >= 0.35) return pink[100]; // Naranja más intenso en hover
  return "#f8fafc"; // Gris claro por defecto en hover
};

// Función para procesar filas con ordenamiento
const processRowsWithSorting = (
  employeesData: any[],
  sortState: SortState,
  tienda: { tienda: string; fecha: string }
) => {
  return [...employeesData]
    .sort((a, b) => compareValues(a, b, sortState.field, sortState.order))
    .map((emp) => ({
      id: `${tienda.tienda}-${tienda.fecha}-${emp.id}`,
      tiendaName: tienda.tienda,
      tiendaFecha: tienda.fecha,
      empleadoId: emp.id,
      nombre: emp.nombre,
      rol: emp.rol,
      presupuesto: emp.presupuesto,
      ventasOriginales: emp.ventas,
      cumplimiento_pct: emp.cumplimiento_pct,
      comision_pct: emp.comision_pct,
      comision_monto: emp.comision_monto,
      proxima_comision: emp.proxima_comision,
      proxima_venta: emp.proxima_venta,
      proximo_monto_comision: emp.proximo_monto_comision,
      ventasActuales: emp.ventas,
      dias_laborados: emp.dias_laborados,
    }));
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface DataTableAccordionTableProps {
  tienda: TiendaResumen;
  readOnly: boolean;
  getCumplimientoColor: (pct: number) => string;
  handleVentaChange: (
    tiendaName: string,
    fecha: string,
    asesorId: string,
    newValue: string
  ) => void;
}

/**
 * 🚀 DataTableAccordionTable
 * Tabla interna del accordion con ordenamiento
 */
export const DataTableAccordionTable: React.FC<
  DataTableAccordionTableProps
> = ({ tienda, readOnly, getCumplimientoColor, handleVentaChange }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  // Estado para el ordenamiento
  const [sortState, setSortState] = useState<SortState>(INITIAL_SORT_STATE);

  // Función para manejar cambios de ordenamiento
  const handleSortChange = useCallback((field: SortField) => {
    setSortState((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  // ✅ LÓGICA DE ORDENAMIENTO DINÁMICO OPTIMIZADA
  const processedRows = useMemo(() => {
    return processRowsWithSorting(tienda.empleados, sortState, {
      tienda: tienda.tienda,
      fecha: tienda.fecha,
    });
  }, [tienda.empleados, tienda.tienda, tienda.fecha, sortState]);

  // ✅ FILTRAR EMPLEADOS: Ocultar filas con 0 presupuesto Y 0 ventas (solo en vista)
  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      // Mostrar empleado si tiene presupuesto > 0 O ventas > 0
      return row.presupuesto > 0 || row.ventasActuales > 0;
    });
  }, [processedRows]);

  const commonCellProps = {
    fontWeight: 600,
    fontSize: isMobile ? "0.7rem" : "0.875rem",
    color: "#6b7280",
    whiteSpace: "nowrap",
  };

  const sortLabelProps = (field: SortField) => ({
    active: sortState.field === field,
    direction: sortState.field === field ? sortState.order : "asc",
    onClick: () => handleSortChange(field),
    sx: {
      "& .MuiTableSortLabel-icon": {
        color: "#6b7280 !important",
      },
      "&.Mui-active .MuiTableSortLabel-icon": {
        color: "primary.main !important",
      },
      "&:hover": {
        color: "primary.main",
      },
    },
  });

  const renderSortHeader = (
    field: string,
    label: string,
    icon?: React.ReactNode
  ) => (
    <TableSortLabel {...sortLabelProps(field as any)}>
      <Box display="flex" alignItems="center" gap={0.5}>
        {icon}
        {label}
      </Box>
    </TableSortLabel>
  );

  return (
    <Paper
      sx={{
        width: "100%",
        maxWidth: "100%",
        borderRadius: 0,
        border: "1px solid #e0e0e0",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        margin: 0,
      }}
    >
      <TableContainer
        sx={{
          maxWidth: "100%",
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          "&::-webkit-scrollbar": {
            height: isMobile ? 8 : 4,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: grey[50],
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isMobile ? grey[400] : grey[300],
            borderRadius: isMobile ? 4 : 2,
            "&:hover": {
              backgroundColor: isMobile ? grey[500] : grey[400],
            },
          },
          // Asegurar que el scrollbar sea visible en móvil
          scrollbarWidth: isMobile ? "thin" : "auto",
          scrollbarColor: isMobile ? `${grey[400]} ${grey[50]}` : "auto",
        }}
      >
        <Table
          stickyHeader
          size={isMobile ? "small" : "small"}
          sx={{
            minWidth: isMobile ? 420 : isTablet ? 580 : "auto", // ✅ ANCHO COMPACTO PARA MÓVIL
            width: "100%",
            "& .MuiTableHead-root": {
              "& .MuiTableRow-root": {
                "& .MuiTableCell-root": {
                  borderBottom: `2px solid ${grey[300]}`,
                  fontWeight: 700,
                  backgroundColor: grey[50],
                  color: grey[800],
                  whiteSpace: "nowrap", // ✅ SIEMPRE SIN SALTO DE LÍNEA
                  padding: isMobile ? "6px 4px" : "8px 12px",
                  fontSize: isMobile ? "0.75rem" : "0.875rem", // ✅ FUENTE COMPACTA
                },
              },
            },
            "& .MuiTableBody-root": {
              "& .MuiTableRow-root": {
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
                "& .MuiTableCell-root": {
                  borderBottom: "1px solid" + grey[300],
                  whiteSpace: "nowrap",
                  padding: isMobile ? "6px 4px" : "8px 16px",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                },
              },
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 140 : isTablet ? 200 : 220,
                  minWidth: isMobile ? 140 : isTablet ? 200 : 220,
                }}
              >
                {renderSortHeader(
                  "nombre",
                  "Empleado",
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <VpnKeyIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                    <PersonIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                  </Box>
                )}
              </TableCell>

              <TableCell
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 70 : isTablet ? 90 : 100,
                  minWidth: isMobile ? 70 : isTablet ? 90 : 100,
                }}
              >
                {renderSortHeader(
                  "rol",
                  "Rol",
                  <BadgeIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                )}
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 50 : isTablet ? 70 : 85,
                  minWidth: isMobile ? 50 : isTablet ? 70 : 85,
                }}
              >
                {renderSortHeader(
                  "dias_laborados",
                  "Días Labor",
                  <CalendarTodayIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
                )}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 85 : isTablet ? 105 : 115,
                  minWidth: isMobile ? 85 : isTablet ? 105 : 115,
                }}
              >
                {renderSortHeader(
                  "presupuesto",
                  "Presupuesto",
                  <AttachMoneyIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                )}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 85 : isTablet ? 105 : 115,
                  minWidth: isMobile ? 85 : isTablet ? 105 : 115,
                }}
              >
                {renderSortHeader(
                  "ventasActuales",
                  "Ventas",
                  <TrendingUpIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                )}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 70 : isTablet ? 90 : 100,
                  minWidth: isMobile ? 70 : isTablet ? 90 : 100,
                }}
              >
                {renderSortHeader(
                  "cumplimiento_pct",
                  "Cumplimiento ",
                  <CheckCircleIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
                )}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 60 : isTablet ? 75 : 85,
                  minWidth: isMobile ? 60 : isTablet ? 75 : 85,
                }}
              >
                {renderSortHeader(
                  "comision_pct",
                  "Comisión",
                  <PercentIcon sx={{ fontSize: isMobile ? 12 : 14 }} />
                )}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 85 : isTablet ? 105 : 115,
                  minWidth: isMobile ? 85 : isTablet ? 105 : 115,
                }}
              >
                {renderSortHeader("comision_monto", "Comisión")}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 85 : isTablet ? 105 : 115,
                  minWidth: isMobile ? 85 : isTablet ? 105 : 115,
                }}
              >
                {renderSortHeader("proxima_venta", "Proxima Venta")}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 65 : isTablet ? 80 : 90,
                  minWidth: isMobile ? 65 : isTablet ? 80 : 90,
                }}
              >
                {renderSortHeader("proxima_comision", "Prox. %Comision")}
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  ...commonCellProps,
                  width: isMobile ? 85 : isTablet ? 105 : 120,
                  minWidth: isMobile ? 85 : isTablet ? 105 : 120,
                }}
              >
                {renderSortHeader("proximo_monto_comision", "Prox. Comisión")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row: EmployeeRow) => {
              const backgroundColor = getRowBackgroundColor(
                row.comision_pct * 100
              );
              const hoverColor = getRowHoverColor(row.comision_pct * 100);

              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    backgroundColor,
                    "&:hover": {
                      backgroundColor: hoverColor,
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: isMobile ? "0.8rem" : "0.875rem",
                        }}
                      >
                        {row.empleadoId}
                      </Typography>
                      {" - "}
                      {row.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.rol}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontSize: isMobile ? "0.7rem" : "0.75rem",
                        backgroundColor: blue[50],
                        height: isMobile ? 20 : 24,
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                        "& .MuiChip-label": {
                          padding: isMobile ? "0 8px" : "0 12px",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "primary.main",
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.dias_laborados}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(row.presupuesto)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(row.ventasActuales)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: getCumplimientoColor(row.comision_pct * 100),
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.cumplimiento_pct.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: getCumplimientoColor(row.comision_pct * 100),
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(row.comision_pct * 100).toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: getCumplimientoColor(row.comision_pct * 100),
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <AttachMoneyIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                      {formatCurrency(row.comision_monto)}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.proxima_venta !== undefined &&
                      row.proxima_venta !== null
                        ? formatCurrency(row.proxima_venta)
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                        fontStyle:
                          row.proxima_comision === "NN" ? "italic" : "normal",
                      }}
                    >
                      {(() => {
                        const textoFormateado = formatProximaComision(
                          row.proxima_comision
                        );
                        const esMaxima = row.proxima_comision === "NN";
                        return (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              color: esMaxima ? "#666" : "#374151",
                              fontWeight: 600,
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                              whiteSpace: "nowrap",
                              fontStyle: esMaxima ? "italic" : "normal",
                            }}
                          >
                            {textoFormateado}
                          </Typography>
                        );
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8rem" : "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <AttachMoneyIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                      {row.proximo_monto_comision !== undefined &&
                      row.proximo_monto_comision !== null
                        ? formatCurrency(row.proximo_monto_comision)
                        : "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ MENSAJE CUANDO NO HAY EMPLEADOS QUE MOSTRAR DESPUÉS DEL FILTRO */}
      {filteredRows.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            color: "text.secondary",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="body2">
            No hay empleados con presupuesto o ventas para mostrar.
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
            Los empleados con 0 presupuesto y 0 ventas no se muestran en la
            vista.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DataTableAccordionTable;
