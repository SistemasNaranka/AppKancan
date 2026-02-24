/**
 * Componentes de estado de IA
 * Incluye: IAStatusBadge, ProveedorProcesamiento
 * Módulo de Contabilización de Facturas
 */

import { Box, Typography, Tooltip } from "@mui/material";
import { CheckCircle, Error, Warning } from "@mui/icons-material";

// ============ IA STATUS BADGE ============

interface IAStatusBadgeProps {
  geminiApiKeyConfigured: boolean;
  conexionErrorOllama: boolean;
  modelosDisponibles: string[];
  modeloIA?: string; // Modelo de IA configurado en Directus
}

/**
 * Componente discreto que muestra el estado de conexión de Gemini y Ollama
 * Diseño compacto y minimalista
 */
export function IAStatusBadge({
  geminiApiKeyConfigured,
  conexionErrorOllama,
  modelosDisponibles,
  modeloIA,
}: IAStatusBadgeProps) {
  const geminiStatus = geminiApiKeyConfigured ? "connected" : "error";
  const ollamaStatus =
    !conexionErrorOllama && modelosDisponibles.length > 0
      ? "connected"
      : "warning";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 0.5,
        px: 1.5,
        backgroundColor: "#fafafa",
        borderRadius: 1,
        border: "1px solid #eee",
      }}
    >
      {/* Estado Gemini */}
      <Tooltip
        title={
          geminiStatus === "connected"
            ? `Google Gemini configurado${modeloIA ? ` (${modeloIA})` : ""}`
            : "API key de Gemini no configurada"
        }
        arrow
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
          }}
        >
          {geminiStatus === "connected" ? (
            <CheckCircle sx={{ fontSize: 14, color: "#4caf50" }} />
          ) : (
            <Error sx={{ fontSize: 14, color: "#f44336" }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: geminiStatus === "connected" ? "#4caf50" : "#f44336",
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            Gemini
          </Typography>
        </Box>
      </Tooltip>

      {/* Separador compacto */}
      <Box
        sx={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "#ddd",
        }}
      />

      {/* Estado Ollama */}
      <Tooltip
        title={
          ollamaStatus === "connected"
            ? `Ollama disponible (${modelosDisponibles.length} modelos)`
            : "Ollama no disponible - Fallback desactivado"
        }
        arrow
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
          }}
        >
          {ollamaStatus === "connected" ? (
            <CheckCircle sx={{ fontSize: 14, color: "#4caf50" }} />
          ) : (
            <Warning sx={{ fontSize: 14, color: "#ff9800" }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: ollamaStatus === "connected" ? "#4caf50" : "#ff9800",
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            Ollama
          </Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}

// ============ PROVEEDOR PROCESAMIENTO ============

interface ProveedorProcesamientoProps {
  proveedor: "gemini" | "ollama";
  modelo?: string | null; // Nombre del modelo usado
}

/**
 * Componente discreto que muestra qué proveedor y modelo procesó la factura
 */
export function ProveedorProcesamiento({
  proveedor,
  modelo,
}: ProveedorProcesamientoProps) {
  const isGemini = proveedor === "gemini";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.25,
        px: 0.75,
        backgroundColor: isGemini ? "#e8f5e9" : "#fff3e0",
        borderRadius: 0.5,
        mt: 0.5,
      }}
    >
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: isGemini ? "#4caf50" : "#ff9800",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: isGemini ? "#2e7d32" : "#e65100",
          fontSize: "0.65rem",
          fontWeight: 500,
        }}
      >
        {isGemini ? "Google Gemini" : "Ollama (fallback)"}
        {modelo && (
          <Box component="span" sx={{ opacity: 0.8, ml: 0.5 }}>
            • {modelo}
          </Box>
        )}
      </Typography>
    </Box>
  );
}
