import React from "react";
import { Popover, Box, Typography, IconButton, Button, Chip, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TimeIcon from '@mui/icons-material/AccessTime';
import RoomIcon from '@mui/icons-material/Room';
import PersonIcon from '@mui/icons-material/Person';
import AreaIcon from '@mui/icons-material/Business';
import NotesIcon from '@mui/icons-material/Notes';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Reserva, getReservaColor, capitalize } from "../types/reservas.types";
import { formatearHora } from "./CalendarUtils";
import PulsatingMeetingIndicator from "./PulsatingMeetingIndicator";

interface PopoverProps {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
}

export const DayPopover: React.FC<PopoverProps & { 
  fecha: Date | null, 
  reservas: Reserva[], 
  sala: string, 
  onNueva: (d: Date) => void,
  onSelectReserva: (e: React.MouseEvent<HTMLElement>, r: Reserva) => void 
}> = ({ open, anchor, onClose, fecha, reservas, sala, onNueva, onSelectReserva }) => (
  <Popover open={open} anchorEl={anchor} onClose={onClose} disableScrollLock anchorOrigin={{ vertical: "center", horizontal: "right" }} transformOrigin={{ vertical: "center", horizontal: "left" }} PaperProps={{ sx: { width: 300, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" } }}>
    {fecha && (
      <Box>
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>{format(fecha, "EEEE, d MMM", { locale: es })}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ p: 2, maxHeight: 280, overflowY: "auto" }}>
          {reservas.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>No hay reservas para {sala}</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {reservas.map(r => (
                <Box key={r.id} onClick={(e) => { onClose(); onSelectReserva(e, r); }} sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid #e0e0e0", borderLeft: `4px solid ${getReservaColor(r.id)}`, cursor: "pointer", "&:hover": { backgroundColor: "#f9fafb" }, display: "flex", alignItems: "center", gap: 1.5 }}>
                  {r.estadoCalculado?.toLowerCase() === "en curso" && <PulsatingMeetingIndicator meetingDate={r.date} startTime={r.start_time} endTime={r.end_time} size={8} color="success" />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.meeting_title || "Sin título"}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatearHora(r.start_time)} - {formatearHora(r.end_time)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button fullWidth variant="contained" size="small" onClick={() => onNueva(fecha)} sx={{ textTransform: "none", boxShadow: "none" }}>Nueva reserva</Button>
        </Box>
      </Box>
    )}
  </Popover>
);

export const DetailPopover: React.FC<PopoverProps & { 
  reserva: Reserva | null, 
  puedeModificar: (r: Reserva) => boolean,
  onEdit?: (r: Reserva) => void,
  onCancel?: (r: Reserva) => void
}> = ({ open, anchor, onClose, reserva, puedeModificar, onEdit, onCancel }) => {
  if (!reserva) return null;
  const color = getReservaColor(reserva.id);
  return (
    <Popover open={open} anchorEl={anchor} onClose={onClose} anchorOrigin={{ vertical: "center", horizontal: "right" }} transformOrigin={{ vertical: "center", horizontal: "left" }} PaperProps={{ sx: { width: 340, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" } }}>
      <Box sx={{ p: 2, backgroundColor: color, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, pr: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{reserva.meeting_title || "Sin título"}</Typography>
          <Chip label={reserva.estadoCalculado || reserva.status} size="small" sx={{ mt: 0.5, backgroundColor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600, fontSize: "0.7rem", height: 20 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {puedeModificar(reserva) && (
            <>
              {onEdit && <Tooltip title="Editar"><IconButton size="small" onClick={() => { onClose(); onEdit(reserva); }} sx={{ color: "#fff" }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
              {onCancel && <Tooltip title="Cancelar"><IconButton size="small" onClick={() => { onClose(); onCancel(reserva); }} sx={{ color: "#fff" }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
            </>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        {[
          { icon: <TimeIcon />, text: `${formatearHora(reserva.start_time)} - ${formatearHora(reserva.end_time)}` },
          { icon: <RoomIcon />, text: reserva.room_name },
          { icon: <PersonIcon />, text: reserva.user_id ? `${reserva.user_id.first_name} ${reserva.user_id.last_name}` : "" },
          { icon: <AreaIcon />, text: reserva.departament ? capitalize(reserva.departament) : "" }
        ].map((item, i) => item.text && (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            {React.cloneElement(item.icon as React.ReactElement, { sx: { color: "#6b7280", fontSize: 20 } })}
            <Typography variant="body2">{item.text}</Typography>
          </Box>
        ))}
        {reserva.observations && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <NotesIcon sx={{ color: "#6b7280", fontSize: 20, mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: "#374151", whiteSpace: "pre-wrap" }}>{reserva.observations}</Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};