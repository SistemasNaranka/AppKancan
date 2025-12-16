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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../lib/utils";
import { useUserPolicies } from "../hooks/useUserPolicies";

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

  // Solo mostrar si el usuario tiene la política readComisionesAdmin
  if (!hasPolicy("readComisionesAdmin")) {
    return null;
  }

  const handleExportCSV = () => {
    if (!mesResumen) return;

    // Calcular totales dinámicos basados en datos filtrados
    const totalComisiones = mesResumen.tiendas.reduce(
      (total: number, tienda: any) => {
        return (
          total +
          tienda.empleados.reduce((tiendaTotal: number, empleado: any) => {
            return tiendaTotal + (empleado.comision_monto || 0);
          }, 0)
        );
      },
      0
    );

    const comisionesPorRol = mesResumen.tiendas.reduce(
      (acc: any, tienda: any) => {
        tienda.empleados.forEach((empleado: any) => {
          acc[empleado.rol] =
            (acc[empleado.rol] || 0) + (empleado.comision_monto || 0);
        });
        return acc;
      },
      {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
      }
    );

    let csvContent = "Calculadora de Comisiones por Cumplimiento\n";
    csvContent += `Mes: ${mes}\n\n`;

    csvContent += "RESUMEN MENSUAL\n";
    csvContent += `Total Comisiones,${totalComisiones.toFixed(2)}\n`;
    csvContent += `Comisiones Gerentes,${comisionesPorRol.gerente.toFixed(
      2
    )}\n`;
    csvContent += `Comisiones Asesores,${comisionesPorRol.asesor.toFixed(2)}\n`;
    csvContent += `Comisiones Cajeros,${comisionesPorRol.cajero.toFixed(
      2
    )}\n\n`;

    csvContent += "DETALLE POR TIENDA Y EMPLEADO\n";
    csvContent +=
      "Tienda,Fecha,Presupuesto Tienda,Ventas Tienda,Cumplimiento Tienda %,Empleado,Rol,Presupuesto,Ventas,Cumplimiento %,Comisión %,Comisión $\n";

    mesResumen.tiendas.forEach((tienda) => {
      tienda.empleados.forEach((empleado, idx) => {
        csvContent += `${tienda.tienda},${tienda.fecha},${formatCurrency(
          tienda.presupuesto_tienda
        )},${formatCurrency(
          tienda.ventas_tienda
        )},${tienda.cumplimiento_tienda_pct.toFixed(2)},${empleado.nombre},${
          empleado.rol
        },${formatCurrency(empleado.presupuesto)},${formatCurrency(
          empleado.ventas
        )},${empleado.cumplimiento_pct.toFixed(2)},${(
          empleado.comision_pct * 100
        ).toFixed(2)},${formatCurrency(empleado.comision_monto)}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `comisiones_${mes.replace(" ", "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!mesResumen) return;

    // Calcular totales dinámicos basados en datos filtrados
    const totalComisiones = mesResumen.tiendas.reduce(
      (total: number, tienda: any) => {
        return (
          total +
          tienda.empleados.reduce((tiendaTotal: number, empleado: any) => {
            return tiendaTotal + (empleado.comision_monto || 0);
          }, 0)
        );
      },
      0
    );

    const comisionesPorRol = mesResumen.tiendas.reduce(
      (acc: any, tienda: any) => {
        tienda.empleados.forEach((empleado: any) => {
          acc[empleado.rol] =
            (acc[empleado.rol] || 0) + (empleado.comision_monto || 0);
        });
        return acc;
      },
      {
        gerente: 0,
        asesor: 0,
        cajero: 0,
        logistico: 0,
      }
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Título
    doc.setFontSize(16);
    doc.text(
      "Calculadora de Comisiones por Cumplimiento",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Mes: ${mes}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Resumen
    doc.setFontSize(11);
    doc.text("RESUMEN MENSUAL", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(
      `Total Comisiones: $${formatCurrency(totalComisiones)}`,
      25,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Comisiones Gerentes: $${formatCurrency(comisionesPorRol.gerente)}`,
      25,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Comisiones Asesores: $${formatCurrency(comisionesPorRol.asesor)}`,
      25,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Comisiones Cajeros: $${formatCurrency(comisionesPorRol.cajero)}`,
      25,
      yPosition
    );
    yPosition += 15;

    // Tabla de detalle
    const tableData = mesResumen.tiendas.flatMap((tienda) =>
      tienda.empleados.map((empleado) => [
        tienda.tienda,
        tienda.fecha,
        formatCurrency(tienda.presupuesto_tienda),
        formatCurrency(tienda.ventas_tienda),
        tienda.cumplimiento_tienda_pct.toFixed(2),
        empleado.nombre,
        empleado.rol,
        formatCurrency(empleado.presupuesto),
        formatCurrency(empleado.ventas),
        empleado.cumplimiento_pct.toFixed(2),
        (empleado.comision_pct * 100).toFixed(2),
        formatCurrency(empleado.comision_monto),
      ])
    );

    autoTable(doc, {
      head: [
        [
          "Tienda",
          "Fecha",
          "Presupuesto Tienda",
          "Ventas Tienda",
          "Cumpl. %",
          "Empleado",
          "Rol",
          "Presupuesto",
          "Ventas",
          "Cumpl. %",
          "Comisión %",
          "Comisión $",
        ],
      ],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`comisiones_${mes.replace(" ", "_")}.pdf`);
  };

  const handleExport = (value: string) => {
    setExportType(value);
    if (value === "csv") {
      handleExportCSV();
    } else if (value === "pdf") {
      handleExportPDF();
    }
    // Reset the select after export
    setTimeout(() => setExportType(""), 100);
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 0.5, sm: 1 },
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <FormControl
        size="small"
        sx={{
          minWidth: { xs: 100, sm: 140 },
          flex: { xs: "1 1 auto", sm: "0 0 auto" },
        }}
      >
        <InputLabel>Exportar</InputLabel>
        <Select
          value={exportType}
          onChange={(e) => handleExport(e.target.value as string)}
          disabled={!mesResumen}
          label="Exportar"
        >
          <MenuItem value="csv">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DownloadIcon fontSize="small" />
              <Typography>CSV</Typography>
            </Box>
          </MenuItem>
          <MenuItem value="pdf">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Description fontSize="small" />
              <Typography>PDF</Typography>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
