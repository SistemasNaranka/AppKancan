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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { TransitionProps } from "@mui/material/transitions";
import { CURRENT_RELEASE } from "../config/whatsNew";

const STORAGE_KEY = "kancan_last_seen_version";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  /** Si true, abre siempre (uso manual desde menú "Novedades"). */
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WhatsNewModal({ forceOpen, onClose }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (true) {
        setOpen(true);
      }
    } catch {
      // localStorage bloqueado — silencioso
    }
  }, [forceOpen]);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_RELEASE.version);
    } catch {
      // ignore
    }
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 24px 48px -12px rgba(0,70,128,0.25)",
          bgcolor: "#fff",
        },
      }}
    >
      {/* Header gradient */}
      <Box
        sx={{
          position: "relative",
          px: 3,
          pt: 3.5,
          pb: 3,
          background:
            "linear-gradient(135deg, #004680 0%, #0058a3 60%, #0070c0 100%)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "rgba(255,255,255,0.85)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.12)", color: "#fff" },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeOutlinedIcon sx={{ fontSize: 20, color: "#fff" }} />
          </Box>
          <Chip
            label={`v${CURRENT_RELEASE.version}`}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 700,
              bgcolor: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          />
        </Stack>

        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
          {CURRENT_RELEASE.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.78)", display: "block", mt: 0.5 }}
        >
          {CURRENT_RELEASE.subtitle} · {CURRENT_RELEASE.date}
        </Typography>
      </Box>

      {/* Lista features */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={1.75}>
          {CURRENT_RELEASE.features.map((f, idx) => (
            <Stack
              key={idx}
              direction="row"
              spacing={1.75}
              alignItems="flex-start"
              sx={{
                p: 1.25,
                borderRadius: 2,
                transition: "background-color 0.18s",
                "&:hover": { bgcolor: "#f0f6fc" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #e8f0f9 0%, #dce8f5 100%)",
                }}
              >
                {f.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="#1a2a3a"
                  sx={{ lineHeight: 1.3, mb: 0.3 }}
                >
                  {f.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="#64748b"
                  sx={{ lineHeight: 1.4, display: "block" }}
                >
                  {f.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #f1f5f9",
          background: "linear-gradient(180deg, #fafcff 0%, #f1f6fb 100%)",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          variant="contained"
          disableElevation
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            bgcolor: "#004680",
            "&:hover": { bgcolor: "#003a6b" },
          }}
        >
          Entendido
        </Button>
      </Box>
    </Dialog>
  );
}
