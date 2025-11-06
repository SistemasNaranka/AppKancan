import { useState, useEffect } from "react";
import { Box, Typography, Paper, Chip, Tooltip } from "@mui/material";
import {
  Mail,
  Cloud,
  GridOn,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  CalendarToday,
  Construction,
  Schedule,
} from "@mui/icons-material";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useNavigate } from "react-router-dom";
import { DynamicIcon } from "@/shared/utils/DynamicIcon";

interface AppTabsType {
  gmailTab: Window | null;
  driveTab: Window | null;
  sheetsTab: Window | null;
  [key: string]: Window | null;
}

const appTabs: AppTabsType = {
  gmailTab: null,
  driveTab: null,
  sheetsTab: null,
};

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { area, apps, loading } = useApps();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    strength: 4,
    ping: 0,
    quality: "Excelente",
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const start = performance.now();
        await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-cache",
        });
        const ping = Math.round(performance.now() - start);

        let strength = 4,
          quality = "Excelente";
        if (ping > 300) {
          strength = 1;
          quality = "Pobre";
        } else if (ping > 200) {
          strength = 2;
          quality = "Regular";
        } else if (ping > 100) {
          strength = 3;
          quality = "Buena";
        }

        setConnectionStatus({ online: true, strength, ping, quality });
      } catch {
        setConnectionStatus({
          online: false,
          strength: 0,
          ping: 0,
          quality: "Sin conexión",
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    const handleOnline = () => checkConnection();
    const handleOffline = () =>
      setConnectionStatus((prev) => ({
        ...prev,
        online: false,
        strength: 0,
        quality: "Sin conexión",
      }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = () =>
    currentTime.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = () =>
    currentTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const openApp = (url: string): void => {
    let windowName = "";

    if (url.includes("mail.google.com")) {
      windowName = "gmailTab";
    } else if (url.includes("drive.google.com")) {
      windowName = "driveTab";
    } else if (url.includes("docs.google.com/spreadsheets")) {
      windowName = "sheetsTab";
    }

    if (!windowName) {
      console.error("URL no reconocida:", url);
      return;
    }

    try {
      const existingTab = appTabs[windowName];

      if (existingTab && !existingTab.closed) {
        existingTab.focus();
        return;
      }

      const newTab = window.open(url, windowName);

      if (newTab) {
        appTabs[windowName] = newTab;
        newTab.focus();
      } else {
        alert(
          "Por favor permite abrir pestañas emergentes para esta aplicación."
        );
      }
    } catch (error) {
      console.error("Error al abrir la aplicación:", error);
    }
  };

  const getConnectionIcon = () => {
    const iconProps = { sx: { fontSize: { xs: 24, md: 30 } } };
    const icons = [
      <SignalWifiOff key="wifi-off" {...iconProps} />,
      <SignalWifi1Bar key="wifi-1" {...iconProps} />,
      <SignalWifi2Bar key="wifi-2" {...iconProps} />,
      <SignalWifi3Bar key="wifi-3" {...iconProps} />,
      <SignalWifi4Bar key="wifi-4" {...iconProps} />,
    ];
    return icons[connectionStatus.strength];
  };

  const getConnectionColor = () => {
    if (!connectionStatus.online) return "#6b7280";
    const colors = ["#6b7280", "#f97316", "#eab308", "#22c55e", "#16a34a"];
    return colors[connectionStatus.strength];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días!";
    if (hour < 18) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  };

  // Función auxiliar para convertir hex a rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Array de colores para las apps
  const appColors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
    "#fdcb6e",
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* COLUMNA IZQUIERDA */}
        <Box
          sx={{
            width: { xs: "100%", lg: 280 },
            display: "flex",
            flexDirection: { xs: "row", sm: "row", lg: "column" },
            gap: { xs: 2, md: 3 },
            flexWrap: { xs: "wrap", lg: "nowrap" },
          }}
        >
          {/* Hora/Fecha - Fondo blanco con borde naranja */}
          <Paper
            elevation={2}
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              p: { xs: 2, md: 3 },
              flex: {
                xs: "1 1 calc(50% - 8px)",
                sm: "1 1 calc(50% - 12px)",
                lg: "0 0 auto",
              },
              minWidth: { xs: "calc(50% - 8px)", sm: 200 },
              transition: "all 0.3s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CalendarToday
                sx={{
                  fontSize: { xs: 30, md: 40 },
                  mr: 1,
                  color: "#FFAF2E",
                }}
              />
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1rem", md: "1.25rem" },
                  color: "#1a1a1a",
                }}
              >
                {formatTime().split(":")[0]}:{formatTime().split(":")[1]}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                textTransform: "capitalize",
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                color: "#666",
              }}
            >
              {formatDate()}
            </Typography>
          </Paper>

          {/* Sección en Desarrollo - Fondo blanco con borde morado */}
          <Paper
            elevation={2}
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              p: { xs: 2, md: 3 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              transition: "all 0.3s",
            }}
          >
            <Construction
              sx={{
                fontSize: { xs: 60, md: 80 },
                mb: 2,
                color: "#667eea",
              }}
            />
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                mb: 1,
                textAlign: "center",
                fontSize: { xs: "1rem", md: "1.25rem" },
                color: "#1a1a1a",
              }}
            >
              Sección en Desarrollo
            </Typography>
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                fontSize: { xs: "0.75rem", md: "0.875rem" },
                color: "#666",
              }}
            >
              Próximamente: Noticias, cambios y nuevas funcionalidades
            </Typography>
            <Chip
              label="Próximamente"
              sx={{
                mt: 2,
                bgcolor: "#667eea",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Paper>
        </Box>

        {/* COLUMNA CENTRAL */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, md: 3 },
            minWidth: 0,
          }}
        >
          {/* Bienvenida + Conexión */}
          <Paper
            elevation={2}
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              p: { xs: 2, md: 3 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 2, md: 3 },
              transition: "all 0.3s",
            }}
          >
            {/* Bienvenida */}
            <Box
              sx={{
                flex: 1,
                textAlign: { xs: "center", md: "left" },
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "center", md: "flex-start" },
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  color: "#667eea",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {getGreeting()}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mt: 1,
                  color: "#1a1a1a",
                  fontSize: { xs: "1rem", md: "1.25rem" },
                }}
              >
                {user?.nombre && user?.apellido
                  ? `${user.nombre} ${user.apellido}`
                  : user?.nombre
                  ? user.nombre
                  : "Usuario"}
              </Typography>
              <Chip
                label={`Área de ${area ?? "No Definida"}`}
                sx={{
                  mt: 1.5,
                  bgcolor: "#667eea",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Conexión */}
            <Tooltip
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "white",
                    color: "#1a1a1a",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    borderRadius: 2,
                    border: `2px solid ${getConnectionColor()}`,
                    p: 0,
                    maxWidth: 280,
                  },
                },
                arrow: {
                  sx: {
                    color: "white",
                    "&::before": {
                      border: `2px solid ${getConnectionColor()}`,
                    },
                  },
                },
              }}
              title={
                <Box sx={{ p: 2 }}>
                  {/* Header con icono y título */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                      pb: 1.5,
                      borderBottom: `2px solid ${getConnectionColor()}20`,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: `${getConnectionColor()}15`,
                        borderRadius: 2,
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{ color: getConnectionColor(), display: "flex" }}
                      >
                        {getConnectionIcon()}
                      </Box>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: getConnectionColor(),
                        fontSize: "1rem",
                      }}
                    >
                      Estado de Conexión
                    </Typography>
                  </Box>

                  {/* Información de conexión */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {/* Estado */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.7rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Estado
                      </Typography>
                      <Chip
                        label={
                          connectionStatus.online ? "Conectado" : "Sin conexión"
                        }
                        size="small"
                        sx={{
                          bgcolor: connectionStatus.online
                            ? `${getConnectionColor()}15`
                            : "#f3f4f6",
                          color: connectionStatus.online
                            ? getConnectionColor()
                            : "#6b7280",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </Box>

                    {/* Calidad */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.7rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Calidad
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: getConnectionColor(),
                            boxShadow: `0 0 8px ${getConnectionColor()}60`,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: getConnectionColor(),
                            fontSize: "0.85rem",
                          }}
                        >
                          {connectionStatus.quality}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Latencia */}
                    {connectionStatus.online && connectionStatus.ping > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#666",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: "0.7rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Latencia
                        </Typography>
                        <Box
                          sx={{
                            bgcolor: `${getConnectionColor()}10`,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            border: `1px solid ${getConnectionColor()}30`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: getConnectionColor(),
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                            }}
                          >
                            {connectionStatus.ping}ms
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Footer informativo */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.5,
                      borderTop: `1px solid ${getConnectionColor()}15`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#999",
                        fontSize: "0.65rem",
                        fontStyle: "italic",
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      Actualización automática cada 10 segundos
                    </Typography>
                  </Box>
                </Box>
              }
            >
              <Box
                sx={{
                  bgcolor: "white",
                  border: `3px solid ${getConnectionColor()}`,
                  borderRadius: 3,
                  px: { xs: 2, md: 3 },
                  py: { xs: 1.5, md: 2 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  minWidth: { xs: "100%", md: 200 },
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "scale(1.03)",
                    boxShadow: `0 4px 20px ${getConnectionColor()}40`,
                  },
                }}
              >
                <Box sx={{ color: getConnectionColor() }}>
                  {getConnectionIcon()}
                </Box>
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      display: "block",
                      color: "#666",
                    }}
                  >
                    CONEXIÓN
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      color: getConnectionColor(),
                    }}
                  >
                    {connectionStatus.quality}
                  </Typography>
                  {connectionStatus.online && connectionStatus.ping > 0 && (
                    <Chip
                      label={`${connectionStatus.ping}ms`}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: `${getConnectionColor()}20`,
                        color: getConnectionColor(),
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Tooltip>
          </Paper>

          {/* Mis Aplicaciones */}
          <Paper
            elevation={2}
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              p: { xs: 2, md: 3 },
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  color: "#1a1a1a",
                }}
              >
                Mis Aplicaciones
              </Typography>
              {!loading && apps && apps.length > 0 && (
                <Chip
                  label={`${apps.length} app${apps.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{ bgcolor: "#667eea", color: "white", fontWeight: 600 }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(auto-fill, minmax(150px, 1fr))",
                },
                gap: 2,
                flex: 1,
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    gridColumn: "1/-1",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 200,
                  }}
                >
                  <Typography color="#666">Cargando aplicaciones...</Typography>
                </Box>
              ) : apps && apps.length > 0 ? (
                apps.map((app, index) => {
                  const appColor = appColors[index % appColors.length];
                  return (
                    <Paper
                      key={app.id}
                      elevation={1}
                      sx={{
                        aspectRatio: "1/1",
                        bgcolor: "white",
                        border: `3px solid ${appColor}`,
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        p: 2,
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: `0 1px 1px ${appColor}40`,
                          bgcolor: hexToRgba(appColor, 0.15), // ✨ Fondo suave con 15% de opacidad
                          borderColor: appColor,
                          "& .app-icon": {
                            color: `${appColor} !important`,
                            transform: "scale(1.1)",
                          },
                          "& .app-text": {
                            color: `${appColor} !important`,
                            fontWeight: 700,
                          },
                        },
                      }}
                      onClick={() => navigate(app.ruta)}
                    >
                      <DynamicIcon
                        iconName={app.icono_app}
                        className="app-icon"
                        sx={{
                          fontSize: { xs: 45, sm: 55 },
                          mb: 1,
                          color: appColor,
                          transition: "all 0.3s ease",
                        }}
                      />
                      <Typography
                        className="app-text"
                        variant="body2"
                        fontWeight="bold"
                        textAlign="center"
                        sx={{
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          color: "#1a1a1a",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {app.nombre}
                      </Typography>
                    </Paper>
                  );
                })
              ) : (
                <Box
                  sx={{
                    gridColumn: "1/-1",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 200,
                    color: "#666",
                  }}
                >
                  <Schedule sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ opacity: 0.7 }}>
                    Sin aplicaciones disponibles
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.5 }}>
                    Las aplicaciones aparecerán aquí cuando estén disponibles
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* COLUMNA DERECHA - Apps Externas */}
        <Box sx={{ width: { xs: "100%", lg: 280 } }}>
          <Paper
            elevation={2}
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              p: { xs: 2, md: 3 },
              height: { xs: "auto", lg: "100%" },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              mb={3}
              sx={{
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                color: "#1a1a1a",
              }}
            >
              Apps Externas
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", sm: "row", lg: "column" },
                gap: 2,
                flexWrap: { xs: "wrap", lg: "nowrap" },
              }}
            >
              {[
                {
                  icon: Mail,
                  label: "Gmail",
                  url: "https://mail.google.com",
                  color: "#ea4335",
                },
                {
                  icon: Cloud,
                  label: "Drive",
                  url: "https://drive.google.com",
                  color: "#0f9d58",
                },
                {
                  icon: GridOn,
                  label: "Sheets",
                  url: "https://docs.google.com/spreadsheets",
                  color: "#0f9d58",
                },
              ].map(({ icon: Icon, label, url, color }) => (
                <Paper
                  key={label}
                  elevation={1}
                  sx={{
                    bgcolor: "white",
                    border: `3px solid ${color}`,
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    flex: {
                      xs: "1 1 calc(33.333% - 11px)",
                      sm: "1 1 calc(33.333% - 11px)",
                      lg: "0 0 auto",
                    },
                    minWidth: { xs: "calc(33.333% - 11px)", sm: 120 },
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: `0 1px 1px ${color}30`,
                      bgcolor: hexToRgba(color, 0.15), // ✨ Fondo suave con 15% de opacidad
                      borderColor: color,
                      "& .external-icon": {
                        color: `${color} !important`,
                        transform: "scale(1.1)",
                      },
                      "& .external-text": {
                        color: `${color} !important`,
                        fontWeight: 700,
                      },
                    },
                  }}
                  onClick={() => openApp(url)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      className="external-icon"
                      sx={{
                        fontSize: { xs: 40, md: 50 },
                        mb: 1,
                        color: color,
                        transition: "all 0.3s ease",
                      }}
                    />
                    <Typography
                      className="external-text"
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                          md: "1rem",
                        },
                        color: "#1a1a1a",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
