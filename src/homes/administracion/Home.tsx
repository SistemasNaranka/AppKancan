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
  Schedule,
} from "@mui/icons-material";
import { useAuth } from "@/auth/hooks/useAuth";
import { useApps } from "@/apps/hooks/useApps";
import { useNavigate } from "react-router-dom";
import { DynamicIcon } from "@/shared/utils/DynamicIcon";

const appTabs: Record<string, Window | null> = {
  gmailTab: null,
  driveTab: null,
  sheetsTab: null,
};
const appColors = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#6c5ce7",
  "#fd79a8",
  "#fdcb6e",
  "#4CAF50",
  "#F18F01",
  "#A23B72",
  "#009688",
  "#2196F3",
  "#E91E63",
  "#3F51B5",
  "#FFC107",
  "#FF5722",
  "#795548",
  "#607D8B",
];
const externalApps = [
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
];
const wifiIcons = [
  SignalWifiOff,
  SignalWifi1Bar,
  SignalWifi2Bar,
  SignalWifi3Bar,
  SignalWifi4Bar,
];
const connectionLevels = [
  { max: Infinity, strength: 1, quality: "Pobre" },
  { max: 300, strength: 2, quality: "Regular" },
  { max: 200, strength: 3, quality: "Buena" },
  { max: 100, strength: 4, quality: "Excelente" },
];

const hexToRgba = (hex: string, alpha: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12
    ? "¡Buenos días!"
    : h < 18
      ? "¡Buenas tardes!"
      : "¡Buenas noches!";
};

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { area, apps, loading } = useApps();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [conn, setConn] = useState({
    online: navigator.onLine,
    strength: 4,
    ping: 0,
    quality: "Excelente",
  });

  useEffect(() => {
    const check = async () => {
      try {
        const start = performance.now();
        await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-cache",
        });
        const ping = Math.round(performance.now() - start);
        const level =
          connectionLevels.find((l) => ping > l.max) || connectionLevels[3];
        setConn({
          online: true,
          strength: level.strength,
          ping,
          quality: level.quality,
        });
      } catch {
        setConn({
          online: false,
          strength: 0,
          ping: 0,
          quality: "Sin conexión",
        });
      }
    };
    check();
    const i = setInterval(check, 10000);
    const on = () => check();
    const off = () =>
      setConn((p) => ({
        ...p,
        online: false,
        strength: 0,
        quality: "Sin conexión",
      }));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearInterval(i);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const openApp = (url: string) => {
    const key = url.includes("mail")
      ? "gmailTab"
      : url.includes("drive")
        ? "driveTab"
        : "sheetsTab";
    if (appTabs[key]?.closed === false) return appTabs[key]!.focus();
    const tab = window.open(url, key);
    if (tab) {
      appTabs[key] = tab;
      tab.focus();
    } else alert("Permite abrir pestañas emergentes.");
  };

  const color = !conn.online
    ? "#6b7280"
    : ["#6b7280", "#f97316", "#eab308", "#22c55e", "#16a34a"][conn.strength];
  const WifiIcon = wifiIcons[conn.strength];
  const userName = user?.nombre
    ? `${user.nombre}${user?.apellido ? ` ${user.apellido}` : ""}`
    : "Usuario";

  const cardSx = {
    bgcolor: "white",
    borderRadius: 3,
    border: "1px solid #e0e0e0",
    p: { xs: 2, md: 3 },
    transition: "all 0.3s",
  };
  const hoverSx = (c: string) => ({
    ...cardSx,
    cursor: "pointer",
    border: `3px solid ${c}`,
    "&:hover": {
      transform: "scale(1.05)",
      boxShadow: `0 1px 1px ${c}40`,
      bgcolor: hexToRgba(c, 0.15),
    },
  });

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
          flexDirection: "column",
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Paper elevation={2} sx={cardSx}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CalendarToday
                sx={{ fontSize: { xs: 30, md: 40 }, mr: 1, color: "#FFAF2E" }}
              />
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1rem", md: "1.25rem" },
                  color: "#1a1a1a",
                }}
              >
                {currentTime.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
              {currentTime.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Typography>
          </Paper>

          <Paper
            elevation={2}
            sx={{
              ...cardSx,
              flex: 1,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 2, md: 3 },
            }}
          >
            <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
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
                {userName}
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

            <Tooltip
              arrow
              title={
                <Box sx={{ p: 2, bgcolor: "white", color: "#1a1a1a" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <WifiIcon sx={{ color, fontSize: 24 }} />
                    <Typography fontWeight={700} sx={{ color }}>
                      Estado de Conexión
                    </Typography>
                  </Box>
                  {[
                    ["Estado", conn.online ? "Conectado" : "Sin conexión"],
                    ["Calidad", conn.quality],
                    ...(conn.ping ? [["Latencia", `${conn.ping}ms`]] : []),
                  ].map(([l, v]) => (
                    <Box
                      key={l}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", fontWeight: 600 }}
                      >
                        {l}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color, fontWeight: 700 }}
                      >
                        {v}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              }
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "white",
                    boxShadow: 3,
                    border: `2px solid ${color}`,
                    p: 0,
                  },
                },
              }}
            >
              <Box
                sx={{
                  ...hoverSx(color),
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: { xs: 2, md: 3 },
                  py: { xs: 1.5, md: 2 },
                }}
              >
                <WifiIcon sx={{ color, fontSize: { xs: 24, md: 30 } }} />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "#666" }}
                  >
                    CONEXIÓN
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                    {conn.quality}
                  </Typography>
                  {conn.ping > 0 && (
                    <Chip
                      label={`${conn.ping}ms`}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: `${color}20`,
                        color,
                        fontSize: "0.7rem",
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Tooltip>
          </Paper>
        </Box>

        {/* CONTENT */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* MY APPS */}
          <Paper
            elevation={2}
            sx={{
              ...cardSx,
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
              {!loading && apps?.length > 0 && (
                <Chip
                  label={`${apps.length} app${apps.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{ bgcolor: "#667eea", color: "white" }}
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
                alignContent: "start",
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
              ) : apps?.length > 0 ? (
                apps.map((app, i) => {
                  const c = appColors[i % appColors.length];
                  return (
                    <Paper
                      key={app.id}
                      elevation={1}
                      onClick={() => navigate(app.ruta)}
                      sx={{
                        ...hoverSx(c),
                        aspectRatio: "1/1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                      }}
                    >
                      <DynamicIcon
                        iconName={app.icono_app}
                        sx={{ fontSize: { xs: 45, sm: 55 }, mb: 1, color: c }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        textAlign="center"
                        sx={{
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          color: "#1a1a1a",
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
                </Box>
              )}
            </Box>
          </Paper>

          {/* EXTERNAL APPS */}
          <Paper
            elevation={2}
            sx={{ ...cardSx, width: { xs: "100%", lg: 280 } }}
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
                flexDirection: { xs: "row", lg: "column" },
                gap: 2,
                flexWrap: { xs: "wrap", lg: "nowrap" },
              }}
            >
              {externalApps.map(({ icon: Icon, label, url, color: c }) => (
                <Paper
                  key={label}
                  elevation={1}
                  onClick={() => openApp(url)}
                  sx={{
                    ...hoverSx(c),
                    p: 2,
                    flex: { xs: "1 1 calc(33.333% - 11px)", lg: "0 0 auto" },
                    minWidth: { xs: "calc(33.333% - 11px)", sm: 120 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      sx={{ fontSize: { xs: 40, md: 50 }, mb: 1, color: c }}
                    />
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: "0.75rem", md: "1rem" },
                        color: "#1a1a1a",
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
