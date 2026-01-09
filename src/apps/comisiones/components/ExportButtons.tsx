import React, { useState } from "react";
import { MesResumen } from "../types";
import {
  Download as DownloadIcon,
  Description,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
} from "@mui/material";
import { useUserPolicies } from "../hooks/useUserPolicies";
import CSVData from "./CSVData";
import { StoreFilterModal } from "./StoreFilterModal";

interface ExportButtonsProps {
  mesResumen: MesResumen | null;
  mes: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  mesResumen,
  mes,
}) => {
  const [exportType, setExportType] = useState<string>("");
  const { hasPolicy } = useUserPolicies();

  // Solo mostrar si el usuario tiene la política readComisionesAdmin o readComisionesComercial
  if (
    !hasPolicy("readComisionesAdmin") &&
    !hasPolicy("readComisionesComercial")
  ) {
    return null;
  }

  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const [selectedCSVType, setSelectedCSVType] = useState<
    "General" | "Detallada" | null
  >(null);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const availableStores = mesResumen?.tiendas.map((t) => t.tienda) || [];
  const [storeFilterOpen, setStoreFilterOpen] = useState(false);

  const handleExportGeneral = (stores: string[]) => {
    if (!mesResumen) return;

    const filteredTiendas = mesResumen.tiendas
      .filter((t) => stores.includes(t.tienda))
      .sort((a, b) => a.tienda.localeCompare(b.tienda));

    let csvContent = "Tienda,Presupuesto,Ventas,Cumplimiento,Comisiones\n";

    filteredTiendas.forEach((tienda) => {
      const totalComisiones = tienda.empleados.reduce(
        (tiendaTotal: number, empleado: any) => {
          return tiendaTotal + (empleado.comision_monto || 0);
        },
        0
      );

      csvContent += `${tienda.tienda},${tienda.presupuesto_tienda},${
        tienda.ventas_tienda
      },${tienda.cumplimiento_tienda_pct.toFixed(2)},${totalComisiones}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `comisiones_general_${mes.replace(" ", "_")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDetallada = (stores: string[], roles?: string[]) => {
    if (!mesResumen) return;

    const filteredTiendas = mesResumen.tiendas.filter((t) =>
      stores.includes(t.tienda)
    );

    let csvContent =
      "Tienda,Documento,Empleado,Dias laborados,Cargo,Presupuesto,Ventas,Cumplimiento %,Comision %,Comision $\n";

    filteredTiendas.forEach((tienda) => {
      tienda.empleados
        .filter(
          (empleado) =>
            !roles || roles.length === 0 || roles.includes(empleado.rol)
        )
        .forEach((empleado) => {
          csvContent += `${tienda.tienda},${empleado.documento},${empleado.nombre},${empleado.dias_laborados},${empleado.rol},${empleado.presupuesto},${empleado.ventas},${empleado.cumplimiento_pct},${empleado.comision_pct},${empleado.comision_monto}\n`;
        });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `comisiones_detallada_${mes.replace(" ", "_")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (
    type: string,
    csvType?: "General" | "Detallada",
    roles?: string[]
  ) => {
    if (type === "csv") {
      if (csvType) {
        setSelectedCSVType(csvType);
        if (roles) {
          setSelectedRoles(roles);
        }
        setStoreFilterOpen(true);
        setCsvModalOpen(false);
      } else {
        setCsvModalOpen(true);
      }
    }
  };

  const handleStoresSelected = (stores: string[]) => {
    setSelectedStores(stores);
    setStoreFilterOpen(false);
    if (selectedCSVType === "General") {
      handleExportGeneral(stores);
    } else if (selectedCSVType === "Detallada") {
      handleExportDetallada(stores, selectedRoles);
    }
    // Deseleccionar las tiendas y roles después de la descarga
    setSelectedStores([]);
    setSelectedRoles([]);
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport("csv")}
          disabled={!mesResumen}
        >
          Exportar CSV
        </Button>
      </Box>

      <CSVData
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSelectType={(type, roles) => handleExport("csv", type, roles)}
        mesResumen={mesResumen}
      />

      <StoreFilterModal
        showButton={false}
        open={storeFilterOpen}
        onClose={() => setStoreFilterOpen(false)}
        availableStores={availableStores}
        selectedStores={selectedStores}
        onStoresSelected={handleStoresSelected}
      />
    </>
  );
};
