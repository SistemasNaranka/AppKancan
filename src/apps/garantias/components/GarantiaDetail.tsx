import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AprobadaIcon from '@mui/icons-material/CheckCircle';
import RechazadaIcon from '@mui/icons-material/Cancel';
import { DirectusGarantia, getStatusLabel, getTipoLabel } from "../types";

interface GarantiaDetailProps {
  open: boolean;
  garantia: DirectusGarantia | null;
  onClose: () => void;
  onEdit: (garantia: DirectusGarantia) => void;
}

export const WarrantyDetail: React.FC<GarantiaDetailProps> = ({
  open,
  garantia,
  onClose,
  onEdit,
}) => {
  if (!garantia) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(value);
  };

  const getStatusChip = () => {
    const colors: Record<string, { bg: string; color: string }> = {
      pendiente: { bg: "#FEF3C7", color: "#92400E" },
      en_revision: { bg: "#DBEAFE", color: "#1E40AF" },
      aprobada: { bg: "#D1FAE5", color: "#065F46" },
      rechazada: { bg: "#FEE2E2", color: "#991B1B" },
      completada: { bg: "#EDE9FE", color: "#5B21B6" },
      cancelada: { bg: "#F3F4F6", color: "#374151" },
    };
    const style = colors[garantia.estado] || colors.pendiente;
    
    return (
      <Chip
        label={getStatusLabel(garantia.estado)}
        sx={{
          bgcolor: style.bg,
          color: style.color,
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Detalle de Garantía
          </Typography>
          <Typography variant="body2" color="text.secondary">
            #{garantia.id} - {formatDate(garantia.fecha_solicitud)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStatusChip()}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información del Cliente */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Información del Cliente
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Nombre</Typography>
            <Typography variant="body1" fontWeight={500}>{garantia.cliente_nombre}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Documento</Typography>
            <Typography variant="body1">{garantia.cliente_documento}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Teléfono</Typography>
            <Typography variant="body1">{garantia.cliente_telefono}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Email</Typography>
            <Typography variant="body1">{garantia.cliente_email || "-"}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">Dirección</Typography>
            <Typography variant="body1">{garantia.cliente_direccion || "-"}</Typography>
          </Grid>

          {/* Información del Producto */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mt: 2 }}>
              Información del Producto
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Producto</Typography>
            <Typography variant="body1" fontWeight={500}>{garantia.producto_nombre}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">Referencia</Typography>
            <Typography variant="body1">{garantia.producto_referencia}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">SKU</Typography>
            <Typography variant="body1">{garantia.producto_sku || "-"}</Typography>
          </Grid>

          {/* Información de la Compra */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mt: 2 }}>
              Información de la Compra
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">Número de Factura</Typography>
            <Typography variant="body1">{garantia.numero_factura || "-"}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">Fecha de Compra</Typography>
            <Typography variant="body1">{formatDate(garantia.fecha_compra)}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">Valor</Typography>
            <Typography variant="body1">{formatCurrency(garantia.valor_compra)}</Typography>
          </Grid>

          {/* Detalles de la Garantía */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mt: 2 }}>
              Detalles de la Garantía
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Tipo de Garantía</Typography>
            <Typography variant="body1">{getTipoLabel(garantia.tipo_garantia)}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Fecha de Vencimiento</Typography>
            <Typography variant="body1">{formatDate(garantia.fecha_vence_garantia)}</Typography>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">Descripción del Problema</Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {garantia.descripcion_problema}
            </Typography>
          </Grid>

          {/* Resolución (si existe) */}
          {(garantia.resolucion || garantia.nota_interna) && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mt: 2 }}>
                  Resolución
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              {garantia.nota_interna && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Nota Interna</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {garantia.nota_interna}
                  </Typography>
                </Grid>
              )}
              
              {garantia.resolucion && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Resolución</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {garantia.resolucion}
                  </Typography>
                  {garantia.fecha_resolucion && (
                    <Typography variant="caption" color="text.secondary">
                      Fecha: {formatDate(garantia.fecha_resolucion)}
                    </Typography>
                  )}
                </Grid>
              )}
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(garantia)}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
