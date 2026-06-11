// Diálogo de confirmación de cancelación de una reserva con detalles, motivo y toggle de notificación.

import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RoomIcon from "@mui/icons-material/MeetingRoom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva } from "../../types/reservas.types";

interface DialogCancelarReservaProps {
  open: boolean;
  reserva: Reserva | null;
  motivoCancelacion: string;
  setMotivoCancelacion: (v: string) => void;
  notificarCancelacion: boolean;
  setNotificarCancelacion: (v: boolean) => void;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const formatearHora = (h?: string) => {
  if (!h) return "";
  const [hh, mm] = h.substring(0, 5).split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return h;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
};

const formatearFecha = (date?: string) => {
  if (!date) return "";
  try {
    const [y, m, d] = date.split("-").map(Number);
    return format(new Date(y, m - 1, d), "EEEE, d 'de' MMMM 'de' yyyy", {
      locale: es,
    });
  } catch {
    return date;
  }
};

export const DialogCancelarReserva: React.FC<DialogCancelarReservaProps> = ({
  open,
  reserva,
  motivoCancelacion,
  setMotivoCancelacion,
  notificarCancelacion,
  setNotificarCancelacion,
  isPending,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isPending) return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
          color: "white",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          disabled={isPending}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "rgba(255,255,255,0.8)",
            "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EventBusyIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Cancelar Reserva
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, fontSize: "0.8rem" }}
            >
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            p: 1.8,
            mb: 2.5,
            bgcolor: "#FEF3C7",
            borderRadius: 2,
            border: "1px solid #FDE68A",
            alignItems: "flex-start",
          }}
        >
          <WarningAmberIcon sx={{ color: "#B45309", fontSize: 22, mt: 0.2 }} />
          <Typography
            variant="body2"
            sx={{ color: "#78350F", lineHeight: 1.5 }}
          >
            ¿Estás seguro de que deseas cancelar esta reserva? Los
            participantes serán notificados si activas la opción de abajo.
          </Typography>
        </Box>

        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <Box
            sx={{
              bgcolor: "#F9FAFB",
              px: 2,
              py: 1.2,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#6B7280",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: "0.7rem",
              }}
            >
              Detalles de la reserva
            </Typography>
          </Box>

          {reserva?.meeting_title && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#9CA3AF",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Reunión
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", mt: 0.3 }}
              >
                {reserva.meeting_title}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <RoomIcon sx={{ color: "#004680", fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#9CA3AF",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Sala
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}
              >
                {reserva?.room_name}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <CalendarIcon sx={{ color: "#004680", fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#9CA3AF",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Fecha
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}
              >
                {formatearFecha(reserva?.date)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
            }}
          >
            <AccessTimeIcon sx={{ color: "#004680", fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#9CA3AF",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Horario
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}
              >
                {`${formatearHora(reserva?.start_time)} — ${formatearHora(reserva?.end_time)}`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#6B7280",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.7rem",
              display: "block",
              mb: 0.8,
            }}
          >
            Motivo de la cancelación{" "}
            <span
              style={{
                color: "#9CA3AF",
                fontWeight: 500,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              (opcional)
            </span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={motivoCancelacion}
            onChange={(e) =>
              setMotivoCancelacion(e.target.value.slice(0, 300))
            }
            placeholder="Ej. La reunión se reprogramará la próxima semana, conflicto de agenda…"
            disabled={isPending}
            helperText={`${motivoCancelacion.length}/300 — Se incluirá en el correo a los participantes`}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "white",
                fontSize: "0.875rem",
              },
              "& .MuiFormHelperText-root": {
                fontSize: "0.7rem",
                color: "#9CA3AF",
                ml: 0.5,
              },
            }}
          />
        </Box>

        <Box
          sx={{
            p: 1.5,
            bgcolor: "#F9FAFB",
            borderRadius: 2,
            border: "1px solid #E5E7EB",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={notificarCancelacion}
                onChange={(e) => setNotificarCancelacion(e.target.checked)}
                disabled={isPending}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#004680" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#004680",
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ color: "#374151", fontWeight: 500 }}
              >
                Notificar a los participantes por correo
              </Typography>
            }
            sx={{ ml: 0, mr: 0, width: "100%" }}
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isPending}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            color: "#374151",
            px: 2.5,
          }}
        >
          No, mantener
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isPending}
          variant="contained"
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <EventBusyIcon />
            )
          }
          sx={{
            bgcolor: "#dc2626",
            boxShadow: "none",
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
            borderRadius: 1.5,
            "&:hover": { bgcolor: "#b91c1c", boxShadow: "none" },
          }}
        >
          {isPending ? "Cancelando..." : "Sí, cancelar reserva"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
