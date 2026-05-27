/**
 * Componentes de estado de IA
 * Incluye: IAStatusBadge, ProveedorProcesamiento
 * Módulo de Contabilización de Facturas
 */

import { Box, Typography, Tooltip } from "@mui/material";
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import Warning from '@mui/icons-material/Warning';

// ============ IA STATUS BADGE ============

interface IAStatusBadgeProps {
  geminiApiKeyConfigured: boolean;
  modeloIA?: string; // Modelo de IA configurado en Directus
  className?: string; // Para tours interactivos
}

/**
 * Componente discreto que muestra el estado de conexión de Gemini
 * Diseño compacto y minimalista
 */
export function IAStatusBadge({
  geminiApiKeyConfigured,
  modeloIA,
  className,
}: IAStatusBadgeProps) {
  const geminiStatus = geminiApiKeyConfigured ? "connected" : "error";

  return (
    <Box
      className={className}
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
    </Box>
  );
}

// ============ PROVEEDOR PROCESAMIENTO ============

interface ProveedorProcesamientoProps {
  proveedor: "gemini";
  modelo?: string | null; // Nombre del modelo usado
}

/**
 * Componente discreto que muestra qué modelo procesó la factura con Gemini
 */
export function ProviderProcessing({
  proveedor,
  modelo,
}: ProveedorProcesamientoProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.25,
        px: 0.75,
        backgroundColor: "#e8f5e9",
        borderRadius: 0.5,
        mt: 0.5,
      }}
    >
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: "#4caf50",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          color: "#2e7d32",
          fontSize: "0.65rem",
          fontWeight: 500,
        }}
      >
        Google Gemini
        {modelo && (
          <Box component="span" sx={{ opacity: 0.8, ml: 0.5 }}>
            • {modelo}
          </Box>
        )}
      </Typography>
    </Box>
  );
}
