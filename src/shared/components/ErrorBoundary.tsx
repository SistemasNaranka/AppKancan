import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import { keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";

// Animación de pulsación
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Animación de flotación
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
      // TODO: Send to error monitoring service (e.g., Sentry)
    } else {
      console.error("ErrorBoundary:", error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Componente de fallback separado para mejor organización
function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onReset: () => void;
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Colores de AppKancan
  const primaryColor = "#3b82f6";
  const errorColor = "#ef4444";
  const warningColor = "#f59e0b";

  const returnPath = isAuthenticated ? "/home" : "/login";

  // Extraer mensaje de error
  const errorMessage = error?.message || "Error desconocido";

  // Obtener información del componente que causó el error
  const componentStack = errorInfo?.componentStack || error?.stack || "";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,

        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-30%",
          left: "-30%",
          width: "160%",
          height: "160%",
          background: `radial-gradient(circle, ${alpha(errorColor, 0.04)} 0%, transparent 50%)`,
          animation: `${float} 12s ease-in-out infinite`,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          textAlign: "center",
          maxWidth: 600,
          width: "100%",
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${alpha(errorColor, 0.15)}`,
          boxShadow: `0 16px 48px ${alpha(errorColor, 0.12)}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Etiqueta de desarrollo en modo desarrollo */}
        {import.meta.env.DEV && (
          <Chip
            icon={<BugReportIcon sx={{ fontSize: 14 }} />}
            label="Error Boundary"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: alpha(warningColor, 0.1),
              color: warningColor,
              border: `1px solid ${alpha(warningColor, 0.3)}`,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        )}

        {/* Icono animado */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "center",
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${alpha(errorColor, 0.12)}, ${alpha(errorColor, 0.05)})`,
              border: `2px solid ${alpha(errorColor, 0.2)}`,
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 42,
                color: errorColor,
              }}
            />
          </Box>
        </Box>

        {/* Título */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: errorColor,
            mb: 1,
          }}
        >
          Algo salió mal
        </Typography>

        {/* Mensaje */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 450, mx: "auto" }}
        >
          Ha ocurrido un error inesperado. Revisa la consola para obtener más
          detalles.
        </Typography>

        {/* Accordion con detalles del error (solo en desarrollo) */}
        {import.meta.env.DEV && error && (
          <Accordion
            sx={{
              mb: 3,
              background: alpha(errorColor, 0.03),
              border: `1px solid ${alpha(errorColor, 0.1)}`,
              "&:before": { display: "none" },
              boxShadow: "none",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ color: errorColor, fontWeight: 600 }}
              >
                Detalles del error (Solo desarrollo)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  textAlign: "left",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: theme.palette.text.secondary,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {errorMessage}
                </Typography>
                {componentStack && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 2,
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: theme.palette.text.disabled,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {componentStack}
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Botones de acción */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={onReset}
            startIcon={<RefreshIcon />}
            fullWidth
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${primaryColor}, ${alpha(primaryColor, 0.8)})`,
              boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`,
              "&:hover": {
                background: `linear-gradient(135deg, ${alpha(primaryColor, 0.9)}, ${primaryColor})`,
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Intentar nuevamente
          </Button>

          <Button
            variant="outlined"
            size={isMobile ? "medium" : "large"}
            onClick={() => window.location.reload()}
            fullWidth
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: alpha(primaryColor, 0.3),
              color: primaryColor,
              "&:hover": {
                borderColor: primaryColor,
                backgroundColor: alpha(primaryColor, 0.05),
              },
            }}
          >
            Recargar página
          </Button>

          <Button
            variant="text"
            size={isMobile ? "medium" : "large"}
            onClick={() => {
              onReset();
              navigate(returnPath);
            }}
            startIcon={<HomeIcon />}
            fullWidth
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
            Ir al inicio
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ErrorBoundary;
