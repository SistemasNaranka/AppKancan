import React, { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useContractContext } from "../contexts/ContractContext";
import {
  addMonths,
  formatDate,
  getNextProrrogaNumber,
  getProrrogaDuration,
} from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ProrrogaForm
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  contractId: number;
  open: boolean;
  onClose: () => void;
}

const ProrrogaForm: React.FC<Props> = ({ contractId, open, onClose }) => {
  const { contratos, addProrroga, saving, successMsg, error, clearMessages } =
    useContractContext();

  const contract = contratos.find((c) => c.id === Number(contractId));

  const [fechaInicio, setFechaInicio] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const nextNum = useMemo(
    () => (contract ? getNextProrrogaNumber(contract.prorrogas) : 0),
    [contract],
  );

  const duracion = getProrrogaDuration(nextNum);

  const defaultStart = useMemo(() => {
    if (!contract) return "";
    const last = contract.prorrogas[contract.prorrogas.length - 1];
    const d = new Date(last.fecha_fin);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, [contract]);

  const fechaFin = fechaInicio ? addMonths(fechaInicio, duracion) : null;

  const handleOpen = () => {
    setFechaInicio(defaultStart);
    setDescripcion("");
    clearMessages();
  };

  const handleSubmit = async () => {
    if (!fechaInicio) return;
    await addProrroga({
      contractId: Number(contractId),
      fechaInicio,
      descripcion: descripcion || undefined,
    });
  };

  const handleClose = () => {
    clearMessages();
    onClose();
  };

  if (!contract) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEntered: handleOpen }}
    >
      <Box sx={{ display: "flex", minHeight: 480 }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 190,
            background: "linear-gradient(160deg, #004680, #002d54)",
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0,
            borderRadius: "18px 0 0 18px",
          }}
        >
          <Box>
            <AssignmentOutlinedIcon
              sx={{ color: "rgba(255,255,255,0.7)", fontSize: 30, mb: 2 }}
            />
            <Typography
              variant="subtitle1"
              sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.3, mb: 0.5 }}
            >
              {contract.empleado_nombre}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#7fb8e8", display: "block", mb: 2 }}
            >
              {contract.id}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#a0c8e8", lineHeight: 1.7, display: "block" }}
            >
              Registro de nueva extensión contractual bajo normativa vigente
              v1.0.
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "#4a7fa8" }}>
            EL ARCHIVERO DIGITAL
          </Typography>
        </Box>

        {/* Form */}
        <DialogContent sx={{ p: 3, flex: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={0.5}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: "primary.main" }}
              >
                Nueva Prórroga
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete los detalles para extender la vigencia del contrato.
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "text.disabled" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2.5}>
            {/* Número de prórroga (locked) */}
            <Box>
              <Typography variant="overline" display="block" mb={0.8}>
                Número de Prórroga
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.2,
                  bgcolor: "rgba(0,70,128,0.06)",
                  border: "1.5px solid",
                  borderColor: "rgba(0,70,128,0.2)",
                  borderRadius: 2.5,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="primary.main"
                >
                  {nextNum === 0 ? "Contrato Inicial" : `Prórroga ${nextNum}`}
                </Typography>
                <LockOutlinedIcon
                  sx={{ fontSize: 15, color: "text.disabled", ml: "auto" }}
                />
              </Box>
            </Box>

            {/* Fecha de inicio */}
            <Box>
              <Typography variant="overline" display="block" mb={0.8}>
                Fecha de Inicio
              </Typography>
              <TextField
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Descripción */}
            <Box>
              <Typography variant="overline" display="block" mb={0.8}>
                Descripción (Opcional)
              </Typography>
              <TextField
                multiline
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Consolidación de objetivos Q2..."
                fullWidth
                size="small"
              />
            </Box>

            {/* Cálculo automático */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#f0f6ff",
                border: "1.5px solid",
                borderColor: "rgba(0,70,128,0.2)",
                borderRadius: 2.5,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.8} mb={1}>
                <InfoOutlinedIcon
                  sx={{ fontSize: 15, color: "primary.main" }}
                />
                <Typography variant="overline" sx={{ color: "primary.main" }}>
                  Cálculo de Vigencia
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                  >
                    Duración: {duracion} meses
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {nextNum >= 4
                      ? "Prórroga 4 o superior"
                      : `Prórroga ${nextNum} (≤ 3)`}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="overline" display="block">
                    Fecha de fin estimada
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color="primary.main"
                  >
                    {fechaFin ? formatDate(fechaFin) : "— / — / ——"}
                  </Typography>
                </Box>
              </Stack>
              {nextNum >= 4 && (
                <Chip
                  label="Renovación Anual — Planta"
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: "primary.main",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                  }}
                />
              )}
            </Box>

            {/* Feedback */}
            {successMsg && (
              <Alert severity="success" onClose={clearMessages}>
                {successMsg}
              </Alert>
            )}
            {error && (
              <Alert severity="error" onClose={clearMessages}>
                {error}
              </Alert>
            )}

            {/* Actions */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              pt={0.5}
            >
              <Button
                variant="text"
                onClick={handleClose}
                color="inherit"
                sx={{ color: "text.secondary" }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                disabled={!fechaInicio || saving}
                onClick={handleSubmit}
                startIcon={
                  saving ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : undefined
                }
                sx={{ minWidth: 120 }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default ProrrogaForm;
