import type { ReactNode } from "react";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import React from "react";

export type WhatsNewCategory = "nuevo" | "mejora" | "correccion";

export interface WhatsNewFeature {
  icon: ReactNode;
  title: string;
  description: string;
  category?: WhatsNewCategory;
}

export interface WhatsNewRelease {
  version: string;
  date: string;
  title: string;
  subtitle: string;
  features: WhatsNewFeature[];
}

/**
 * Switch global del modal de Novedades.
 *  - true  → el modal aparece automáticamente para usuarios que no hayan visto la versión actual.
 *  - false → el modal queda desactivado para todos (no aparece automático).
 *
 * El parámetro `forceOpen={true}` del componente sigue funcionando aunque esté en false,
 * útil para un botón "Ver novedades" manual o pruebas internas.
 */
export const WHATS_NEW_ENABLED = true;

export const CATEGORY_META: Record<WhatsNewCategory, { label: string; color: string; bg: string; border: string }> = {
  nuevo:       { label: "Nuevo",      color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  mejora:      { label: "Mejora",     color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  correccion:  { label: "Corrección", color: "#b45309", bg: "#fef3c7", border: "#fde047" },
};

export const CURRENT_RELEASE: WhatsNewRelease = {
  version: "1.4.0",
  date: "30 de abril, 2026",
  title: "Novedades en Kancan",
  subtitle: "Mejoras pensadas para tu día a día",
  features: [
    {
      icon: React.createElement(EventAvailableOutlinedIcon, {
        sx: { fontSize: 20, color: "#fff" },
      }),
      title: "Festivos en Reservas",
      description:
        "Calendarios y modales muestran días festivos de Colombia con tooltip.",
      category: "nuevo",
    },
    {
      icon: React.createElement(WorkOutlineIcon, {
        sx: { fontSize: 20, color: "#fff" },
      }),
      title: "Cambio de cargo",
      description:
        "Modifica el cargo de un empleado y se sincroniza al instante en el contrato.",
      category: "mejora",
    },
    {
      icon: React.createElement(AutoStoriesOutlinedIcon, {
        sx: { fontSize: 20, color: "#fff" },
      }),
      title: "Centro de tutoriales renovado",
      description:
        "Nuevo panel lateral con acceso rápido a las guías de cada módulo.",
      category: "mejora",
    },
  ],
};
