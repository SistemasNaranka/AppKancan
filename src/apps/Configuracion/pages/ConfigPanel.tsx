import { Box, Modal, Paper, Divider } from "@mui/material";
import { HeaderUserInfo } from "@/apps/Configuracion/components/HeaderUserInfo";
import { ThemeOption } from "@/apps/Configuracion/components/ThemeOption";
import { useAppTheme } from "@/shared/hooks/ThemeContext";
import ConfirmButton from "@/shared/components/button/ConfirmButton";

interface Props {
  open: boolean;
  onClose: () => void;
  user?: any;
  area?: string;
}

export const ConfigPanel = ({ open, onClose, user, area }: Props) => {
  const { darkMode, toggleTheme } = useAppTheme();

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "90%",
            sm: 400,
            md: 460,
            lg: 520,
          },
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          overflowY: "auto",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#b0b0b0",
            borderRadius: 8,
          },
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 3 }}>
          <HeaderUserInfo user={user} area={area} />
          <Divider />

          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            <ThemeOption darkMode={darkMode} onChange={toggleTheme} />
          </Box>

          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: { xs: 1.5, sm: 2 },
              gap: 1.5,
            }}
          >
            <ConfirmButton
              text="Cerrar"
              onClick={onClose}
              sx={{
                textTransform: "none",
                minWidth: "auto",
                py: 0.5,
                px: 2,
                fontSize: "0.875rem",
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};
