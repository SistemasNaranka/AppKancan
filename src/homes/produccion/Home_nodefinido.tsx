import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Container,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Mail,
  Cloud,
  GridOn,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  Circle,
} from "@mui/icons-material";
import Clock from "@/homes/clock";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useNavigate } from "react-router-dom";
import { DynamicIcon } from "@/shared/utils/DynamicIcon";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { area, apps, loading } = useApps();

  // 🌐 Estado de conexión
  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    strength: 4, // 0-4 barras
    ping: 0,
    quality: "Excelente",
  });

  // 📊 Monitorear conexión
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-cache",
        });
        const endTime = performance.now();
        const ping = Math.round(endTime - startTime);

        let strength = 4;
        let quality = "Excelente";

        if (ping > 300) {
          strength = 1;
          quality = "Pobre";
        } else if (ping > 200) {
          strength = 2;
          quality = "Regular";
        } else if (ping > 100) {
          strength = 3;
          quality = "Buena";
        } else {
          strength = 4;
          quality = "Excelente";
        }

        setConnectionStatus({
          online: true,
          strength,
          ping,
          quality,
        });
      } catch (error) {
        setConnectionStatus({
          online: false,
          strength: 0,
          ping: 0,
          quality: "Sin conexión",
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds

    const handleOnline = () => {
      setConnectionStatus((prev) => ({ ...prev, online: true }));
      checkConnection();
    };

    const handleOffline = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        online: false,
        strength: 0,
        quality: "Sin conexión",
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 🔗 Función para abrir aplicaciones externas
  const openApp = (url: string) => {
    const windowName = url.includes("gmail")
      ? "Gmail"
      : url.includes("drive")
      ? "GoogleDrive"
      : "GoogleSheets";

    const existingWindow = window.open("", windowName);

    if (existingWindow && existingWindow.location.href !== "about:blank") {
      existingWindow.focus();
    } else {
      window.open(url, windowName, "width=1200,height=800");
    }
  };

  // 🎨 Colores para las tarjetas de apps
  const appColors = [
    { bg: "#fee2e2", color: "#dc2626" },
    { bg: "#dcfce7", color: "#16a34a" },
    { bg: "#dbeafe", color: "#2563eb" },
    { bg: "#fef3c7", color: "#d97706" },
    { bg: "#f3e8ff", color: "#9333ea" },
    { bg: "#ffedd5", color: "#ea580c" },
  ];

  // 📡 Obtener icono de conexión
  const getConnectionIcon = () => {
    const iconProps = {
      sx: {
        fontSize: 24,
        color: connectionStatus.online
          ? connectionStatus.strength === 4
            ? "#16a34a"
            : connectionStatus.strength === 3
            ? "#84cc16"
            : connectionStatus.strength === 2
            ? "#eab308"
            : connectionStatus.strength === 1
            ? "#f97316"
            : "#ef4444"
          : "#6b7280",
      },
    };

    if (!connectionStatus.online) return <SignalWifiOff {...iconProps} />;
    switch (connectionStatus.strength) {
      case 4:
        return <SignalWifi4Bar {...iconProps} />;
      case 3:
        return <SignalWifi3Bar {...iconProps} />;
      case 2:
        return <SignalWifi2Bar {...iconProps} />;
      case 1:
        return <SignalWifi1Bar {...iconProps} />;
      default:
        return <SignalWifiOff {...iconProps} />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",

        pb: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Mejorado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            py: 4,
            borderBottom: "2px solid #e2e8f0",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                mb: 1,
              }}
            >
              Área de {area ?? "No definida"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "#64748b" }}>
                Bienvenido a tu área de trabajo
              </Typography>
              <Chip
                size="small"
                label={user?.nombre ?? "Usuario"}
                sx={{
                  bgcolor: "#667eea",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "#1e293b",
                fontFamily: "monospace",
              }}
            >
              <Clock />
            </Typography>

            {/* Indicador de Conexión */}
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Estado de Conexión
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    <Typography variant="caption">
                      Estado:{" "}
                      {connectionStatus.online ? "Conectado" : "Sin conexión"}
                    </Typography>
                    <Typography variant="caption">
                      Calidad: {connectionStatus.quality}
                    </Typography>
                    {connectionStatus.online && connectionStatus.ping > 0 && (
                      <Typography variant="caption">
                        Latencia: {connectionStatus.ping}ms
                      </Typography>
                    )}
                  </Box>
                </Box>
              }
              arrow
              placement="bottom"
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  bgcolor: "white",
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {getConnectionIcon()}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Circle
                    sx={{
                      fontSize: 8,
                      color: connectionStatus.online ? "#16a34a" : "#ef4444",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", fontWeight: 600 }}
                  >
                    {connectionStatus.quality}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Layout Principal en 3 columnas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
              lg: "2fr 1.5fr 1fr",
            },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Columna 1: Apps Externas */}
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              height: "fit-content",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                  mb: 3,
                }}
              >
                Aplicaciones Externas
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  {
                    name: "Gmail",
                    url: "https://mail.google.com",
                    icon: Mail,
                    color: "#dc2626",
                    bg: "#fee2e2",
                    description: "Correo electrónico",
                  },
                  {
                    name: "Drive",
                    url: "https://drive.google.com",
                    icon: Cloud,
                    color: "#16a34a",
                    bg: "#dcfce7",
                    description: "Almacenamiento",
                  },
                  {
                    name: "Sheets",
                    url: "https://docs.google.com/spreadsheets",
                    icon: GridOn,
                    color: "#059669",
                    bg: "#d1fae5",
                    description: "Hojas de cálculo",
                  },
                ].map((app) => {
                  const Icon = app.icon;
                  return (
                    <Button
                      key={app.name}
                      onClick={() => openApp(app.url)}
                      fullWidth
                      sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: 2,
                        p: 2,
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: 2,
                        textTransform: "none",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: app.color,
                          backgroundColor: app.bg,
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          backgroundColor: app.bg,
                        }}
                      >
                        <Icon sx={{ fontSize: 20, color: app.color }} />
                      </Box>
                      <Box sx={{ textAlign: "left" }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#1e293b" }}
                        >
                          {app.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {app.description}
                        </Typography>
                      </Box>
                    </Button>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Columna 2: Información Principal */}
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              height: "fit-content",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                  mb: 2,
                }}
              >
                Resumen del Sistema
              </Typography>

              <Paper
                sx={{
                  backgroundColor: "#f0f4f8",
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block", mb: 1 }}
                >
                  Total de Aplicaciones
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#1e293b" }}
                >
                  {loading ? "..." : apps?.length || 0}
                </Typography>
              </Paper>

              <Paper
                sx={{
                  backgroundColor: "#667eea",
                  p: 2.5,
                  borderRadius: 2,
                  color: "white",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9, display: "block", mb: 1 }}
                >
                  Usuario Activo
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  {user?.nombre ?? "Usuario"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {area ?? "No definida"}
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Columna 3: Estado del Sistema */}
          <Card
            sx={{
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: 3,
              color: "white",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              height: "fit-content",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  opacity: 0.9,
                  textTransform: "uppercase",
                  display: "block",
                  mb: 2,
                }}
              >
                Estado del Sistema
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5 }}
                  >
                    Sistema
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Operativo
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5 }}
                  >
                    Conexión
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {connectionStatus.quality}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5 }}
                  >
                    Apps Activas
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {loading ? "..." : `${apps?.length || 0}`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Grid de Aplicaciones del Usuario */}
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#1e293b",
              mb: 3,
            }}
          >
            Mis Aplicaciones
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="body1" sx={{ color: "#64748b" }}>
                Cargando aplicaciones...
              </Typography>
            </Box>
          ) : apps && apps.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                  lg: "repeat(5, 1fr)",
                  xl: "repeat(6, 1fr)",
                },
                gap: 3,
              }}
            >
              {apps.map((app, index) => {
                const colorScheme = appColors[index % appColors.length];
                return (
                  <Button
                    key={app.id}
                    onClick={() => navigate(app.ruta)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 3,
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 3,
                      textTransform: "none",
                      transition: "all 0.3s",
                      "&:hover": {
                        borderColor: colorScheme.color,
                        boxShadow: `0 4px 12px ${colorScheme.color}33`,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        backgroundColor: colorScheme.bg,
                        mb: 2,
                      }}
                    >
                      <DynamicIcon
                        iconName={app.icono_app}
                        sx={{ fontSize: 28, color: colorScheme.color }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        color: "#1e293b",
                        textAlign: "center",
                      }}
                    >
                      {app.nombre}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", fontSize: "0.75rem" }}
                    >
                      {app.categoria || "Aplicación"}
                    </Typography>
                  </Button>
                );
              })}
            </Box>
          ) : (
            <Paper
              sx={{
                p: 8,
                textAlign: "center",
                backgroundColor: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: "#64748b" }}>
                No tienes aplicaciones disponibles
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
