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
const windowRefs: { [key: string]: Window | null } = {};
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

  const openApp = (url: string) => {
    const windowName = url.includes("gmail")
      ? "MyApp_Gmail"
      : url.includes("drive")
      ? "MyApp_GoogleDrive"
      : "MyApp_GoogleSheets";

    // Verificar si tenemos una referencia guardada y si la ventana sigue abierta
    if (windowRefs[windowName] && !windowRefs[windowName]?.closed) {
      // La ventana existe, solo enfocarla
      windowRefs[windowName]?.focus();
    } else {
      // Abrir nueva ventana o reutilizar una con el mismo nombre
      windowRefs[windowName] = window.open(
        url,
        windowName,
        "width=1200,height=800"
      );
      windowRefs[windowName]?.focus();
    }
  };

  const getConnectionIcon = () => {
    const iconProps = { sx: { fontSize: { xs: 24, md: 30 }, color: "white" } };
    if (!connectionStatus.online) return <SignalWifiOff {...iconProps} />;
    const icons = [
      <SignalWifiOff {...iconProps} />,
      <SignalWifi1Bar {...iconProps} />,
      <SignalWifi2Bar {...iconProps} />,
      <SignalWifi3Bar {...iconProps} />,
      <SignalWifi4Bar {...iconProps} />,
    ];
    return icons[connectionStatus.strength];
  };

  const getConnectionBg = () => {
    if (!connectionStatus.online)
      return "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)";
    const bgs = [
      "",
      "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
      "linear-gradient(135deg, #eab308 0%, #facc15 100%)",
      "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
      "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    ];
    return bgs[connectionStatus.strength];
  };

  const appColors = [
    "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
    "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
  ];
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días!";
    if (hour < 18) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Layout Principal - Responsive */}
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
          {/* Hora/Fecha */}
          <Paper
            elevation={8}
            sx={{
              background: "linear-gradient(135deg, #FFAF2E 0%, #f9a825 100%)",
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              color: "white",
              flex: {
                xs: "1 1 calc(50% - 8px)",
                sm: "1 1 calc(50% - 12px)",
                lg: "0 0 auto",
              },
              minWidth: { xs: "calc(50% - 8px)", sm: 200 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CalendarToday sx={{ fontSize: { xs: 30, md: 40 }, mr: 1 }} />
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}
              >
                {formatTime().split(":")[0]}:{formatTime().split(":")[1]}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                textTransform: "capitalize",
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              }}
            >
              {formatDate()}
            </Typography>

            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{
                mt: 1,
                fontSize: { xs: "0.85rem", md: "1rem" },
              }}
            ></Typography>
          </Paper>

          {/* Clima Mejorado */}
          <Paper
            elevation={8}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              color: "white",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <Construction
              sx={{ fontSize: { xs: 60, md: 80 }, mb: 2, opacity: 0.9 }}
            />
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                mb: 1,
                textAlign: "center",
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              Sección en Desarrollo
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                textAlign: "center",
                fontSize: { xs: "0.75rem", md: "0.875rem" },
              }}
            >
              Próximamente: Noticias, cambios y nuevas funcionalidades
            </Typography>
            <Chip
              label="Próximamente"
              sx={{
                mt: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Paper>

          {/* Estadísticas Rápidas */}
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
          {/* Bienvenida + Conexión combinadas en una sola tarjeta */}
          <Paper
            elevation={12}
            sx={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              borderRadius: 4,
              border: "3px solid #667eea",
              p: { xs: 2, md: 3 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 2, md: 3 },
            }}
          >
            {/* Izquierda: Bienvenida */}
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
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {getGreeting()}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mt: 1,
                  opacity: 0.9,
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

            {/* Derecha: Conexión */}
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Estado de Conexión
                  </Typography>
                  <Typography variant="caption">
                    Estado:{" "}
                    {connectionStatus.online ? "Conectado" : "Sin conexión"}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Calidad: {connectionStatus.quality}
                  </Typography>
                  {connectionStatus.online && connectionStatus.ping > 0 && (
                    <>
                      <br />
                      <Typography variant="caption">
                        Latencia: {connectionStatus.ping}ms
                      </Typography>
                    </>
                  )}
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  background: getConnectionBg(),
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
                  "&:hover": { transform: "scale(1.03)" },
                  color: "white",
                  boxShadow: "0 4px 20px rgba(102,126,234,0.3)",
                }}
              >
                {getConnectionIcon()}
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: "block" }}
                  >
                    CONEXIÓN
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.875rem", md: "1rem" },
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
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.2)",
                        fontSize: "0.7rem",
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Tooltip>
          </Paper>

          {/* Mis Aplicaciones */}
          <Paper
            elevation={8}
            sx={{
              background: "white",
              borderRadius: 3,
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
                sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
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
                  <Typography>Cargando aplicaciones...</Typography>
                </Box>
              ) : apps && apps.length > 0 ? (
                apps.map((app, index) => (
                  <Paper
                    key={app.id}
                    elevation={4}
                    sx={{
                      aspectRatio: "1/1",
                      background: appColors[index % appColors.length],
                      color: "white",
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                      p: 2,
                    }}
                    onClick={() => navigate(app.ruta)}
                  >
                    <DynamicIcon
                      iconName={app.icono_app}
                      sx={{ fontSize: { xs: 45, sm: 55 }, mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      textAlign="center"
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      {app.nombre}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Box
                  sx={{
                    gridColumn: "1/-1",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 200,
                    color: "text.secondary",
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

        {/* COLUMNA DERECHA */}
        <Box sx={{ width: { xs: "100%", lg: 280 } }}>
          <Paper
            elevation={8}
            sx={{
              background: "white",
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              height: { xs: "auto", lg: "100%" },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              mb={3}
              sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
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
                  label: "Gmail API",
                  url: "https://mail.google.com",
                  bg: "linear-gradient(135deg, #ea4335 0%, #e57373 100%)",
                },
                {
                  icon: Cloud,
                  label: "Drive",
                  url: "https://drive.google.com",
                  bg: "linear-gradient(135deg, #0f9d58 0%, #66bb6a 100%)",
                },
                {
                  icon: GridOn,
                  label: "Sheets",
                  url: "https://docs.google.com/spreadsheets",
                  bg: "linear-gradient(135deg, #0f9d58 0%, #34a853 100%)",
                },
              ].map(({ icon: Icon, label, url, bg }) => (
                <Paper
                  key={label}
                  elevation={4}
                  sx={{
                    background: bg,
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.05)" },
                    flex: {
                      xs: "1 1 calc(33.333% - 11px)",
                      sm: "1 1 calc(33.333% - 11px)",
                      lg: "0 0 auto",
                    },
                    minWidth: { xs: "calc(33.333% - 11px)", sm: 120 },
                  }}
                  onClick={() => openApp(url)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: "white",
                    }}
                  >
                    <Icon sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                          md: "1rem",
                        },
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
