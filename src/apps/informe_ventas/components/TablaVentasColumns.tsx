/**
 * Definiciones de columnas y helpers para la tabla de ventas
 *
 * Contains:
 * - AGRUPACIONES constant
 * - COLUMNAS_POR_DEFECTO constant
 * - ColumnaOpcional interface
 * - Column helpers
 * - Format utilities
 */

import {
  Box,
  TextField,
  Checkbox,
  Button,
  Menu,
  MenuItem,
  Typography,
  TableCell,
  TableSortLabel,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Agrupacion, TablaVentasFila } from "../types";

type CampoOrden = keyof TablaVentasFila;
type OrdenDireccion = "asc" | "desc";

/**
 * Props para celda de encabezado
 */
export interface HeaderCellProps {
  id: keyof TablaVentasFila;
  label: string;
  align?: "left" | "center" | "right";
  ordenCampo: CampoOrden;
  ordenDireccion: OrdenDireccion;
  onOrdenar: (campo: CampoOrden) => void;
}

/**
 * Componente de celda de encabezado
 */
export function TableHeaderCell({
  id,
  label,
  align = "left",
  ordenCampo,
  ordenDireccion,
  onOrdenar,
}: HeaderCellProps) {
  return (
    <TableCell
      align={align}
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
        active={ordenCampo === id}
        direction={ordenCampo === id ? ordenDireccion : "desc"}
        onClick={() => onOrdenar(id)}
        hideSortIcon={ordenCampo !== id}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

/**
 * Props para celda de datos
 */
export interface DataCellProps {
  value: string | number;
  align?: "left" | "center" | "right";
  fontWeight?: number;
  color?: "inherit" | "text.primary" | "text.secondary";
}

/**
 * Componente de celda de datos
 */
export function TableDataCell({
  value,
  align = "left",
  fontWeight = 400,
  color = "text.primary",
}: DataCellProps) {
  const esTexto = typeof value === "string";
  return (
    <TableCell
      align={esTexto ? align : align === "left" ? "left" : align}
      sx={{ px: 1.5 }}
    >
      <Typography variant="body2" fontWeight={fontWeight} color={color}>
        {typeof value === "string" ? value : value.toLocaleString("es-CO")}
      </Typography>
    </TableCell>
  );
}

/**
 * Tipo para definir una columna opcional
 */
export interface ColumnaOpcional {
  id: keyof TablaVentasFila;
  label: string;
  visible: boolean;
  align: "left" | "center" | "right";
}

/**
 * Props para el componente Toolbar
 */
export interface TableToolbarProps {
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  anchorEl: null | HTMLElement;
  onOpenMenu: (element: HTMLElement) => void;
  onCloseMenu: () => void;
  columnasOpcionales: ColumnaOpcional[];
  onToggleColumna: (columnaId: string) => void;
  agrupacionesSeleccionadas: Agrupacion[];
  onToggleAgrupacion: (agrupacion: Agrupacion) => void;
  onSelectAllAgrupaciones: (selectAll: boolean) => void;
}

/**
 * Componente de Toolbar para la tabla
 */
export function TableToolbar({
  busqueda,
  onBusquedaChange,
  anchorEl,
  onOpenMenu,
  onCloseMenu,
  columnasOpcionales,
  onToggleColumna,
  agrupacionesSeleccionadas,
  onToggleAgrupacion,
  onSelectAllAgrupaciones,
}: TableToolbarProps) {
  return (
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
            onBusquedaChange(e.target.value);
          }}
          size="small"
          variant="standard"
          sx={{ flex: 1 }}
          slotProps={{
            input: { disableUnderline: false },
          }}
        />
      </Box>

      {/* Columnas y Agrupaciones a la derecha */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {/* Botón para seleccionar columnas opcionales */}
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => onOpenMenu(e.currentTarget)}
          sx={{ textTransform: "none", fontSize: "0.75rem" }}
        >
          + Columnas
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={onCloseMenu}
          slotProps={{
            paper: {
              sx: { maxHeight: 300, width: 200 },
            },
          }}
        >
          {columnasOpcionales.map((columna) => (
            <MenuItem
              key={columna.id}
              onClick={() => onToggleColumna(columna.id)}
            >
              <Checkbox size="small" checked={columna.visible} sx={{ mr: 1 }} />
              <Typography variant="body2">{columna.label}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 2, mr: 1 }}
        >
          Agrupaciones:
        </Typography>
        {AGRUPACIONES.map((agrup) => {
          const isSelected = agrupacionesSeleccionadas.includes(agrup);
          return (
            <Box
              key={agrup}
              onClick={() => onToggleAgrupacion(agrup)}
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
          onClick={() =>
            onSelectAllAgrupaciones(
              agrupacionesSeleccionadas.length === AGRUPACIONES.length,
            )
          }
        >
          {agrupacionesSeleccionadas.length === AGRUPACIONES.length
            ? "Ninguna"
            : "Todas"}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Tipo para definir una columna opcional
 */
export interface ColumnaOpcional {
  id: keyof TablaVentasFila;
  label: string;
  visible: boolean;
  align: "left" | "center" | "right";
}

/**
 * Lista de agrupaciones disponibles
 */
export const AGRUPACIONES: Agrupacion[] = [
  "Indigo",
  "Tela Liviana",
  "Calzado",
  "Complemento",
];

/**
 * Columnas opcionales por defecto (todas ocultas)
 * Incluye columnas de comisión que el usuario puede mostrar si desea
 */
export const COLUMNAS_POR_DEFECTO: ColumnaOpcional[] = [
  { id: "ciudad", label: "Ciudad", visible: false, align: "left" },
  { id: "zona", label: "Zona", visible: false, align: "left" },
  { id: "unidades", label: "Total Und", visible: false, align: "right" },
  {
    id: "unidades_coleccion",
    label: "Und Colección",
    visible: false,
    align: "right",
  },
  {
    id: "unidades_basicos",
    label: "Und Básicos",
    visible: false,
    align: "right",
  },
  {
    id: "unidades_promocion",
    label: "Und Promoción",
    visible: false,
    align: "right",
  },
  {
    id: "valor_coleccion",
    label: "Val Colección",
    visible: false,
    align: "right",
  },
  { id: "valor_basicos", label: "Val Básicos", visible: false, align: "right" },
  {
    id: "valor_promocion",
    label: "Val Promoción",
    visible: false,
    align: "right",
  },
  // Comisiones (opcionales - el usuario decide si verlas)
  {
    id: "comision_coleccion",
    label: "Comisión Colección",
    visible: false,
    align: "right",
  },
  {
    id: "comision_basicos",
    label: "Comisión Básicos",
    visible: false,
    align: "right",
  },
  {
    id: "comision_promocion",
    label: "Comisión Promoción",
    visible: false,
    align: "right",
  },
];

/**
 * Columnas obligatorias (siempre visibles)
 */
export const COLUMNAS_OBLIGATORIAS: {
  id: keyof TablaVentasFila;
  label: string;
  align: "left" | "right";
}[] = [
  { id: "asesor", label: "Asesor", align: "left" },
  { id: "bodega", label: "Tienda", align: "left" },
  { id: "valor", label: "Valor Total", align: "right" },
];

/**
 * Columnas de presupuesto y cumplimiento (obligatorias)
 * Las columnas de comisión son opcionales
 */
export const COLUMNAS_PRESUPUESTO_COMISION: {
  id: keyof TablaVentasFila;
  label: string;
  align: "right";
}[] = [
  // Colección
  { id: "presupuesto_coleccion", label: "Presup. Colección", align: "right" },
  { id: "valor_coleccion", label: "Venta Colección", align: "right" },
  { id: "cumplimiento_coleccion", label: "% Cumpl. Colección", align: "right" },
  // Básicos
  { id: "presupuesto_basicos", label: "Presup. Básicos", align: "right" },
  { id: "valor_basicos", label: "Venta Básicos", align: "right" },
  { id: "cumplimiento_basicos", label: "% Cumpl. Básicos", align: "right" },
  // Promoción
  { id: "presupuesto_promocion", label: "Presup. Promoción", align: "right" },
  { id: "valor_promocion", label: "Venta Promoción", align: "right" },
  { id: "cumplimiento_promocion", label: "% Cumpl. Promoción", align: "right" },
];

/**
 * Obtiene las columnas de agrupaciones basadas en la selección
 */
export function getColumnasAgrupaciones(
  agrupacionesSeleccionadas: Agrupacion[],
): { id: keyof TablaVentasFila; label: string; align: "right" }[] {
  return agrupacionesSeleccionadas
    .filter(
      (agrup): agrup is Agrupacion =>
        agrup !== undefined && AGRUPACIONES.includes(agrup),
    )
    .map((agrup) => ({
      id: `unidades_${agrup.toLowerCase().replace(/ /g, "_")}` as keyof TablaVentasFila,
      label: agrup,
      align: "right" as const,
    }));
}

/**
 * Formatea un valor como moneda COP
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un número con separador de miles
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

/**
 * Formatea un valor como porcentaje de cumplimiento
 * Muestra el símbolo % y usa color según el valor
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Obtiene el color según el cumplimiento
 * - Verde oscuro: >= 100%
 * - Amarillo: > 95% y < 100%
 * - Rojo: <= 95%
 */
export function getCumplimientoColor(
  cumplimiento: number,
): "success.dark" | "warning.main" | "error.main" {
  if (cumplimiento >= 100) return "success.dark";
  if (cumplimiento > 95) return "warning.main";
  return "error.main";
}
