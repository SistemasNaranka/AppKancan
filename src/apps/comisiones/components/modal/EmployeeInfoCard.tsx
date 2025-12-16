import React from "react";
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { CheckCircle, Warning } from "@mui/icons-material";
import { DirectusAsesor } from "../../types/modal";

interface EmployeeInfoCardProps {
  codigoInput: string;
  empleadoEncontrado: DirectusAsesor | null;
  loading?: boolean;
  isMobile?: boolean;
}

export const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({
  codigoInput,
  empleadoEncontrado,
  loading = false,
  isMobile = false,
}) => {
  const theme = useTheme();

  const hasEmployeeInfo = codigoInput.trim() && empleadoEncontrado;
  const hasNoEmployee = codigoInput.trim() && !empleadoEncontrado;

  // Don't show anything if no code is entered or if still loading
  if (!codigoInput.trim() || loading) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: hasEmployeeInfo
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.warning.main, 0.1),
        border: `1px solid ${
          hasEmployeeInfo ? theme.palette.success.main : theme.palette.warning.main
        }`,
        borderRadius: 2,
        p: 1.5,
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {hasEmployeeInfo ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <CheckCircle
            sx={{
              color: theme.palette.success.main,
              fontSize: 18,
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.success.dark,
                fontSize: '0.8125rem',
                lineHeight: 1.2,
              }}
            >
              {empleadoEncontrado.nombre || `Empleado ${empleadoEncontrado.id}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
              <Chip
                label={`ID: ${empleadoEncontrado.id}`}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.dark,
                  fontWeight: 500,
                  height: 20,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.6875rem',
                    lineHeight: 1,
                  },
                }}
              />
              <Chip
                label={
                  typeof empleadoEncontrado.tienda_id === "object"
                    ? empleadoEncontrado.tienda_id.nombre
                    : empleadoEncontrado.tienda_id
                }
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.dark,
                  fontWeight: 500,
                  height: 20,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.6875rem',
                    lineHeight: 1,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Warning
            sx={{
              color: theme.palette.warning.main,
              fontSize: 18,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.warning.dark,
              fontWeight: 500,
              fontSize: '0.8125rem',
              lineHeight: 1.2,
            }}
          >
            Código {codigoInput} no encontrado
          </Typography>
        </Box>
      )}
    </Box>
  );
};