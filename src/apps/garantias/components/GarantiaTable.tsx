import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TablePagination,
  Typography,
  Chip,
} from "@mui/material";
import ViewIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { EstadoChip } from "./GarantiaStatsCards";

interface DirectusGarantia {
  id: number;
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono?: string;
  cliente_email?: string;
  producto_nombre: string;
  producto_referencia: string;
  producto_sku?: string;
  numero_factura?: string;
  fecha_compra?: string;
  valor_compra?: number;
  tipo_garantia: string;
  descripcion_problema: string;
  fecha_solicitud: string;
  fecha_vence_garantia?: string;
  estado: string;
  nota_interna?: string;
  resolucion?: string;
  fecha_resolucion?: string;
}

const getTipoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    defecto_fabrica: "Defecto de Fábrica",
    daño_producto: "Daño en Producto",
    no_funciona: "No Funciona",
    cambio_producto: "Cambio de Producto",
    reembolso: "Reembolso",
    otra: "Otra",
  };
  return labels[tipo] || tipo;
};

interface GarantiaTableProps {
  garantias: DirectusGarantia[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onView: (garantia: DirectusGarantia) => void;
  onEdit: (garantia: DirectusGarantia) => void;
  onDelete: (garantia: DirectusGarantia) => void;
}

export const GarantiaTable: React.FC<GarantiaTableProps> = ({
  garantias,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: "calc(100vh - 340px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                ID
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Cliente
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Producto
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Tipo
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Factura
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Fecha Solicitud
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
                Estado
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }} align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Box
                        sx={{
                          height: 20,
                          bgcolor: "grey.200",
                          borderRadius: 1,
                          animation: "pulse 1.5s infinite",
                          "@keyframes pulse": {
                            "0%": { opacity: 0.6 },
                            "50%": { opacity: 1 },
                            "100%": { opacity: 0.6 },
                          },
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : garantias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No se encontraron garantías
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Intenta ajustar los filtros de búsqueda
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              garantias.map((garantia) => (
                <TableRow
                  key={garantia.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>#{garantia.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {garantia.cliente_nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Doc: {garantia.cliente_documento}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {garantia.producto_nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ref: {garantia.producto_referencia}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTipoLabel(garantia.tipo_garantia)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{garantia.numero_factura || "-"}</TableCell>
                  <TableCell>{formatDate(garantia.fecha_solicitud)}</TableCell>
                  <TableCell>
                    <EstadoChip estado={garantia.estado} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onView(garantia)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => onEdit(garantia)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(garantia)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={limit}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
};
