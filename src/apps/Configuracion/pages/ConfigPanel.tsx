import { useState } from "react";
import { Box, Modal, Paper, Divider, Tabs, Tab } from "@mui/material";
import { HeaderUserInfo } from "@/apps/Configuracion/components/HeaderUserInfo";
import { ThemeOption } from "@/apps/Configuracion/components/ThemeOption";
import { PasswordAdminPanel } from "@/apps/Configuracion/components/PasswordAdminPanel";
import { useAppTheme } from "@/shared/hooks/ThemeContext";
import { useAuth } from "@/auth/hooks/useAuth";
import ConfirmButton from "@/shared/components/button/ConfirmButton";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  user?: any;
  area?: string;
}

export const ConfigPanel = ({ open, onClose, user, area }: Props) => {
  const { darkMode, toggleTheme } = useAppTheme();
  const { user: authUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Verificar si el usuario tiene la politica adminPolitica
  const hasAdminPolitica =
    authUser?.policies?.includes("adminPolitica") || false;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "95%",
            sm: 600,
            md: 700,
            lg: 900,
          },
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 0 }}>
          <HeaderUserInfo user={user} area={area} />
          <Divider />

          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="configuracion tabs"
              variant="fullWidth"
            >
              <Tab label="Tema" />
              {hasAdminPolitica && <Tab label="Administracion de Claves" />}
            </Tabs>
          </Box>

          <Box
            sx={{ p: 2, overflowY: "auto", maxHeight: "calc(90vh - 200px)" }}
          >
            <TabPanel value={tabValue} index={0}>
              <ThemeOption darkMode={darkMode} onChange={toggleTheme} />
            </TabPanel>

            {hasAdminPolitica && (
              <TabPanel value={tabValue} index={1}>
                <PasswordAdminPanel />
              </TabPanel>
            )}
          </Box>

          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 2,
              gap: 1.5,
              bgcolor: "background.default",
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
