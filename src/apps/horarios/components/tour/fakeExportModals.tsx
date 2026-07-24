import React from "react";
import { FakeExportDialog, buildExportModalTargets } from "./FakeExportDialog";

export const FakeExportModal: React.FC<{ open: boolean; activeField: string | null }> = (props) => (
  <FakeExportDialog
    {...props}
    title="Exportar pausas activas"
    subtitle="Reportes de pausas y eventos de la tienda"
    idPrefix="tour-export"
  />
);

export const FakeExportNovedadesModal: React.FC<{ open: boolean; activeField: string | null }> = (props) => (
  <FakeExportDialog
    {...props}
    title="Exportar novedades"
    subtitle="Selecciona el rango de fechas"
    idPrefix="tour-nov-export"
  />
);

export const FakeExportHistorialModal: React.FC<{ open: boolean; activeField: string | null }> = (props) => (
  <FakeExportDialog
    {...props}
    title="Exportar historial"
    subtitle="Selecciona el rango de fechas"
    idPrefix="tour-hist-export"
    maxWidth={460}
    showDetalladaOption
  />
);

export const exportModalTargets = buildExportModalTargets("tour-export");
export const exportNovedadesModalTargets = buildExportModalTargets("tour-nov-export");
export const exportHistorialModalTargets = buildExportModalTargets("tour-hist-export", true);