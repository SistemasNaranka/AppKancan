import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/hooks/useAuth";
import {
  Home as HomeIcon,
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";

/**
 * Componente moderno para páginas no encontradas (404)
 * Diseñado para integrarse con el sistema de comisiones
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Determinar a dónde redirigir según estado de autenticación
  const returnPath = isAuthenticated ? "/" : "/login";
  const returnLabel = isAuthenticated ? "Volver al Inicio" : "Ir al Login";

  return (
    <Box className="min-h-screen flex items-center justify-center">
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            textAlign: "center",
            background:
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                : "0 20px 40px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Número 404 con diseño moderno */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "8rem", sm: "12rem" },
                fontWeight: 900,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                    : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              404
            </Typography>
          </Box>

          {/* Mensaje principal */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary,
              }}
            >
              Página no encontrada
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              Lo sentimos, la página que buscas no existe o no tienes acceso a
              ella. Por favor, verifica la URL o navegación desde el inicio.
            </Typography>
          </Box>

          {/* Estado de sesión */}
          {isAuthenticated && (
            <Box
              sx={{
                mb: 4,
                p: 2,
                borderRadius: 2,
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(59, 130, 246, 0.05)",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(59, 130, 246, 0.2)"
                    : "1px solid rgba(59, 130, 246, 0.1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                Sesión activa como:{" "}
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  {user?.email}
                </Typography>
              </Typography>
            </Box>
          )}

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
              startIcon={isAuthenticated ? <HomeIcon /> : <ArrowLeftIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                    : "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                    : "0 4px 12px rgba(59, 130, 246, 0.2)",
                "&:hover": {
                  background:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                      : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 6px 16px rgba(59, 130, 246, 0.4)"
                      : "0 6px 16px rgba(59, 130, 246, 0.3)",
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
              startIcon={<SearchIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderWidth: 2,
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(59, 130, 246, 0.2)",
                color: theme.palette.mode === "dark" ? "#60a5fa" : "#3b82f6",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(59, 130, 246, 0.05)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Recargar página
            </Button>
          </Box>

          {/* Pie de página con información adicional */}
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.85rem",
              }}
            >
              Si crees que esto es un error, contacta al soporte técnico del
              sistema.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
