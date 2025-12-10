import React, { useState, useCallback, useMemo } from "react";
import { TiendaResumen, DirectusCargo, Role } from "../types";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { EmployeeRow } from "./EmployeeRow";
import { formatCurrency } from "../lib/utils";

import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  Divider,
} from "@mui/material";
import { blue, green, orange, grey } from "@mui/material/colors";
import {
  Person,
  Badge,
  Work,
  ShoppingBag,
  TrendingUp,
  Percent,
  AttachMoney,
  EmojiEvents,
  ThumbUp,
  Insights,
  RemoveCircleOutline,
} from "@mui/icons-material";

interface StoreExpandableCardProps {
  tienda: TiendaResumen;
  cargos?: DirectusCargo[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVentasUpdate: (
    tienda: string,
    fecha: string,
    ventas_tienda: number,
    ventas_por_asesor: Record<string, number>
  ) => void;
  ventasTiendaInput: number;
  onVentasTiendaChange: (value: number) => void;
  ventasAsesorInput: Record<string, number>;
  onVentasAsesorChange: (asesorId: string, value: number) => void;
  readOnly?: boolean;
  filterRol?: Role | "all";
}

export const StoreExpandableCard: React.FC<StoreExpandableCardProps> = ({
  tienda,
  cargos = [],
  isExpanded,
  onToggleExpand,
  onVentasUpdate,
  ventasTiendaInput,
  onVentasTiendaChange,
  ventasAsesorInput,
  onVentasAsesorChange,
  readOnly = false,
  filterRol = "all",
}) => {
  /** COLOR suave del cumplimiento */
  const getCumplimientoColor = useCallback((x: number) => {
    if (x >= 110) return green[700];
    if (x >= 100) return blue[700];
    if (x >= 95) return orange[700];
    return grey[700];
  }, []);

  /** BADGE suave, no saturado */
  /** BADGE suave, no saturado */
  const getCumplimientoBadge = useCallback((c: number) => {
    if (c >= 110)
      return (
        <span
          style={{
            color: green[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <EmojiEvents sx={{ fontSize: 18 }} /> Excelente desempeño
        </span>
      );

    if (c >= 100)
      return (
        <span
          style={{
            color: blue[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ThumbUp sx={{ fontSize: 18 }} /> Muy buen trabajo
        </span>
      );

    if (c >= 95)
      return (
        <span
          style={{
            color: orange[700],
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Insights sx={{ fontSize: 18 }} /> Buen progreso
        </span>
      );

    return (
      <span
        style={{
          color: grey[700],
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <RemoveCircleOutline sx={{ fontSize: 18 }} /> Sin comisión
      </span>
    );
  }, []);

  /** Ordenar empleados */
  const empleadosConVentas = useMemo(() => {
    return tienda.empleados
      .map((empleado) => ({
        ...empleado,
        ventasTemporales: ventasAsesorInput[empleado.id] ?? empleado.ventas,
      }))
      .sort((a, b) => {
        const comisionDiff = b.comision_pct - a.comision_pct;
        if (comisionDiff === 0) {
          return b.cumplimiento_pct - a.cumplimiento_pct;
        }
        return comisionDiff;
      });
  }, [tienda.empleados, ventasAsesorInput]);

  /** Total filtrado */
  const totalComisionesFiltrado = useMemo(() => {
    if (filterRol === "all") return tienda.total_comisiones;
    return empleadosConVentas
      .filter((e) => e.rol === filterRol)
      .reduce((total, e) => total + e.comision_monto, 0);
  }, [empleadosConVentas, filterRol, tienda.total_comisiones]);

  return (
    <Card sx={{ width: "100%", overflow: "hidden", mb: 2 }}>
      {/* HEADER */}
      <CardActionArea
        onClick={onToggleExpand}
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#fff", // azul suave
          "&:hover": { bgcolor: "primary.light" },
        }}
      >
        {/* IZQUIERDA */}
        <Box sx={{ display: "flex", gap: 2, flex: 1, minWidth: 0 }}>
          {isExpanded ? (
            <ExpandLess sx={{ color: "grey.600", mt: 0.4 }} />
          ) : (
            <ExpandMore sx={{ color: "grey.600", mt: 0.4 }} />
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              sx={{ color: "grey.900" }}
            >
              {tienda.tienda}
            </Typography>

            {/* METRICAS EN UNA LÍNEA FLEXIBLE */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.4,
                mt: 0.4,
                fontSize: "0.85rem",
                color: "grey.700",
              }}
            >
              <span>
                Presupuesto: ${formatCurrency(tienda.presupuesto_tienda)}
              </span>
              <span>|</span>
              <span>Ventas: ${formatCurrency(tienda.ventas_tienda)}</span>
              <span>|</span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.85rem",
                  color: "grey.700",
                }}
              >
                Cumplimiento:
              </span>
              {/* Porcentaje con color dinámico */}
              <span
                style={{
                  color: getCumplimientoColor(tienda.cumplimiento_tienda_pct),
                  fontWeight: 600,
                }}
              >
                {tienda.cumplimiento_tienda_pct.toFixed(2)}%
              </span>
              {/* Badge MATERIAL UI (ya formateado) */}
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {getCumplimientoBadge(tienda.cumplimiento_tienda_pct)}
              </span>
            </Box>
          </Box>
        </Box>

        {/* DERECHA */}
        <Box sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              fontWeight: 600,
              color: "green",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <AttachMoney sx={{ fontSize: 20 }} />
            {formatCurrency(totalComisionesFiltrado)}
          </Typography>

          <Typography sx={{ fontSize: "0.75rem", color: "grey.500" }}>
            {empleadosConVentas.length} empleado
            {empleadosConVentas.length !== 1 && "s"}
          </Typography>
        </Box>
      </CardActionArea>

      {/* CONTENIDO EXPANDIBLE */}
      <Collapse in={isExpanded} timeout="auto">
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {/* TABLA DE EMPLEADOS */}
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Person sx={{ mr: 1 }} />
                    Empleado
                  </TableCell>
                  <TableCell>
                    <Badge sx={{ mr: 1 }} />
                    Rol
                  </TableCell>
                  <TableCell align="right">
                    <Work sx={{ mr: 1, color: "orange" }} />
                    Presupuesto
                  </TableCell>
                  <TableCell align="right">
                    <ShoppingBag sx={{ mr: 1, color: "green" }} />
                    Ventas
                  </TableCell>
                  <TableCell align="right">
                    <TrendingUp sx={{ mr: 1, color: "blue" }} />
                    Cumplimiento
                  </TableCell>
                  <TableCell align="right">
                    <Percent sx={{ mr: 1, color: "blue" }} />% Comisión
                  </TableCell>
                  <TableCell align="right">
                    <AttachMoney sx={{ mr: 1, color: "teal" }} />$ Comisión
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {empleadosConVentas.map((empleado, idx) => (
                  <EmployeeRow
                    key={empleado.id}
                    empleado={empleado}
                    index={idx}
                    ventasAsesorInput={
                      ventasAsesorInput[empleado.id] ?? empleado.ventas
                    }
                    onVentasAsesorChange={onVentasAsesorChange}
                    readOnly={readOnly}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};
