import type { ReactNode } from "react";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import React from "react";

export interface WhatsNewFeature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface WhatsNewRelease {
  version: string;
  date: string;
  title: string;
  subtitle: string;
  features: WhatsNewFeature[];
}

export const CURRENT_RELEASE: WhatsNewRelease = {
  version: "1.4.0",
  date: "30 de abril, 2026",
  title: "Novedades en Kancan",
  subtitle: "Mejoras pensadas para tu día a día",
  features: [
    {
      icon: React.createElement(EventAvailableOutlinedIcon, {
        sx: { fontSize: 18, color: "#004680" },
      }),
      title: "Festivos en Reservas",
      description:
        "Calendarios y modales muestran días festivos de Colombia con tooltip.",
    },
    {
      icon: React.createElement(WorkOutlineIcon, {
        sx: { fontSize: 18, color: "#004680" },
      }),
      title: "Cambio de cargo",
      description:
        "Modifica el cargo de un empleado y se sincroniza al instante en el contrato.",
    },
    {
      icon: React.createElement(AutoStoriesOutlinedIcon, {
        sx: { fontSize: 18, color: "#004680" },
      }),
      title: "Centro de tutoriales renovado",
      description:
        "Nuevo panel lateral con acceso rápido a las guías de cada módulo.",
    },
  ],
};
