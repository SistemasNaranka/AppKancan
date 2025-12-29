import React from "react";
import { Box, Button, Typography, Stack, Portal } from "@mui/material";


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
              fontWeight: 600 
            }}
          >
            Selecciona el tipo de exportación
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onSelectType("General")}
              fullWidth
              size="large"
            >
              General
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={() => onSelectType("Detallada")}
              fullWidth
              size="large"
            >
              Detallada
            </Button>

            <Button
              variant="outlined"
              onClick={onClose}
              fullWidth
            >
              Cancelar
            </Button>
          </Stack>
        </Box>
      </Box>
    </Portal>
  );
};

export default CSVData;
