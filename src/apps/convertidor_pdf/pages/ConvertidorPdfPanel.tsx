import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import {
  checkPdfPassword,
  extractTransactionsFromPdf,
  type PageText,
} from "../services/pdfExtractor";
import { exportPagesToExcel } from "../services/excelExporter";

const AZUL_PRIMARIO = "#004680";

export const ConvertidorPdfPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [password, setPassword] = useState<string>("");
  const [openPasswordDialog, setOpenPasswordDialog] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [numPagesTotal, setNumPagesTotal] = useState<number>(0);
  const [startPage, setStartPage] = useState<string>("2");
  const [endPageInput, setEndPageInput] = useState<string>("3");
  const [endPageTouched, setEndPageTouched] = useState<boolean>(false);

  const [extractedPages, setExtractedPages] = useState<PageText[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef(0);

  const parsePageNumber = (value: string, fallback: number = 1): number => {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 1 ? fallback : num;
  };

  const handlePasswordRequired = (isIncorrect: boolean) => {
    setOpenPasswordDialog(true);
    if (isIncorrect) {
      setPasswordError("La contraseña ingresada es incorrecta. Intenta nuevamente.");
    }
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordError("");
    setPassword("");
    setShowPassword(false);
    setLoading(false);
  };

  const processSelectedFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setErrorMsg("El archivo debe ser un PDF.");
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
    setExtractedPages([]);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);

    try {
      const buffer = await selectedFile.arrayBuffer();
      setFileBuffer(buffer);
      const result = await checkPdfPassword(buffer, "", handlePasswordRequired);
      if (result) {
        setOpenPasswordDialog(false);
        setPasswordError("");
        setNumPagesTotal(result.numPages);
        if (!endPageTouched && result.numPages > 0) {
          setEndPageInput(String(Math.min(500, result.numPages)));
        }
      }
    } catch (err: any) {
      console.error("Error al cargar PDF:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processSelectedFile(e.target.files[0]);
    // Reset del input para permitir volver a cargar el mismo archivo
    e.target.value = "";
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processSelectedFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handlePasswordSubmit = async () => {
    if (!fileBuffer) return;
    const result = await checkPdfPassword(fileBuffer, password, handlePasswordRequired);
    if (result) {
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(result.numPages);
      if (!endPageTouched && result.numPages > 0) {
        setEndPageInput(String(Math.min(500, result.numPages)));
      }
    }
  };

  const handleConvert = async () => {
    if (!fileBuffer) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { pages, numPagesTotal: total } = await extractTransactionsFromPdf({
        buffer: fileBuffer,
        password,
        startPage: parsePageNumber(startPage, 1),
        endPage: parsePageNumber(endPageInput, 1),
        onPasswordRequired: handlePasswordRequired,
      });
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(total);
      setExtractedPages(pages);
    } catch (err: any) {
      if (err.name === "PasswordException") {
        setOpenPasswordDialog(true);
      } else {
        console.error(err);
        setErrorMsg(`Error procesando el PDF: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    const fileName = file
      ? `${file.name.replace(".pdf", "")}_convertido.xlsx`
      : "extracto_contable.xlsx";
    await exportPagesToExcel({ pages: extractedPages, fileName });
  };

  // Total de movimientos (único dato que mostramos en el estado de éxito)
  const totalMovimientos = extractedPages.reduce(
    (acc, p) => acc + p.transactions.length,
    0
  );
  const hayResultados = extractedPages.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      {isDragging && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 70, 128, 0.15)",
            border: `4px dashed ${AZUL_PRIMARIO}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <Paper
            elevation={8}
            sx={{
              px: 5,
              py: 4,
              borderRadius: 3,
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <DescriptionIcon sx={{ fontSize: 48, color: AZUL_PRIMARIO }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: AZUL_PRIMARIO }}>
              Suelta el PDF aquí
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Card principal fusionado */}
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, border: "1px solid #e8eaed" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PictureAsPdfIcon sx={{ color: "#d32f2f", fontSize: 30 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a2a3a" }}>
              Convertidor de Extractos
            </Typography>
          </Box>

          {file && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#e6f4ea",
                border: "1px solid #b7e0c2",
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 18, color: "#15803d" }} />
              <Typography sx={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
                {file.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7280", mx: 0.5 }}>·</Typography>
              <Button
                component="label"
                sx={{
                  fontSize: 12,
                  color: AZUL_PRIMARIO,
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  textDecoration: "underline",
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                }}
              >
                cambiar
                <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={2} alignItems="end">
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="Página Inicial"
              type="number"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              onBlur={() => setStartPage(String(parsePageNumber(startPage, 1)))}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="Página Final"
              type="number"
              value={endPageInput}
              onChange={(e) => {
                setEndPageInput(e.target.value);
                setEndPageTouched(true);
              }}
              onBlur={() => {
                const fallback = numPagesTotal > 0 ? numPagesTotal : 1;
                setEndPageInput(String(parsePageNumber(endPageInput, fallback)));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>

          {file && (
            <Grid size={{ xs: 12, md: 8 }}>
              <Button
                variant="contained"
                disabled={!fileBuffer || loading}
                onClick={handleConvert}
                fullWidth
                size="large"
                sx={{ backgroundColor: AZUL_PRIMARIO, height: 40 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Convertir PDF"}
              </Button>
            </Grid>
          )}
        </Grid>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMsg}
          </Alert>
        )}
      </Paper>

      {/* Estado vacío: dropzone grande */}
      {!file && !hayResultados && (
        <Paper
          component="label"
          elevation={0}
          sx={{
            display: "block",
            borderRadius: 3,
            border: "2px dashed #b5c2d0",
            backgroundColor: "white",
            p: 6,
            cursor: "pointer",
            textAlign: "center",
            transition: "border-color 0.15s ease",
            "&:hover": {
              borderColor: AZUL_PRIMARIO,
            },
          }}
        >
          <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
          <CloudUploadIcon sx={{ fontSize: 64, color: "#b5c2d0", mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 500, color: "#1a2a3a", mb: 0.5 }}>
            Arrastra tu extracto bancario aquí
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280", mb: 3 }}>
            O haz clic para seleccionarlo. Solo PDF.
          </Typography>

          <Divider sx={{ maxWidth: 480, mx: "auto", mb: 2.5 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              maxWidth: 480,
              mx: "auto",
              gap: 2,
            }}
          >
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
      )}

      {/* Estado de éxito: procesamiento completo */}
      {hayResultados && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            border: "1px solid #e8eaed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
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
            <Typography variant="h6" sx={{ fontWeight: 500, color: "#1a2a3a", mb: 0.5 }}>
              {totalMovimientos.toLocaleString("es-CO")} movimientos procesados
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              Tu Excel está listo para descargar.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<TableChartIcon />}
            onClick={handleExportToExcel}
            sx={{ mt: 1 }}
          >
            Descargar Excel
          </Button>
        </Paper>
      )}

      {/* Modal para solicitar contraseña */}
      <Dialog
        open={openPasswordDialog}
        onClose={handleClosePasswordDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
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
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Contraseña del PDF"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePasswordSubmit();
            }}
            InputProps={{
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
            onClick={handleClosePasswordDialog}
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
            onClick={handlePasswordSubmit}
            sx={{
              backgroundColor: AZUL_PRIMARIO,
              "&:hover": { backgroundColor: "#003560" },
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvertidorPdfPanel;