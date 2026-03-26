import React, { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useContractContext } from "../contexts/ContractContext";

// ─────────────────────────────────────────────────────────────────────────────
// ProrrogaForm - Formulario para actualizar el campo prorroga del contrato
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  contractId: number;
  open: boolean;
  onClose: () => void;
}

const ProrrogaForm: React.FC<Props> = ({ contractId, open, onClose }) => {
  const { contratos } = useContractContext();

  const contract = contratos.find((c) => c.id === Number(contractId));

  const [prorrogaValue, setProrrogaValue] = useState<string>("");
  const [duracion, setDuracion] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (contract) {
      setProrrogaValue(String(contract.prorroga));
      setDuracion(String(contract.duracion));
    }
    setSuccessMsg(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Aquí iría la llamada a la API para actualizar el contrato
      // await actualizarContrato(contractId, { prorroga: prorrogaValue, duracion });

      setSuccessMsg("Información actualizada correctamente.");
    } catch (err) {
      setError("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSuccessMsg(null);
    setError(null);
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
      <Box sx={{ display: "flex", minHeight: 400 }}>
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
              {contract.nombre} {contract.apellido}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#7fb8e8", display: "block", mb: 2 }}
            >
              ID: #{contract.id}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#a0c8e8", lineHeight: 1.7, display: "block" }}
            >
              Actualización de información contractual
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
                Editar Prórroga
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Actualice la información de prórroga del contrato.
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
            {/* Prórroga */}
            <Box>
              <Typography variant="overline" display="block" mb={0.8}>
                Prórroga
              </Typography>
              <TextField
                value={prorrogaValue}
                onChange={(e) => setProrrogaValue(e.target.value)}
                fullWidth
                size="small"
                placeholder="Ej. Sí, No, En proceso"
              />
            </Box>

            {/* Duración */}
            <Box>
              <Typography variant="overline" display="block" mb={0.8}>
                Duración
              </Typography>
              <TextField
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                fullWidth
                size="small"
                placeholder="Ej. 12 meses, 1 año"
              />
            </Box>

            {/* Feedback */}
            {successMsg && (
              <Alert severity="success" onClose={() => setSuccessMsg(null)}>
                {successMsg}
              </Alert>
            )}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
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
                disabled={saving}
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
