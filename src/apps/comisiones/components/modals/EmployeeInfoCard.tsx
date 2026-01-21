import React from "react";
import { Box, Typography, Chip, useTheme, alpha } from "@mui/material";
import { CheckCircle, Warning, Badge } from "@mui/icons-material";
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
        height: "56px",
        backgroundColor: hasEmployeeInfo
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.warning.main, 0.1),
        border: `1px solid ${
          hasEmployeeInfo
            ? theme.palette.success.main
            : theme.palette.warning.main
        }`,
        borderRadius: 2,
        p: 1.5, // Más padding para aprovechar mejor el espacio
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {hasEmployeeInfo ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            width: "100%",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <CheckCircle
            sx={{
              color: theme.palette.success.main,
              fontSize: 20,
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.success.dark,
                fontSize: "1rem",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {empleadoEncontrado.nombre || `Empleado ${empleadoEncontrado.id}`}
            </Typography>
            <Chip
              icon={<Badge sx={{ fontSize: 14 }} />}
              label={`Cod. ${empleadoEncontrado.id}`}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.success.main, 0.15),
                color: theme.palette.success.dark,
                fontWeight: 600,
                height: 20,
                "& .MuiChip-icon": {
                  color: theme.palette.success.main,
                  fontSize: 14,
                },
                "& .MuiChip-label": {
                  px: 0.75,
                  fontSize: "0.7rem",
                  lineHeight: 1,
                },
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            width: "100%",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <Warning
            sx={{
              color: theme.palette.warning.main,
              fontSize: 20,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.warning.dark,
              fontWeight: 600,
              fontSize: "1.1rem", // Letra más grande
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Código {codigoInput} no encontrado
          </Typography>
        </Box>
      )}
    </Box>
  );
};
