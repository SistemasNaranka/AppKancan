import React from "react";
import { Box, Paper, Typography, Button, TextField, Alert, Grid } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const AZUL_PRIMARIO = "#004680";

interface PdfHeaderConfigProps {
  file: File | null;
  startPage: string;
  setStartPage: (val: string) => void;
  endPageInput: string;
  setEndPageInput: (val: string) => void;
  setEndPageTouched: (touched: boolean) => void;
  suggestedEndPage: number;
  numPagesTotal: number;
  errorMsg: string;
  parsePageNumber: (val: string, fallback?: number) => number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const PdfHeaderConfig: React.FC<PdfHeaderConfigProps> = ({
  file,
  startPage,
  setStartPage,
  endPageInput,
  setEndPageInput,
  setEndPageTouched,
  suggestedEndPage,
  numPagesTotal,
  errorMsg,
  parsePageNumber,
  handleFileChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e8eaed" }}>
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
              maxWidth: "100%",
              flexWrap: "wrap",
              boxSizing: "border-box",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 18, color: "#15803d", flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: 13,
                color: "#15803d",
                fontWeight: 500,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                lineHeight: 1.3,
              }}
            >
              {file.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280", mx: 0.5, flexShrink: 0 }}>·</Typography>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                fontSize: 12,
                color: AZUL_PRIMARIO,
                textTransform: "none",
                p: 0,
                minWidth: "auto",
                textDecoration: "underline",
                flexShrink: 0,
                "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
              }}
            >
              cambiar
              <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={2} alignItems="end">
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Página Inicial"
            type="number"
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            onBlur={() => setStartPage(String(parsePageNumber(startPage, 1)))}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { min: 1 } }}
            helperText="Ej. 2 (ignora pág 1)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            slotProps={{ htmlInput: { min: 1 } }}
            helperText={
              suggestedEndPage > 0
                ? `Sugerido: Pág ${suggestedEndPage} (Total: ${numPagesTotal})`
                : numPagesTotal > 0
                ? `Total PDF: ${numPagesTotal}`
                : "Ej. 58"
            }
          />
        </Grid>
      </Grid>

      {errorMsg && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMsg}
        </Alert>
      )}
    </Paper>
  );
};
