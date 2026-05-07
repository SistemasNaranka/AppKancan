import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BugReportIcon from '@mui/icons-material/BugReport';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  Chip,
} from "@mui/material";
import { keyframes } from "@mui/system";

// Animación de pulsación para el icono
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

// Animación de flotación
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// Animación de parpadeo
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/**
 * Página que se muestra cuando hay un error crítico en la aplicación
 * Esta página solo se muestra en desarrollo (DEV mode)
 */
export default function ErrorPage({ error }: { error: unknown }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Colores de AppKancan
  const primaryColor = "#3b82f6";
  const errorColor = "#ef4444";
  const warningColor = "#f59e0b";

  // Determinar a dónde redirigir según estado de autenticación
  const returnPath = isAuthenticated ? "/" : "/login";
  const returnLabel = isAuthenticated ? "Volver al Inicio" : "Ir al Login";

  // Extraer el mensaje de error
  const errorMessage =
    error instanceof Error
      ? error.message
      : String(error ?? "Error desconocido");

  // Obtener el stack trace si está disponible
  const stackTrace = error instanceof Error ? error.stack : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background: `radial-gradient(circle, ${alpha(errorColor, 0.05)} 0%, transparent 50%)`,
          animation: `${float} 15s ease-in-out infinite`,
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            textAlign: "center",
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(errorColor, 0.2)}`,
            boxShadow: `0 20px 60px ${alpha(errorColor, 0.15)}`,
          }}
        >
          {/* Etiqueta de desarrollo */}
          <Box sx={{ mb: 3 }}>
            <Chip
              icon={<BugReportIcon sx={{ fontSize: 16 }} />}
              label="Modo Desarrollo"
              size="small"
              sx={{
                backgroundColor: alpha(warningColor, 0.1),
                color: warningColor,
                border: `1px solid ${alpha(warningColor, 0.3)}`,
                fontWeight: 600,
                animation: `${blink} 2s ease-in-out infinite`,
              }}
            />
          </Box>

          {/* Icono de error con animación */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "center",
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${alpha(errorColor, 0.15)}, ${alpha(errorColor, 0.05)})`,
                border: `2px solid ${alpha(errorColor, 0.3)}`,
              }}
            >
              <BugReportIcon
                sx={{
                  fontSize: 50,
                  color: errorColor,
                }}
              />
            </Box>
          </Box>

          {/* Título */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: errorColor,
                mb: 1,
              }}
            >
              Error del Sistema
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "0.875rem",
              }}
            >
              Error de Configuración de Rutas
            </Typography>
          </Box>

          {/* Mensaje de error */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              background: alpha(errorColor, 0.05),
              border: `1px solid ${alpha(errorColor, 0.1)}`,
              textAlign: "left",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: errorColor,
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: errorColor,
                }}
              />
              Mensaje del error:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                color: theme.palette.text.primary,
                fontSize: "0.85rem",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                background: alpha(theme.palette.background.paper, 0.5),
                p: 2,
                borderRadius: 1,
              }}
            >
              {errorMessage}
            </Typography>
          </Box>

          {/* Stack trace (solo en desarrollo) */}
          {stackTrace && (
            <Box
              sx={{
                mb: 4,
                textAlign: "left",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                Stack Trace:
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflow: "auto",
                  p: 2,
                  borderRadius: 2,
                  background:
                    theme.palette.mode === "dark"
                      ? alpha("#1e1e1e", 0.8)
                      : alpha("#f5f5f5", 0.8),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: theme.palette.text.secondary,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {stackTrace}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Botones de acción */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              size={isMobile ? "medium" : "large"}
              onClick={() => navigate(returnPath)}
              startIcon={<HomeIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                background: `linear-gradient(135deg, ${primaryColor}, ${alpha(primaryColor, 0.8)})`,
                boxShadow: `0 4px 14px ${alpha(primaryColor, 0.35)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${alpha(primaryColor, 0.9)}, ${primaryColor})`,
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {returnLabel}
            </Button>

            <Button
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderWidth: 2,
                borderColor: alpha(primaryColor, 0.3),
                color: primaryColor,
                "&:hover": {
                  borderColor: primaryColor,
                  backgroundColor: alpha(primaryColor, 0.05),
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Recargar Página
            </Button>

            <Button
              variant="text"
              size={isMobile ? "medium" : "large"}
              onClick={() => window.history.back()}
              startIcon={<ArrowBackIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                },
              }}
            >
              Volver Atrás
            </Button>
          </Box>

          {/* Nota de desarrollo */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 2,
              background: alpha(warningColor, 0.05),
              border: `1px solid ${alpha(warningColor, 0.1)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: warningColor,
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              ⚠️ Esta página solo se muestra en modo desarrollo.
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
                display: "block",
                mt: 0.5,
              }}
            >
              En producción, los errores se manejan de forma diferente.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
