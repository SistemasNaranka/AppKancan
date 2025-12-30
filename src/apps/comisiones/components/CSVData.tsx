import React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Portal,
  Card,
  CardContent,
} from "@mui/material";
import { Summarize, ListAlt } from "@mui/icons-material";

interface CSVDataProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: "General" | "Detallada") => void;
}

const CSVData: React.FC<CSVDataProps> = ({ open, onClose, onSelectType }) => {
  if (!open) return null;

  return (
    <Portal>
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "32px",
            minWidth: "400px",
            maxWidth: "500px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: "24px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Selecciona el tipo de exportación
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 3,
            }}
          >
            <Card
              sx={{
                flex: 1,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                border: "2px solid",
                borderColor: "#1976d2",
                bgcolor: "grey.50",
                minHeight: 180,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  borderColor: "#1565c0",
                  bgcolor: "primary.100",
                },
              }}
              onClick={() => onSelectType("General")}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Summarize
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h6" gutterBottom>
                  General
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resumen por tienda con presupuesto, ventas, cumplimiento y
                  comisiones totales.
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                flex: 1,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                border: "2px solid",
                borderColor: "#1976d2",
                bgcolor: "grey.50",
                minHeight: 180,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                  borderColor: "#1565c0",
                  bgcolor: "primary.100",
                },
              }}
              onClick={() => onSelectType("Detallada")}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <ListAlt sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Detallada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detalle por empleado incluyendo documento, nombre, rol,
                  presupuesto, ventas, cumplimiento y comisión.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="outlined" onClick={onClose} size="large">
              Cancelar
            </Button>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
};

export default CSVData;
