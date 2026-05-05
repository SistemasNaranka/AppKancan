import React, { useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useContracts } from "../hooks/useContracts";
import { formatDate } from "../lib/utils";

// Umbral en días para mostrar alertas en la campana.
// Un contrato/prórga aparece desde 60 días antes del vencimiento hasta el día 0.
const ALERT_THRESHOLD_DAYS = 60;
// Sub-umbral para marcar como urgente (rojo) dentro de la lista.
const URGENT_THRESHOLD_DAYS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell
// ─────────────────────────────────────────────────────────────────────────────

const NotificationBell: React.FC = () => {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const { allEnriched, select } = useContracts();

  const alerts = allEnriched
    .filter((c) => isFinite(c.daysLeft) && c.daysLeft >= 0 && c.daysLeft <= ALERT_THRESHOLD_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        sx={{
          border: "1.5px solid",
          borderColor: alerts.length > 0 ? "warning.main" : "divider",
          borderRadius: 2,
          width: 40,
          height: 40,
          bgcolor: alerts.length > 0 ? "warning.light" : "background.default",
        }}
      >
        <Badge badgeContent={alerts.length} color="error" max={9}>
          <NotificationsOutlinedIcon
            sx={{
              fontSize: 20,
              color: alerts.length > 0 ? "warning.main" : "text.secondary",
            }}
          />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 340,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 8px 40px rgba(0,70,128,0.16)",
              mt: 1,
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.8,
            background: '#004680',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <NotificationsOutlinedIcon sx={{ color: "#7fb8e8", fontSize: 18 }} />
          <Typography
            variant="subtitle2"
            sx={{ color: "#fff", fontWeight: 700 }}
          >
            Notificaciones
          </Typography>
          {alerts.length > 0 && (
            <Box
              sx={{
                ml: "auto",
                bgcolor: "error.main",
                color: "#fff",
                fontSize: "0.68rem",
                fontWeight: 700,
                px: 1,
                py: 0.2,
                borderRadius: 10,
              }}
            >
              {alerts.length}
            </Box>
          )}
        </Box>

        {/* List */}
        {alerts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Sin alertas pendientes
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {alerts.map((c, idx) => {
              const days = c.daysLeft;
              const urgent = days <= URGENT_THRESHOLD_DAYS;
              return (
                <React.Fragment key={c.id}>
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => { select(c.id); setAnchor(null); }}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      cursor: 'pointer',
                      bgcolor: idx % 2 === 0 ? "background.paper" : "#fafbfd",
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: urgent ? "error.light" : "warning.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 1.5,
                        flexShrink: 0,
                        mt: 0.3,
                      }}
                    >
                      {urgent ? (
                        <ErrorOutlineIcon
                          sx={{ fontSize: 16, color: "error.main" }}
                        />
                      ) : (
                        <WarningAmberIcon
                          sx={{ fontSize: 16, color: "warning.main" }}
                        />
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {c.nombre} {c.apellido ?? ''}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            {days === 0 ? (
                              <>El contrato <strong>vence hoy</strong></>
                            ) : (
                              <>
                                Vence en{' '}
                                <strong style={{ color: urgent ? '#c62828' : '#e65100' }}>
                                  {days} {days === 1 ? 'día' : 'días'}
                                </strong>
                                {c.lastProrroga ? ' (prórga vigente)' : ''}
                              </>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {c.fechaVencimiento ? formatDate(c.fechaVencimiento) : 'Sin fecha'} · #{c.id}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < alerts.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;
