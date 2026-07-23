import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";

import { usePdfConverter } from "../hooks/usePdfConverter";
import { PdfHeaderConfig } from "../components/PdfHeaderConfig";
import {
  PdfDropzone,
  PdfUnlockedCard,
  PdfResultsCard,
  PdfPasswordDialog,
} from "../components/PdfConverterViews";

const AZUL_PRIMARIO = "#004680";

export const ConvertidorPdfPanel: React.FC = () => {
  const {
    file,
    password,
    setPassword,
    openPasswordDialog,
    passwordError,
    showPassword,
    setShowPassword,
    loading,
    numPagesTotal,
    suggestedEndPage,
    isPasswordValidated,
    startPage,
    setStartPage,
    endPageInput,
    setEndPageInput,
    setEndPageTouched,
    extractedPages,
    setExtractedPages,
    errorMsg,
    isDragging,
    totalMovimientos,
    hayResultados,
    parsePageNumber,
    handleClosePasswordDialog,
    handleFileChange,
    handlePasswordSubmit,
    handleConvert,
    handleExportToExcel,
  } = usePdfConverter();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      {/* Overlay de Drag & Drop */}
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

      {/* Cabecera y Configuración de Rangos */}
      <PdfHeaderConfig
        file={file}
        startPage={startPage}
        setStartPage={setStartPage}
        endPageInput={endPageInput}
        setEndPageInput={setEndPageInput}
        setEndPageTouched={setEndPageTouched}
        suggestedEndPage={suggestedEndPage}
        numPagesTotal={numPagesTotal}
        errorMsg={errorMsg}
        parsePageNumber={parsePageNumber}
        handleFileChange={handleFileChange}
      />

      {/* Estado A: Carga inicial de archivo */}
      {!file && !hayResultados && (
        <PdfDropzone handleFileChange={handleFileChange} />
      )}

      {/* Estado B: Documento verificado y listo */}
      {file && isPasswordValidated && !hayResultados && (
        <PdfUnlockedCard
          fileName={file.name}
          numPagesTotal={numPagesTotal}
          suggestedEndPage={suggestedEndPage}
          startPage={startPage}
          endPageInput={endPageInput}
          loading={loading}
          handleConvert={handleConvert}
        />
      )}

      {/* Estado C: Resultados y Descarga de Excel */}
      {hayResultados && (
        <PdfResultsCard
          totalMovimientos={totalMovimientos}
          extractedPagesCount={extractedPages.length}
          onResetResults={() => setExtractedPages([])}
          handleExportToExcel={handleExportToExcel}
        />
      )}

      {/* Modal de Contraseña */}
      <PdfPasswordDialog
        open={openPasswordDialog}
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        loading={loading}
        handleClosePasswordDialog={handleClosePasswordDialog}
        handlePasswordSubmit={handlePasswordSubmit}
      />
    </Box>
  );
};

export default ConvertidorPdfPanel;