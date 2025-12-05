import React from "react";
import { Dialog, DialogContent, Typography, Box, Button } from "@mui/material";
import { AnalyticsOutlined } from "@mui/icons-material";

interface NoDataModalProps {
  open: boolean;
  onClose: () => void;
  tiendaNombre?: string;
  mesSeleccionado?: string;
}

/**
 * Modal sutil y moderno que se muestra cuando no hay datos disponibles
 */
export const NoDataModal: React.FC<NoDataModalProps> = ({
  open,
  onClose,
  tiendaNombre = "tu tienda",
  mesSeleccionado = "este mes",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          overflow: "hidden",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.4)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header sutil */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            p: 3,
            textAlign: "center",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <AnalyticsOutlined sx={{ fontSize: 30, color: "primary.main" }} />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#374151",
              mb: 1,
            }}
          >
            No hay datos disponibles
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              fontSize: "0.95rem",
              lineHeight: 1.5,
            }}
          >
            No se encontraron comisiones para{" "}
            <Box component="span" sx={{ fontWeight: 500, color: "#374151" }}>
              {tiendaNombre}
            </Box>{" "}
            en{" "}
            <Box component="span" sx={{ fontWeight: 500, color: "#374151" }}>
              {mesSeleccionado}
            </Box>
          </Typography>
        </Box>

        {/* Contenido */}
        <Box sx={{ p: 3 }}>
          {/* Lista simple de causas */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#374151",
                fontWeight: 500,
                mb: 2,
              }}
            >
              Posibles causas:
            </Typography>

            <Box sx={{ pl: 2 }}>
              {[
                "No hay presupuestos diarios configurados",
                "No se han realizado ventas para trabajar",
                "No se registraron ventas para los empleados",
                "Problemas técnicos de conexión",
              ].map((reason, index) => (
                <Typography
                  key={index}
                  sx={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    mb: 1,
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <Box component="span" sx={{ mr: 1.5, color: "#9ca3af" }}>
                    •
                  </Box>
                  {reason}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            pt: 0,
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fafafa",
          }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
          >
            Entendido
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
