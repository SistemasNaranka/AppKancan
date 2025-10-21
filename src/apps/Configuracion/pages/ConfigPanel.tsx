import {
  Box,
  Modal,
  Paper,
  Divider,
  Button,
} from "@mui/material";

import { HeaderUserInfo } from "@/apps/Configuracion/components/HeaderUserInfo";
import { ThemeOption } from "@/apps/Configuracion/components/ThemeOption";
import { useAppTheme } from "@/shared/hooks/ThemeContext";
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
          width: 460, // antes 540
          maxWidth: "90%",
          bgcolor: "background.paper",
          borderRadius: 3, // antes 4
          boxShadow: 20,
          overflow: "hidden",
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 3 }}>
          {/* Cabecera */}
          <HeaderUserInfo user={user} area={area}  />

          <Divider />

          {/* Secciones configurables */}
          <Box
            sx={{
              p: 2.5, // antes 3.5
              display: "flex",
              flexDirection: "column",
              gap: 2.5, // antes 3
            }}
          >
            <ThemeOption darkMode={darkMode} onChange={toggleTheme} />
          </Box>

          <Divider />

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 2, // antes 3
              gap: 1.5,
            }}
          >
            <Button onClick={onClose} variant="outlined" size="small">
              Cerrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};
