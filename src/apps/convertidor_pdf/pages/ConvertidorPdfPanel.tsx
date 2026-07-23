import React, { useState } from "react";
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
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";

// Configurar el worker de pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ParsedTransaction {
  dia: string;
  transaccion: string;
  ident: string;
  debitos: number;
  creditos: number;
  saldo: number;
}

interface PageText {
  pageNumber: number;
  text: string;
  lines: string[];
  transactions: ParsedTransaction[];
}

export const ConvertidorPdfPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [password, setPassword] = useState<string>("");
  const [openPasswordDialog, setOpenPasswordDialog] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [numPagesTotal, setNumPagesTotal] = useState<number>(0);
  const [startPage, setStartPage] = useState<number>(2);
  const [endPageInput, setEndPageInput] = useState<number>(3);
  
  const [extractedPages, setExtractedPages] = useState<PageText[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setErrorMsg("");
    setExtractedPages([]);
    setPassword("");
    setPasswordError("");

    try {
      const buffer = await selectedFile.arrayBuffer();
      setFileBuffer(buffer);
      await checkPdfPassword(buffer, "");
    } catch (err: any) {
      console.error("Error al cargar PDF:", err);
    }
  };

  const checkPdfPassword = async (buffer: ArrayBuffer, pass: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: buffer.slice(0),
        password: pass,
      });

      loadingTask.onPassword = (updatePassword: (p: string) => void, reason: number) => {
        setOpenPasswordDialog(true);
        if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
          setPasswordError("La contraseña ingresada es incorrecta. Intenta nuevamente.");
        }
      };

      const pdf = await loadingTask.promise;
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(pdf.numPages);
      if (endPageInput === 3 && pdf.numPages > 0) {
        setEndPageInput(Math.min(500, pdf.numPages));
      }
    } catch (err: any) {
      if (err.name === "PasswordException") {
        setOpenPasswordDialog(true);
      }
    }
  };

  const parseNumber = (valStr: string): number => {
    if (!valStr) return 0;
    const clean = valStr.replace(/,/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const processPdf = async (buffer: ArrayBuffer, pass: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: buffer.slice(0),
        password: pass,
      });

      loadingTask.onPassword = (updatePassword: (p: string) => void, reason: number) => {
        setOpenPasswordDialog(true);
        if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
          setPasswordError("La contraseña ingresada es incorrecta. Intenta nuevamente.");
        }
      };

      const pdf = await loadingTask.promise;
      setOpenPasswordDialog(false);
      setPasswordError("");
      setNumPagesTotal(pdf.numPages);

      const targetEndPage = endPageInput || pdf.numPages;
      const endPage = Math.min(Math.max(startPage, targetEndPage), pdf.numPages);
      const results: PageText[] = [];

      for (let i = startPage; i <= endPage; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const lineMap: { [y: number]: any[] } = {};
        for (const item of textContent.items as any[]) {
          if (!item.str || !item.str.trim()) continue;
          const y = Math.round(item.transform[5]);
          if (!lineMap[y]) lineMap[y] = [];
          lineMap[y].push({
            x: item.transform[4],
            str: item.str.trim(),
          });
        }

        const sortedY = Object.keys(lineMap)
          .map(Number)
          .sort((a, b) => b - a);

        const pageLines: string[] = [];
        const pageTransactions: ParsedTransaction[] = [];
        let stopProcessing = false;

        for (const y of sortedY) {
          const itemsInLine = lineMap[y].sort((a, b) => a.x - b.x);
          const fullLineText = itemsInLine.map((it) => it.str).join(" ");

          // DETECTOR DE FIN DE TABLA PRINCIPAL
          if (
            fullLineText.includes("Nota Débito/Crédito") ||
            (fullLineText.includes("Hemos Debitado a su cuenta") && !fullLineText.includes("VENTA POS")) ||
            fullLineText.includes("CODIGO ESTABLECIMIENTO :")
          ) {
            stopProcessing = true;
            break;
          }

          // Filtrar pies de página e info legal
          if (
            fullLineText.includes("En caso de mora") ||
            fullLineText.includes("permanencia del reporte negativo") ||
            fullLineText.includes("ESTE PRODUCTO CUENTA CON SEGURO DE DEPÓSITOS") ||
            fullLineText.includes("Revisoría Fiscal KPMG") ||
            fullLineText.includes("Consultas y trámite de requerimientos") ||
            fullLineText.includes("Defensor del Consumidor Financiero") ||
            fullLineText.startsWith("Hoja ") ||
            fullLineText.includes("Extracto - CUENTA CORRIENTE") ||
            fullLineText.includes("FECHA DE CORTE:") ||
            fullLineText.includes("DIA TRANSACCIÓN") ||
            fullLineText.includes("IDENT. DEBITOS") ||
            fullLineText.includes("TASA SOBREGIRO") ||
            fullLineText.includes("Tasa de Interés")
          ) {
            continue;
          }

          pageLines.push(fullLineText);

          const tokens = itemsInLine.map((it) => it.str);
          if (tokens.length >= 4) {
            const firstToken = tokens[0];
            if (/^\d{2}$/.test(firstToken)) {
              const dia = firstToken;
              const lastToken = tokens[tokens.length - 1];
              const secondLastToken = tokens[tokens.length - 2];
              const thirdLastToken = tokens[tokens.length - 3];
              const fourthLastToken = tokens[tokens.length - 4];

              if (/^[\d,]+\.\d{2}$/.test(lastToken) && /^[\d,]+\.\d{2}$/.test(secondLastToken) && /^[\d,]+\.\d{2}$/.test(thirdLastToken)) {
                const ident = /^[A-Z0-9]+$/i.test(fourthLastToken) ? fourthLastToken : "";
                const descTokens = tokens.slice(1, ident ? tokens.length - 4 : tokens.length - 3);
                const transaccion = descTokens.join(" ");

                pageTransactions.push({
                  dia,
                  transaccion,
                  ident,
                  debitos: parseNumber(thirdLastToken),
                  creditos: parseNumber(secondLastToken),
                  saldo: parseNumber(lastToken),
                });
              }
            }
          }
        }

        if (pageTransactions.length > 0 || pageLines.length > 0) {
          results.push({
            pageNumber: i,
            text: pageLines.join("\n"),
            lines: pageLines,
            transactions: pageTransactions,
          });
        }

        if (stopProcessing) {
          console.log(`Fin de la tabla de transacciones detectado en la página ${i}. Deteniendo lectura.`);
          break;
        }
      }

      setExtractedPages(results);
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

  const handlePasswordSubmit = () => {
    if (!fileBuffer) return;
    checkPdfPassword(fileBuffer, password);
  };

  const handleExportToExcel = () => {
    if (extractedPages.length === 0) return;

    const allTransactions = extractedPages.flatMap((p) =>
      p.transactions.map((tx) => ({
        "Página PDF": p.pageNumber,
        "DÍA": tx.dia,
        "TRANSACCIÓN": tx.transaccion,
        "IDENT.": tx.ident,
        "DEBITOS": tx.debitos,
        "CREDITOS": tx.creditos,
        "SALDO": tx.saldo,
      }))
    );

    const excelData =
      allTransactions.length > 0
        ? allTransactions
        : extractedPages.flatMap((p) =>
            p.lines.map((line, idx) => ({
              "Página": p.pageNumber,
              "N° Línea": idx + 1,
              "Contenido": line,
            }))
          );

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extracto Bancario");

    const fileName = file ? `${file.name.replace(".pdf", "")}_convertido.xlsx` : "extracto_contable.xlsx";
    XLSX.writeFile(workbook, fileName);
  };

  const handleCopyText = () => {
    const allText = extractedPages
      .map((p) => `--- PÁGINA ${p.pageNumber} ---\n${p.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          backgroundColor: "white",
          border: "1px solid #e8eaed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PictureAsPdfIcon sx={{ color: "#d32f2f", fontSize: 32 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1a2a3a" }}>
                Convertidor de Extractos PDF a Excel
              </Typography>
              <Chip label="CONTABILIDAD" color="primary" size="small" sx={{ fontWeight: "bold" }} />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Sube tus extractos bancarios en PDF con contraseña, extrae únicamente la tabla de movimientos y expórtala a Excel.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Control Panel */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e8eaed" }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<DescriptionIcon />}
              fullWidth
              size="large"
              sx={{ py: 1.5, borderStyle: "dashed" }}
            >
              {file ? `Archivo: ${file.name}` : "Seleccionar PDF de extracto bancario..."}
              <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="Página Inicial"
              type="number"
              value={startPage}
              onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
              fullWidth
              size="small"
              helperText="Ej. 2 (ignora pág 1)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              label="Página Final"
              type="number"
              value={endPageInput}
              onChange={(e) => setEndPageInput(Math.max(1, parseInt(e.target.value) || 1))}
              fullWidth
              size="small"
              helperText={numPagesTotal ? `Total PDF: ${numPagesTotal}` : "Ej. 500"}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              disabled={!fileBuffer || loading}
              onClick={() => fileBuffer && processPdf(fileBuffer, password)}
              fullWidth
              size="large"
              sx={{ backgroundColor: "#004680" }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Convertir PDF"}
            </Button>
          </Grid>
        </Grid>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMsg}
          </Alert>
        )}
      </Paper>

      {/* Resultados de Extracción */}
      {extractedPages.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e8eaed" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Movimientos Procesados ({extractedPages.reduce((acc, p) => acc + p.transactions.length, 0)} registros)
              </Typography>
              <Chip label={`Páginas procesadas: ${extractedPages.length}`} color="info" variant="outlined" size="small" />
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title={copySuccess ? "¡Copiado!" : "Copiar texto plano"}>
                <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyText}>
                  {copySuccess ? "¡Copiado!" : "Copiar Texto"}
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                color="success"
                startIcon={<TableChartIcon />}
                onClick={handleExportToExcel}
              >
                Descargar Excel (.xlsx)
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={3}>
            {extractedPages.map((page) => (
              <Box key={page.pageNumber}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#004680", mb: 1 }}>
                  📄 PÁGINA {page.pageNumber} ({page.transactions.length} transacciones)
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: "#1e1e1e",
                    color: "#00ff66",
                    fontFamily: "monospace",
                    fontSize: 13,
                    maxHeight: 350,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {page.text || "(Página sin movimientos reconocibles)"}
                </Paper>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Modal para solicitar contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockIcon color="warning" /> PDF Protegido con Contraseña
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
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
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePasswordSubmit();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handlePasswordSubmit}>
            Desbloquear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvertidorPdfPanel;
