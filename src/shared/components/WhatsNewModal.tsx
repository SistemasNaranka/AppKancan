import React, { useEffect, useState } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Slide,
  Chip,
  keyframes,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { TransitionProps } from "@mui/material/transitions";
import { CURRENT_RELEASE, CATEGORY_META, WhatsNewCategory, WHATS_NEW_ENABLED } from "../config/whatsNew";
import { useAuth } from "@/auth/hooks/useAuth";

// Prefijo de key en localStorage. Se concatena con el id del usuario logueado
// para que cada usuario vea el modal una sola vez por versión, incluso si
// comparten el mismo navegador.
const STORAGE_KEY_PREFIX = "kancan_last_seen_version_";
const buildStorageKey = (userId: string | undefined) =>
  `${STORAGE_KEY_PREFIX}${userId ?? "anon"}`;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ── Animaciones ────────────────────────────────────────────────────────────
const shimmer = keyframes`
  0%   { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
  10%  { opacity: 1; }
  40%  { transform: translateX(220%) skewX(-20deg); opacity: 0; }
  100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50%      { transform: translateY(-4px) rotate(-4deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1.1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

interface Props {
  /** Si true, abre siempre (uso manual desde menú "Novedades"). */
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WhatsNewModal({ forceOpen, onClose }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const storageKey = buildStorageKey(user?.id);

  useEffect(() => {
    // forceOpen siempre tiene prioridad (botón manual / pruebas).
    if (forceOpen) {
      setOpen(true);
      return;
    }
    // Switch global apagado → no aparece automático.
    if (!WHATS_NEW_ENABLED) return;
    // Esperar a que el usuario esté logueado para usar su id en la key.
    if (!user?.id) return;
    try {
      const last = localStorage.getItem(storageKey);
      // Solo abre si nunca vio esta versión.
      if (last !== CURRENT_RELEASE.version) {
        setOpen(true);
      }
    } catch {
      // localStorage bloqueado — silencioso
    }
  }, [forceOpen, user?.id, storageKey]);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, CURRENT_RELEASE.version);
    } catch {
      // ignore
    }
    onClose?.();
  };

  const featureCount = CURRENT_RELEASE.features.length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 32px 64px -12px rgba(0,70,128,0.35)",
          bgcolor: "#fff",
          maxWidth: 480,
        },
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          px: 3.5,
          pt: 4,
          pb: 3.5,
          background:
            "linear-gradient(135deg, #002d52 0%, #004680 50%, #0070c0 100%)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Patrón de puntos */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1.5px)",
            backgroundSize: "16px 16px",
            pointerEvents: "none",
          }}
        />

        {/* Glow esquina */}
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        {/* Brillo diagonal animado */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "60%",
            height: "100%",
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            opacity: 0,
            animation: `${shimmer} 4s ease-in-out 0.3s infinite`,
            pointerEvents: "none",
          }}
        />

        {/* Sparkles decorativos */}
        <AutoAwesomeIcon
          sx={{
            position: "absolute",
            top: 18,
            right: 60,
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            animation: `${sparkle} 2.2s ease-in-out infinite`,
          }}
        />
        <AutoAwesomeIcon
          sx={{
            position: "absolute",
            bottom: 24,
            right: 90,
            fontSize: 10,
            color: "rgba(255,255,255,0.6)",
            animation: `${sparkle} 2.6s ease-in-out 0.5s infinite`,
          }}
        />
        <AutoAwesomeIcon
          sx={{
            position: "absolute",
            top: 42,
            right: 24,
            fontSize: 8,
            color: "rgba(255,255,255,0.5)",
            animation: `${sparkle} 1.8s ease-in-out 0.9s infinite`,
          }}
        />

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "rgba(255,255,255,0.85)",
            zIndex: 2,
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)", color: "#fff" },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Icono + chips */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ position: "relative", mb: 2 }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "none",
              animation: `${float} 3.5s ease-in-out infinite`,
            }}
          >
            <RocketLaunchOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            <Chip
              label={`v${CURRENT_RELEASE.version}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.22)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                backdropFilter: "blur(4px)",
              }}
            />
            <Chip
              label={`${featureCount} novedad${featureCount === 1 ? "" : "es"}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "#fbbf24",
                color: "#78350f",
              }}
            />
          </Stack>
        </Stack>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ position: "relative", lineHeight: 1.15, letterSpacing: "-0.01em" }}
        >
          {CURRENT_RELEASE.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            position: "relative",
            color: "rgba(255,255,255,0.82)",
            mt: 0.75,
            fontWeight: 500,
          }}
        >
          {CURRENT_RELEASE.subtitle}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            position: "relative",
            color: "rgba(255,255,255,0.6)",
            mt: 0.5,
            display: "block",
            fontSize: "0.72rem",
          }}
        >
          Publicado el {CURRENT_RELEASE.date}
        </Typography>
      </Box>

      {/* ── Lista features ──────────────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 3, bgcolor: "#fff" }}>
        <Stack spacing={2.5}>
          {CURRENT_RELEASE.features.map((f, idx) => {
            const cat: WhatsNewCategory = f.category ?? "mejora";
            const meta = CATEGORY_META[cat];
            return (
              <Box
                key={idx}
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2.25,
                  pr: 1,
                  opacity: 0,
                  animation: `${slideUp} 0.5s ease-out ${idx * 0.09 + 0.15}s forwards`,
                }}
              >
                {/* Icono circular tintado */}
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: meta.color,
                  }}
                >
                  {f.icon}
                </Box>

                {/* Texto */}
                <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ rowGap: 0.5, mb: 0.75 }}
                  >
                    <Typography
                      fontWeight={700}
                      color="#0f172a"
                      sx={{
                        lineHeight: 1.3,
                        fontSize: "0.95rem",
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {f.title}
                    </Typography>
                    <Chip
                      label={meta.label}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        bgcolor: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </Stack>
                  <Typography
                    color="#64748b"
                    sx={{
                      lineHeight: 1.6,
                      fontSize: "0.83rem",
                      maxWidth: "95%",
                    }}
                  >
                    {f.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #eef2f7",
          background: "linear-gradient(180deg, #fafcff 0%, #f1f6fb 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
          Gracias por usar Kancan
        </Typography>
        <Button
          onClick={handleClose}
          variant="contained"
          disableElevation
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3.5,
            py: 0.85,
            fontSize: "0.82rem",
            background: "linear-gradient(135deg, #004680 0%, #0058a3 100%)",
            boxShadow: "0 4px 14px -4px rgba(0,70,128,0.5)",
            "&:hover": {
              background: "linear-gradient(135deg, #003a6b 0%, #004680 100%)",
              boxShadow: "0 6px 18px -4px rgba(0,70,128,0.6)",
            },
          }}
        >
          ¡Entendido!
        </Button>
      </Box>
    </Dialog>
  );
}
