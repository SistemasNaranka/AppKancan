import { Button, Stack } from "@mui/material";
import { Send, Clear } from "@mui/icons-material";

interface ActionButtonsProps {
  hasData: boolean;
  onEnviar: () => void;
  onCancelar: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  hasData,
  onEnviar,
  onCancelar,
}) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 2, sm: 3, md: 8 }} // Espaciado responsive
      padding={{ xs: 1.5, sm: 2, md: 2 }} // Padding responsive
      justifyContent="center"
      sx={{ mt: 0 }}
    >
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<Send sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />}
        onClick={onEnviar}
        disabled={!hasData}
        fullWidth={{ xs: true, sm: false } as any} // Ancho completo en móviles
        sx={{
          minWidth: { xs: "100%", sm: 140, md: 160 }, // Ancho responsive
          fontWeight: "bold",
          py: { xs: 1.2, sm: 1, md: 1 }, // Padding vertical responsive
          px: { xs: 2, sm: 3, md: 4 }, // Padding horizontal responsive
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" }, // Tamaño de fuente responsive
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
          },
          "&:disabled": {
            bgcolor: "grey.300",
            color: "grey.600",
            transform: "none",
            boxShadow: "none",
          },
        }}
      >
        Enviar
      </Button>

      <Button
        variant="outlined"
        color="error"
        size="large"
        startIcon={<Clear sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />}
        onClick={onCancelar}
        fullWidth={{ xs: true, sm: false } as any} // Ancho completo en móviles
        sx={{
          minWidth: { xs: "100%", sm: 140, md: 160 }, // Ancho responsive
          fontWeight: "bold",
          py: { xs: 1.2, sm: 1, md: 1 }, // Padding vertical responsive
          px: { xs: 2, sm: 3, md: 4 }, // Padding horizontal responsive
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" }, // Tamaño de fuente responsive
          borderRadius: 3,
          borderWidth: 2,
          transition: "all 0.3s ease",
          "&:hover": {
            borderWidth: 2,
            bgcolor: "error.50",
            transform: "translateY(-2px)",
          },
        }}
      >
        Cancelar
      </Button>
    </Stack>
  );
};

export default ActionButtons;
