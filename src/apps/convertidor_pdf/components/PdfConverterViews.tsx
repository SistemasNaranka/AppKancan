import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import TableChartIcon from "@mui/icons-material/TableChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const AZUL_PRIMARIO = "#004680";

// --- 1. Zona Dropzone (Estado A) ---
interface PdfDropzoneProps {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({ handleFileChange }) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Paper
      elevation={0}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        display: "block",
        borderRadius: 3,
        border: "2px dashed #b5c2d0",
        backgroundColor: "white",
        p: 6,
        cursor: "pointer",
        textAlign: "center",
        transition: "border-color 0.15s ease",
        "&:hover": { borderColor: AZUL_PRIMARIO },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleFileChange}
      />
      <CloudUploadIcon sx={{ fontSize: 64, color: "#b5c2d0", mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 500, color: "#1a2a3a", mb: 0.5 }}>
        Arrastra tu extracto bancario aquí
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#6b7280", mb: 3 }}>
        O haz clic para seleccionarlo. Solo PDF.
      </Typography>

      <Divider sx={{ maxWidth: 480, mx: "auto", mb: 2.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-around", maxWidth: 480, mx: "auto", gap: 2 }}>
        {[
          { num: 1, texto: "Sube el PDF" },
          { num: 2, texto: "Define el rango" },
          { num: 3, texto: "Descarga el Excel" },
        ].map((paso) => (
          <Box key={paso.num} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#e6f1fb",
                color: AZUL_PRIMARIO,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {paso.num}
            </Box>
            <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{paso.texto}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

// --- 2. Tarjeta Documento Verificado / Listo (Estado B) ---
interface PdfUnlockedCardProps {
  fileName: string;
  numPagesTotal: number;
  suggestedEndPage: number;
  startPage: string;
  endPageInput: string;
  loading: boolean;
  handleConvert: () => Promise<void>;
}

export const PdfUnlockedCard: React.FC<PdfUnlockedCardProps> = ({
  fileName,
  numPagesTotal,
  suggestedEndPage,
  startPage,
  endPageInput,
  loading,
  handleConvert,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: "1px solid #b4c6e7",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: "#e0f2fe",
            color: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LockOpenIcon sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b", fontSize: 18 }}>
              Documento listo para convertir
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: "#475569", wordBreak: "break-word" }}>
            Se validó el archivo <strong>{fileName}</strong>. Elige el rango de páginas y haz clic en Convertir PDF.
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Total de páginas del PDF
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5 }}>
              {numPagesTotal} {numPagesTotal === 1 ? "págs" : "páginas"}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Límite de tabla detectado
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: AZUL_PRIMARIO, mt: 0.5 }}>
              Página {suggestedEndPage || numPagesTotal} <Typography component="span" sx={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>(Sugerido)</Typography>
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Rango seleccionado a procesar
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5 }}>
              Pág. {startPage} a {endPageInput}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleConvert}
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <TableChartIcon />}
          sx={{
            backgroundColor: AZUL_PRIMARIO,
            px: 4,
            py: 1.2,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0, 70, 128, 0.2)",
            "&:hover": { backgroundColor: "#003560" },
          }}
        >
          {loading ? "Procesando PDF..." : "Convertir PDF a Excel Ahora"}
        </Button>
      </Box>
    </Paper>
  );
};
// --- 3. Tarjeta de Éxito / Resultados (Estado C) ---
interface PdfResultsCardProps {
  totalMovimientos: number;
  extractedPagesCount: number;
  onResetResults: () => void;
  handleExportToExcel: () => Promise<void>;
}

export const PdfResultsCard: React.FC<PdfResultsCardProps> = ({
  totalMovimientos,
  extractedPagesCount,
  onResetResults,
  handleExportToExcel,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: "1px solid #e8eaed",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#e6f4ea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 36, color: "#15803d" }} />
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a2a3a", mb: 0.5 }}>
          {totalMovimientos.toLocaleString("es-CO")} movimientos procesados
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#6b7280" }}>
          Tu Excel está listo para descargar ({extractedPagesCount} páginas leídas).
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="outlined"
          onClick={onResetResults}
          sx={{ borderColor: "#d1d5db", color: "#374151" }}
        >
          Cambiar rango o procesar de nuevo
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<TableChartIcon />}
          onClick={handleExportToExcel}
          sx={{ fontWeight: 600, px: 3 }}
        >
          Descargar Excel (.xlsx)
        </Button>
      </Box>
    </Paper>
  );
};

// --- 4. Modal de Contraseña ---
interface PdfPasswordDialogProps {
  open: boolean;
  password: string;
  setPassword: (val: string) => void;
  passwordError: string;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  handleClosePasswordDialog: () => void;
  handlePasswordSubmit: () => Promise<void>;
}

export const PdfPasswordDialog: React.FC<PdfPasswordDialogProps> = ({
  open,
  password,
  setPassword,
  passwordError,
  showPassword,
  setShowPassword,
  loading,
  handleClosePasswordDialog,
  handlePasswordSubmit,
}) => {
  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") {
          handleClosePasswordDialog();
        }
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: AZUL_PRIMARIO,
          color: "white",
          fontSize: 16,
          fontWeight: 500,
          py: 2,
          px: 3,
        }}
      >
        PDF Protegido con Contraseña
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: "24px !important" }}>
        <Typography variant="body2" sx={{ mb: 2.5, color: "#6b7280" }}>
          Este extracto requiere una contraseña para abrirse. Digítala a continuación:
        </Typography>
        <TextField
          autoFocus
          label="Contraseña del PDF"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={password}
          error={Boolean(passwordError)}
          helperText={passwordError}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlePasswordSubmit();
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: "1px solid #e8eaed",
          px: 2.5,
          py: 1.75,
          gap: 1,
        }}
      >
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleClosePasswordDialog();
          }}
          variant="outlined"
          sx={{
            color: "#1a2a3a",
            borderColor: "#d1d5db",
            "&:hover": { borderColor: "#9ca3af", backgroundColor: "transparent" },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handlePasswordSubmit}
          sx={{
            backgroundColor: AZUL_PRIMARIO,
            "&:hover": { backgroundColor: "#003560" },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Continuar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
