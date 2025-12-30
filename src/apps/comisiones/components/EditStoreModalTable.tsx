import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import { DirectusAsesor, DirectusCargo, TiendaResumen } from "../types";
import { formatCurrency } from "../lib/utils";
import { calculateBudgetsWithFixedDistributive } from "../lib/calculations.budgets";
import { calculateEmployeeCommission } from "../lib/calculations.commissions";
import { blue, green, orange, grey } from "@mui/material/colors";

interface EditStoreModalTableProps {
  tienda: any;
  presupuestoTotal: number;
  empleadosSeleccionados: DirectusAsesor[];
  cargos: DirectusCargo[];
  fecha: string;
  readOnly?: boolean;
}

// Memoizar el componente para prevenir re-renders innecesarios
const EditStoreModalTable = React.memo<EditStoreModalTableProps>(({ 
  tienda,
  presupuestoTotal,
  empleadosSeleccionados,
  cargos,
  fecha,
  readOnly = false,
}) => {
  // Mapear cargos por ID para obtener nombres
  const cargosMap = useMemo(() => {
    const map = new Map<number, string>();
    cargos.forEach(cargo => {
      map.set(cargo.id, cargo.nombre);
    });
    return map;
  }, [cargos]);

  // Calcular distribución de presupuesto por rol
  const presupuestoCalculado = useMemo(() => {
    if (!presupuestoTotal || presupuestoTotal <= 0) {
      return new Map<number, number>();
    }

    // Contar empleados por rol
    const empleadosPorRol = {
      gerente: 0,
      asesor: 0,
      coadministrador: 0,
      cajero: 0,
      logistico: 0,
      gerente_online: 0,
    };

    empleadosSeleccionados.forEach(empleado => {
      const cargoNombre = cargosMap.get(
        typeof empleado.cargo_id === 'object' 
          ? empleado.cargo_id.id 
          : empleado.cargo_id
      ) || '';

      const rol = cargoNombre.toLowerCase();
      if (empleadosPorRol.hasOwnProperty(rol)) {
        empleadosPorRol[rol as keyof typeof empleadosPorRol]++;
      }
    });

    // Configuración de porcentajes por defecto (se podría obtener de la API)
    const porcentajesConfig = {
      gerente_tipo: "fijo" as const,
      gerente_porcentaje: 25,
      asesor_tipo: "distributivo" as const,
      asesor_porcentaje: 65,
      coadministrador_tipo: "fijo" as const,
      coadministrador_porcentaje: 10,
      cajero_tipo: "distributivo" as const,
      cajero_porcentaje: 0,
      logistico_tipo: "distributivo" as const,
      logistico_porcentaje: 0,
    };

    // Calcular presupuestos por rol
    const presupuestosPorRol = calculateBudgetsWithFixedDistributive(
      presupuestoTotal,
      porcentajesConfig,
      empleadosPorRol
    );

    // Distribuir entre empleados individuales
    const presupuestoPorEmpleado = new Map<number, number>();
    
    empleadosSeleccionados.forEach(empleado => {
      const cargoNombre = cargosMap.get(
        typeof empleado.cargo_id === 'object' 
          ? empleado.cargo_id.id 
          : empleado.cargo_id
      ) || '';

      const rol = cargoNombre.toLowerCase();
      const cantidadEmpleadosRol = empleadosPorRol[rol as keyof typeof empleadosPorRol];
      
      if (cantidadEmpleadosRol > 0 && presupuestosPorRol[rol] > 0) {
        const presupuestoIndividual = presupuestosPorRol[rol] / cantidadEmpleadosRol;
        presupuestoPorEmpleado.set(empleado.id, presupuestoIndividual);
      } else {
        presupuestoPorEmpleado.set(empleado.id, 0);
      }
    });

    return presupuestoPorEmpleado;
  }, [presupuestoTotal, empleadosSeleccionados, cargosMap]);

  // Calcular comisiones simuladas
  const empleadosConCalculos = useMemo(() => {
    return empleadosSeleccionados.map(empleado => {
      const presupuestoAsignado = presupuestoCalculado.get(empleado.id) || 0;
      const cargoNombre = cargosMap.get(
        typeof empleado.cargo_id === 'object' 
          ? empleado.cargo_id.id 
          : empleado.cargo_id
      ) || '';

      // Simular ventas aleatorias para demostración (en la realidad vendrían de la API)
      const ventasSimuladas = Math.floor(Math.random() * 500000) + 100000;
      
      // Crear empleado para cálculos
      const empleadoParaCalculo = {
        id: empleado.id.toString(),
        nombre: empleado.nombre || `Empleado ${empleado.id}`,
        rol: cargoNombre.toLowerCase() as any,
        tienda: tienda?.nombre || 'Tienda',
        fecha: fecha,
        presupuesto: presupuestoAsignado,
        ventas: ventasSimuladas,
        cumplimiento_pct: 0,
        comision_pct: 0,
        comision_monto: 0,
        dias_laborados: 1,
      };

      // Calcular comisión
      const comisionCalculada = calculateEmployeeCommission(
        empleadoParaCalculo,
        presupuestoAsignado,
        ventasSimuladas
      );

      return {
        ...empleado,
        cargoNombre,
        presupuestoAsignado,
        ventasSimuladas,
        comision: comisionCalculada,
      };
    });
  }, [empleadosSeleccionados, presupuestoCalculado, cargosMap, tienda, fecha]);

  const getCumplimientoColor = (pct: number) => {
    if (pct >= 100) return green[700];
    if (pct >= 70) return blue[700];
    if (pct >= 35) return orange[700];
    return grey[700];
  };

  const getRolChipColor = (rol: string) => {
    const colors: { [key: string]: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info" } = {
      gerente: "error",
      asesor: "primary",
      coadministrador: "secondary",
      cajero: "success",
      logistico: "warning",
      gerente_online: "info",
    };
    return colors[rol] || "default";
  };

  if (empleadosSeleccionados.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No hay empleados seleccionados para mostrar la tabla
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Distribución de Presupuesto y Comisiones
      </Typography>
      
      {/* Resumen */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Presupuesto Total:</strong> {formatCurrency(presupuestoTotal)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Empleados:</strong> {empleadosSeleccionados.length}
        </Typography>
        <Typography variant="body2">
          <strong>Fecha:</strong> {fecha}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell><strong>Empleado</strong></TableCell>
              <TableCell><strong>Rol</strong></TableCell>
              <TableCell align="right"><strong>Presupuesto</strong></TableCell>
              <TableCell align="right"><strong>Ventas (Sim.)</strong></TableCell>
              <TableCell align="right"><strong>Cumplimiento</strong></TableCell>
              <TableCell align="right"><strong>Comisión %</strong></TableCell>
              <TableCell align="right"><strong>Comisión $</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empleadosConCalculos.map((empleado) => (
              <TableRow 
                key={empleado.id}
                sx={{ 
                  '&:hover': { backgroundColor: 'grey.50' },
                  borderBottom: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {empleado.nombre || `Empleado ${empleado.id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Doc: {empleado.documento}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={empleado.cargoNombre} 
                    size="small"
                    color={getRolChipColor(empleado.cargoNombre.toLowerCase())}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {formatCurrency(empleado.presupuestoAsignado)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(empleado.ventasSimuladas)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ color: getCumplimientoColor(empleado.comision.cumplimiento_pct) }}
                  >
                    {empleado.comision.cumplimiento_pct.toFixed(2)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {(empleado.comision.comision_pct * 100).toFixed(2)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {formatCurrency(empleado.comision.comision_monto)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totales */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.light', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Totales:
        </Typography>
        <Typography variant="body2">
          <strong>Total Presupuesto:</strong> {formatCurrency(
            Array.from(presupuestoCalculado.values()).reduce((a, b) => a + b, 0)
          )}
        </Typography>
        <Typography variant="body2">
          <strong>Total Comisiones:</strong> {formatCurrency(
            empleadosConCalculos.reduce((total, emp) => total + emp.comision.comision_monto, 0)
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

});

EditStoreModalTable.displayName = 'EditStoreModalTable';

export default EditStoreModalTable;