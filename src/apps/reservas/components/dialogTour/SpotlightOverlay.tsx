// Overlay oscuro con hueco recortado sobre el elemento target del paso activo del tour.

import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

interface SpotlightOverlayProps {
  targetEl: HTMLElement | null;
  open: boolean;
  padding?: number;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ targetEl, open }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetEl && open) {
      const updateRect = () => setRect(targetEl.getBoundingClientRect());
      updateRect();
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect);
      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect);
      };
    }
  }, [targetEl, open]);

  if (!open || !rect) return null;

  const padding = 8;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      <Box
        sx={{
          position: "fixed",
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: 3,
          pointerEvents: "none",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </Box>
  );
};
