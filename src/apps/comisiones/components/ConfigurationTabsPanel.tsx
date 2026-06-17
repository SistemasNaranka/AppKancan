import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Save from "@mui/icons-material/Save";
import Close from "@mui/icons-material/Close";
import SettingsSuggest from "@mui/icons-material/SettingsSuggest";
import BadgeIcon from "@mui/icons-material/Badge";
import TrendingUp from "@mui/icons-material/TrendingUp";

import { PeriodSelector } from "./configurationPanel/PeriodSelector";
import { RoleConfigTab } from "./configurationPanel/RoleConfigTab";
import { ThresholdConfigTab } from "./configurationPanel/ThresholdConfigTab";
import { useRoleConfigs } from "./configurationPanel/useRoleConfigs";
import { useThresholdConfigs } from "./configurationPanel/useThresholdConfigs";

interface ConfigurationTabsPanelProps {
  open: boolean;
  onClose: () => void;
  initialMonth?: string;
  onThresholdSaved?: () => void;
}

const parseInitialDate = (input?: string) => {
  const now = new Date();
  if (!input)
    return {
      mes: (now.getMonth() + 1).toString().padStart(2, "0"),
      anio: now.getFullYear().toString(),
    };
  if (input.includes("-")) {
    const [y, m] = input.split("-");
    return { mes: m.padStart(2, "0"), anio: y };
  }
  return {
    mes: (now.getMonth() + 1).toString().padStart(2, "0"),
    anio: now.getFullYear().toString(),
  };
};

export const ConfigurationTabsPanel: React.FC<ConfigurationTabsPanelProps> = ({
  open,
  onClose,
  initialMonth,
  onThresholdSaved,
}) => {
  const initialDate = parseInitialDate(initialMonth);

  const [selectedMonth, setSelectedMonth] = useState(initialDate.mes);
  const [selectedYear, setSelectedYear] = useState(initialDate.anio);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialMonth && open) {
      const d = parseInitialDate(initialMonth);
      setSelectedMonth(d.mes);
      setSelectedYear(d.anio);
    }
  }, [initialMonth, open]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const roleHook = useRoleConfigs({
    open,
    selectedMonth,
    selectedYear,
    setError,
    setSuccess,
  });

  const thresholdHook = useThresholdConfigs({
    open,
    selectedMonth,
    selectedYear,
    setError,
    setSuccess,
    onThresholdSaved,
  });

  const loading = roleHook.loading || thresholdHook.loading;
  const loadingData = roleHook.loadingData || thresholdHook.loadingData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, boxShadow: 24 } }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#004b8d",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2.5,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <SettingsSuggest sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
              Configuración de Comisiones
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Gestión de umbrales y distribución por rol
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255, 255, 255, 0.7)",
            zIndex: 1300,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              variant="filled"
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {success}
            </Alert>
          )}
        </Box>

        <PeriodSelector
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab
            label="Distribución por Rol"
            icon={<BadgeIcon />}
            iconPosition="start"
          />
          <Tab
            label="Umbrales de Cumplimiento"
            icon={<TrendingUp />}
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 0 && (
          <RoleConfigTab
            roleConfigs={roleHook.roleConfigs}
            cargos={roleHook.cargos}
            loading={roleHook.loading}
            loadingCargos={roleHook.loadingCargos}
            loadingData={roleHook.loadingData}
            onAddRow={roleHook.handleAddRoleRow}
            onRemoveRow={roleHook.handleRemoveRoleRow}
            onRowChange={roleHook.handleRoleRowChange}
          />
        )}

        {activeTab === 1 && (
          <ThresholdConfigTab
            thresholdRows={thresholdHook.thresholdRows}
            loading={thresholdHook.loading}
            loadingData={thresholdHook.loadingData}
            onAddRow={thresholdHook.handleAddThresholdRow}
            onRemoveRow={thresholdHook.handleRemoveThresholdRow}
            onRowChange={thresholdHook.handleThresholdRowChange}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          sx={{ textTransform: "none", fontWeight: "600", fontSize: "1.1rem" }}
        >
          Cancelar
        </Button>
        {activeTab === 0 && (
          <Button
            onClick={roleHook.handleSubmit}
            variant="contained"
            disabled={loading || loadingData}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            sx={{
              bgcolor: "#004b8d",
              textTransform: "none",
              px: 5,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: 4,
              fontSize: "1.1rem",
            }}
          >
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        )}
        {activeTab === 1 && (
          <Button
            onClick={thresholdHook.handleSubmit}
            variant="contained"
            disabled={
              loading || loadingData || thresholdHook.thresholdRows.length === 0
            }
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            sx={{
              bgcolor: "#004b8d",
              textTransform: "none",
              px: 5,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: 4,
              fontSize: "1.1rem",
            }}
          >
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
