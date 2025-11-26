import { Stack } from "@mui/material";
import { Send, Clear } from "@mui/icons-material";
import CancelButton from "@/shared/components/button/CancelButton";
import ConfirmButton from "@/shared/components/button/ConfirmButton";

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
      spacing={{ xs: 2, sm: 3, md: 8 }}
      padding={{ xs: 1.5, sm: 1.7, md: 1 }}
      justifyContent="center"
      sx={{ mt: 0 }}
    >
      {/* ← AQUÍ ESTÁ EL CAMBIO: Cancelar primero, Enviar después */}
      <CancelButton
        text="Cancelar"
        startIcon={<Clear sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />}
        onClick={onCancelar}
        sx={{
          width: { xs: "100%", sm: "auto" },
          minWidth: { xs: "100%", sm: 140, md: 160 },
          py: { xs: 1.2, sm: 1, md: 1 },
          px: { xs: 2, sm: 3, md: 2 },
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      />

      <ConfirmButton
        text="Enviar"
        variant="contained"
        startIcon={<Send sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />}
        onClick={onEnviar}
        disabled={!hasData}
        sx={{
          width: { xs: "100%", sm: "auto" },
          minWidth: { xs: "100%", sm: 140, md: 160 },
          py: { xs: 1.2, sm: 1, md: 1 },
          px: { xs: 2, sm: 3, md: 2 },
          fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
        }}
      />
    </Stack>
  );
};

export default ActionButtons;
