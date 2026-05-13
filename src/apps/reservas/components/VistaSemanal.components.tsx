import React from "react";
import {
  Box, Typography, Button, IconButton, Popover,
  Tooltip, Chip, FormControl, Select, MenuItem, CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import TimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import RoomIcon from "@mui/icons-material/Room";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AreaIcon from "@mui/icons-material/Business";
import NotesIcon from "@mui/icons-material/Notes";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { SALAS_DISPONIBLES, getReservaColor, capitalize } from "../types/reservas.types";
import type { Reserva } from "../types/reservas.types";
import type { ReservaEnCelda } from "./VistaSemanal.types";
import PulsatingMeetingIndicator from "./PulsatingMeetingIndicator";
import {
  MESES, AÑOS, DIAS,
  LABEL_GRUPO_SX, SELECT_SX, SEGMENTED_CONTAINER_SX, SEGMENTED_ITEM_BASE_SX,
  HOVER_ZONE_SX, HOVER_INDICATOR_SX,
  formatearHora12h, puedeModificar,
} from "./VistaSemanal.utils";

// ─── Átomos ───────────────────────────────────────────────────────────────────

export const GrupoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="caption" sx={LABEL_GRUPO_SX}>{children}</Typography>
);

export const HoverIndicator: React.FC<{ label: string }> = ({ label }) => (
  <Box className="hover-indicator" sx={HOVER_INDICATOR_SX}>
    <AddIcon sx={{ fontSize: 12 }} />
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 600 }}>{label}</Typography>
  </Box>
);

export const SegmentedSlider: React.FC<{ left: string; widthCalc?: string }> = ({
  left, widthCalc = "calc(50% - 10px)",
}) => (
  <Box sx={{
    position: "absolute", top: "4px", left, width: widthCalc,
    height: "calc(100% - 8px)", backgroundColor: "#004680",
    borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "left 0.2s ease",
  }} />
);

// ─── Barra de filtros ─────────────────────────────────────────────────────────

export const SelectorSala: React.FC<{
  salaSeleccionada: string;
  onCambiar: (sala: string) => void;
}> = ({ salaSeleccionada, onCambiar }) => (
  <Box className="tour-sala-selector" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    <GrupoLabel>Sala</GrupoLabel>
    <Box sx={SEGMENTED_CONTAINER_SX}>
      <SegmentedSlider left={salaSeleccionada === SALAS_DISPONIBLES[0] ? "4px" : "calc(49.5% + 1px)"} />
      {SALAS_DISPONIBLES.map((sala) => (
        <Box key={sala} onClick={() => onCambiar(sala)}
          sx={{ ...SEGMENTED_ITEM_BASE_SX, color: salaSeleccionada === sala ? "#ffffff" : "#64748b", whiteSpace: "nowrap" }}>
          {sala}
        </Box>
      ))}
    </Box>
  </Box>
);

export const SelectorVista: React.FC<{
  vistaCalendario: "semanal" | "mes";
  onCambiarVista: (v: "semanal" | "mes") => void;
}> = ({ vistaCalendario, onCambiarVista }) => (
  <Box className="tour-vista-selector" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    <GrupoLabel>Vista</GrupoLabel>
    <Box sx={SEGMENTED_CONTAINER_SX}>
      <SegmentedSlider
        left={vistaCalendario === "semanal" ? "4px" : "calc(50% + 2px)"}
        widthCalc="calc(50% - -10px)"
      />
      {(["semanal", "mes"] as const).map((v) => (
        <Box key={v} onClick={() => onCambiarVista(v)}
          sx={{ ...SEGMENTED_ITEM_BASE_SX, color: vistaCalendario === v ? (v === "semanal" ? "#ffffff" : "#1e293b") : "#64748b" }}>
          {v === "semanal" ? "Semanal" : "Mes"}
        </Box>
      ))}
    </Box>
  </Box>
);

export const NavegacionSemanal: React.FC<{
  onAnterior: () => void;
  onSiguiente: () => void;
  onHoy: () => void;
}> = ({ onAnterior, onSiguiente, onHoy }) => (
  <Box className="tour-navegacion" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    <GrupoLabel>Navegación</GrupoLabel>
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <IconButton onClick={onAnterior} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <IconButton onClick={onSiguiente} size="small" sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <ChevronRightIcon fontSize="small" />
      </IconButton>
      <Button variant="outlined" size="small" onClick={onHoy}
        sx={{ textTransform: "none", borderColor: "#e0e0e0", color: "#374151", fontSize: "0.8rem", px: 1.5, minWidth: "auto" }}>
        Esta semana
      </Button>
    </Box>
  </Box>
);

export const SelectorFecha: React.FC<{
  fechaBase: Date;
  onCambiarDia: (d: number) => void;
  onCambiarMes: (m: number) => void;
  onCambiarAño: (a: number) => void;
}> = ({ fechaBase, onCambiarDia, onCambiarMes, onCambiarAño }) => (
  <Box className="tour-selector-fecha" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    <GrupoLabel>Fecha</GrupoLabel>
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <FormControl size="small" sx={{ minWidth: 60 }}>
        <Select value={fechaBase.getDate()} onChange={(e) => onCambiarDia(e.target.value as number)} sx={SELECT_SX}>
          {DIAS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select value={fechaBase.getMonth()} onChange={(e) => onCambiarMes(e.target.value as number)} sx={SELECT_SX}>
          {MESES.map((m, i) => <MenuItem key={m} value={i}>{m}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select value={fechaBase.getFullYear()} onChange={(e) => onCambiarAño(e.target.value as number)} sx={SELECT_SX}>
          {AÑOS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </Select>
      </FormControl>
    </Box>
  </Box>
);

export const PeriodoActual: React.FC<{ rangoFechas: string }> = ({ rangoFechas }) => (
  <Box className="tour-periodo" sx={{ ml: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
    <GrupoLabel>Período</GrupoLabel>
    <Typography variant="body2" sx={{
      fontWeight: 700, color: "#1a2a3a", fontSize: "0.95rem",
      backgroundColor: "#f3f4f6", px: 2, py: 0.75, borderRadius: 1, whiteSpace: "nowrap",
    }}>
      {rangoFechas}
    </Typography>
  </Box>
);

// ─── Calendario ───────────────────────────────────────────────────────────────

export const CargandoHorarios: React.FC = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400, gap: 2 }}>
    <CircularProgress size={24} />
    <Typography variant="body2" color="text.secondary">Cargando horarios...</Typography>
  </Box>
);

export const EncabezadoDia: React.FC<{
  dia: Date; idx: number; hoy: Date; reservasSemana: Reserva[];
}> = ({ dia, idx, hoy, reservasSemana }) => {
  const esHoy = isSameDay(dia, hoy);
  const fechaStr = format(dia, "yyyy-MM-dd");
  const reservaEnCurso = reservasSemana.find(
    (r) => r.date === fechaStr && r.status?.toLowerCase() === "en curso",
  );
  return (
    <Box sx={{
      p: 1, textAlign: "center", backgroundColor: esHoy ? "#EFF6FF" : "#f9fafb",
      borderRight: idx < 4 ? "1px solid #e0e0e0" : "none", borderBottom: "1px solid #e0e0e0",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: 60, boxSizing: "border-box",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{
          fontWeight: 600, color: esHoy ? "#004680" : "#1a2a3a",
          textTransform: "capitalize", fontSize: "0.85rem",
        }}>
          {format(dia, "EEEE", { locale: es })}
        </Typography>
        {reservaEnCurso && (
          <PulsatingMeetingIndicator
            meetingDate={fechaStr} startTime={reservaEnCurso.start_time}
            endTime={reservaEnCurso.end_time} size={6} color="success"
          />
        )}
      </Box>
      <Typography variant="caption" sx={{ color: esHoy ? "#005AA3" : "#6b7280", fontSize: "0.75rem" }}>
        {format(dia, "d MMM", { locale: es })}
      </Typography>
    </Box>
  );
};

export const BloqueReserva: React.FC<{
  reserva: Reserva; hora: string;
  esInicio: boolean; esFin: boolean;
  posicion: { top: number; height: number };
  onClick: (e: React.MouseEvent<HTMLElement>, r: Reserva) => void;
}> = ({ reserva, hora, esInicio, esFin, posicion, onClick }) => {
  const colorReserva = getReservaColor(reserva.id);
  const esVigente = (reserva.estadoCalculado || reserva.status)?.toLowerCase() === "vigente";
  const [, minIni] = reserva.start_time.split(":").map(Number);
  const [, minFin] = reserva.end_time.split(":").map(Number);
  const tieneHorasMedias = minIni > 0 || minFin > 0;
  const alturaCompleta = Math.abs(posicion.height - 60) < 1;
  const borderRadius = alturaCompleta || (esInicio && esFin) ? "8px"
    : esInicio ? "8px 8px 0 0" : esFin ? "0 0 8px 8px" : "0";

  return (
    <Box key={`${reserva.id}-${hora}`} onClick={(e) => onClick(e, reserva)} sx={{
      position: "absolute", top: posicion.top + 2, left: 4, right: 4,
      height: posicion.height - 4, backgroundColor: colorReserva, borderRadius,
      px: 1, py: 0.5, cursor: "pointer", overflow: "hidden", zIndex: 1,
      "&:hover": { opacity: 0.9, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
      transition: "all 0.15s ease", display: "flex", flexDirection: "row",
      alignItems: "center", justifyContent: "space-between", gap: 0.5,
      ...(tieneHorasMedias && esInicio && { borderLeft: "3px solid rgba(255,255,255,0.6)" }),
    }}>
      {esInicio && (
        <>
          <Typography sx={{
            fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0,
          }}>
            {reserva.meeting_title || "Sin título"}
          </Typography>
          {esVigente && (
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              backgroundColor: "rgba(255,255,255,0.25)", borderRadius: "12px",
              px: 0.75, py: 0.25, flexShrink: 0,
            }}>
              <Box component="span" sx={{
                width: 6, height: 6, borderRadius: "50%",
                border: "1.5px solid #ffffff", display: "inline-block",
              }} />
              <Typography sx={{ fontSize: "0.55rem", fontWeight: 600, color: "#ffffff" }}>
                Vigente
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export const CeldaHora: React.FC<{
  dia: Date; hora: string; diaIdx: number; hoy: Date;
  reservasEnCelda: ReservaEnCelda[];
  salaSeleccionada: string;
  onNuevaReserva?: (fecha?: string, sala?: string, hora?: string) => void;
  onClickReserva: (e: React.MouseEvent<HTMLElement>, r: Reserva) => void;
}> = ({ dia, hora, diaIdx, hoy, reservasEnCelda, salaSeleccionada, onNuevaReserva, onClickReserva }) => {
  const esHoy = isSameDay(dia, hoy);
  const fechaStr = format(dia, "yyyy-MM-dd");
  const [h] = hora.split(":");
  const horaCompleta = formatearHora12h(hora);
  const horaMedia = formatearHora12h(`${h}:30`);
  const zonaSuperiorOcupada = reservasEnCelda.some(({ posicion }) => posicion.top < 30 && posicion.top + posicion.height > 0);
  const zonaInferiorOcupada = reservasEnCelda.some(({ posicion }) => posicion.top < 60 && posicion.top + posicion.height > 30);

  return (
    <Box sx={{
      position: "relative", borderRight: diaIdx < 4 ? "1px solid #e0e0e0" : "none",
      borderBottom: "1px solid #e0e0e0", backgroundColor: esHoy ? "#FAFBFF" : "transparent",
      height: 60, boxSizing: "border-box",
    }}>
      <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", borderTop: "1px dashed #d0d0d0", pointerEvents: "none", zIndex: 0 }} />

      {!zonaSuperiorOcupada && (
        <Box onClick={() => onNuevaReserva?.(fechaStr, salaSeleccionada, hora)} sx={{ ...HOVER_ZONE_SX, top: 0 }}>
          <HoverIndicator label={horaCompleta} />
        </Box>
      )}
      {!zonaInferiorOcupada && (
        <Box onClick={() => onNuevaReserva?.(fechaStr, salaSeleccionada, `${h}:30`)} sx={{ ...HOVER_ZONE_SX, top: 30 }}>
          <HoverIndicator label={horaMedia} />
        </Box>
      )}

      {reservasEnCelda.map(({ reserva, esInicio, esFin, posicion }) => (
        <BloqueReserva
          key={`${reserva.id}-${hora}`}
          reserva={reserva} hora={hora} esInicio={esInicio} esFin={esFin}
          posicion={posicion} onClick={onClickReserva}
        />
      ))}
    </Box>
  );
};

// ─── Popover detalle ──────────────────────────────────────────────────────────

const DetalleItem: React.FC<{
  icon: React.ReactNode; children: React.ReactNode;
  alignItems?: string; sx?: object;
}> = ({ icon, children, alignItems = "center", sx = {} }) => (
  <Box sx={{ display: "flex", alignItems, gap: 1.5, mb: 1.5, ...sx }}>
    {icon}{children}
  </Box>
);

export const PopoverDetalleReserva: React.FC<{
  anchorEl: HTMLElement | null;
  reservaSeleccionada: Reserva | null;
  usuarioActualId?: string;
  onClose: () => void;
  onEditar?: (r: Reserva) => void;
  onCancelar?: (r: Reserva) => void;
}> = ({ anchorEl, reservaSeleccionada, usuarioActualId, onClose, onEditar, onCancelar }) => {
  if (!reservaSeleccionada) return null;
  const colorReserva = getReservaColor(reservaSeleccionada.id);
  const estado = reservaSeleccionada.estadoCalculado || reservaSeleccionada.status;
  const puedeMod = puedeModificar(reservaSeleccionada, usuarioActualId);

  return (
    <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose} disableScrollLock
      anchorOrigin={{ vertical: "center", horizontal: "right" }}
      transformOrigin={{ vertical: "center", horizontal: "left" }}
      PaperProps={{ sx: { width: 340, maxHeight: 450, borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" } }}>

      <Box sx={{ p: 2, backgroundColor: colorReserva, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, pr: 1 }}>
          <Typography variant="subtitle1" sx={{
            fontWeight: 600, color: "#ffffff", overflow: "hidden",
            textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {reservaSeleccionada.meeting_title || "Sin título"}
          </Typography>
          <Chip label={estado} size="small" sx={{ mt: 0.5, backgroundColor: "rgba(255,255,255,0.25)", color: "#ffffff", fontWeight: 600, fontSize: "0.7rem", height: 20 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {puedeMod && (
            <>
              {onEditar && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => { onClose(); onEditar(reservaSeleccionada); }} sx={{ color: "#ffffff" }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onCancelar && (
                <Tooltip title="Cancelar">
                  <IconButton size="small" onClick={() => { onClose(); onCancelar(reservaSeleccionada); }} sx={{ color: "#ffffff" }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "#ffffff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <DetalleItem icon={<TimeIcon sx={{ color: "#6b7280", fontSize: 20 }} />}>
          <Typography variant="body2">
            {reservaSeleccionada.start_time.substring(0, 5)} – {reservaSeleccionada.end_time.substring(0, 5)}
          </Typography>
        </DetalleItem>
        <DetalleItem icon={<RoomIcon sx={{ color: "#6b7280", fontSize: 20 }} />}>
          <Typography variant="body2">{reservaSeleccionada.room_name}</Typography>
        </DetalleItem>
        {reservaSeleccionada.user_id && (
          <DetalleItem icon={<PersonIcon sx={{ color: "#6b7280", fontSize: 20 }} />}>
            <Typography variant="body2">
              {reservaSeleccionada.user_id.first_name} {reservaSeleccionada.user_id.last_name}
            </Typography>
          </DetalleItem>
        )}
        {reservaSeleccionada.departament && (
          <DetalleItem icon={<AreaIcon sx={{ color: "#6b7280", fontSize: 20 }} />}>
            <Typography variant="body2">{capitalize(reservaSeleccionada.departament)}</Typography>
          </DetalleItem>
        )}
        {reservaSeleccionada.observations && (
          <DetalleItem icon={<NotesIcon sx={{ color: "#6b7280", fontSize: 20, mt: 0.25 }} />}
            alignItems="flex-start" sx={{ mb: 0, mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
            <Typography variant="body2" sx={{ color: "#374151", whiteSpace: "pre-wrap" }}>
              {reservaSeleccionada.observations}
            </Typography>
          </DetalleItem>
        )}
      </Box>
    </Popover>
  );
};