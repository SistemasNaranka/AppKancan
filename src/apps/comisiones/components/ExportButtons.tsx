import React, { useState } from 'react';
import { MesResumen } from '../types';
import { 
  Download as DownloadIcon, 
  Description,
  FileDownload as FileDownloadIcon 
} from '@mui/icons-material';
import { 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  Typography
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../lib/utils';

interface ExportButtonsProps {
  mesResumen: MesResumen | null;
  mes: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ mesResumen, mes }) => {
  const [exportType, setExportType] = useState<string>('');

  const handleExportCSV = () => {
    if (!mesResumen) return;

    let csvContent = 'Calculadora de Comisiones por Cumplimiento\n';
    csvContent += `Mes: ${mes}\n\n`;

    csvContent += 'RESUMEN MENSUAL\n';
    csvContent += `Total Comisiones,${mesResumen.total_comisiones.toFixed(2)}\n`;
    csvContent += `Comisiones Gerentes,${mesResumen.comisiones_por_rol.gerente.toFixed(2)}\n`;
    csvContent += `Comisiones Asesores,${mesResumen.comisiones_por_rol.asesor.toFixed(2)}\n`;
    csvContent += `Comisiones Cajeros,${mesResumen.comisiones_por_rol.cajero.toFixed(2)}\n\n`;

    csvContent += 'DETALLE POR TIENDA Y EMPLEADO\n';
    csvContent += 'Tienda,Fecha,Presupuesto Tienda,Ventas Tienda,Cumplimiento Tienda %,Empleado,Rol,Presupuesto,Ventas,Cumplimiento %,Comisión %,Comisión $\n';

    mesResumen.tiendas.forEach(tienda => {
      tienda.empleados.forEach((empleado, idx) => {
        csvContent += `${tienda.tienda},${tienda.fecha},${formatCurrency(tienda.presupuesto_tienda)},${formatCurrency(tienda.ventas_tienda)},${tienda.cumplimiento_tienda_pct.toFixed(2)},${empleado.nombre},${empleado.rol},${formatCurrency(empleado.presupuesto)},${formatCurrency(empleado.ventas)},${empleado.cumplimiento_pct.toFixed(2)},${empleado.comision_pct.toFixed(2)},${formatCurrency(empleado.comision_monto)}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comisiones_${mes.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!mesResumen) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Título
    doc.setFontSize(16);
    doc.text('Calculadora de Comisiones por Cumplimiento', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Mes: ${mes}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Resumen
    doc.setFontSize(11);
    doc.text('RESUMEN MENSUAL', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total Comisiones: $${formatCurrency(mesResumen.total_comisiones)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Comisiones Gerentes: $${formatCurrency(mesResumen.comisiones_por_rol.gerente)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Comisiones Asesores: $${formatCurrency(mesResumen.comisiones_por_rol.asesor)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Comisiones Cajeros: $${formatCurrency(mesResumen.comisiones_por_rol.cajero)}`, 25, yPosition);
    yPosition += 15;

    // Tabla de detalle
    const tableData = mesResumen.tiendas.flatMap(tienda =>
      tienda.empleados.map(empleado => [
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
        empleado.comision_pct.toFixed(2),
        formatCurrency(empleado.comision_monto),
      ])
    );

    autoTable(doc, {
      head: [['Tienda', 'Fecha', 'Presupuesto Tienda', 'Ventas Tienda', 'Cumpl. %', 'Empleado', 'Rol', 'Presupuesto', 'Ventas', 'Cumpl. %', 'Comisión %', 'Comisión $']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`comisiones_${mes.replace(' ', '_')}.pdf`);
  };

  const handleExport = (value: string) => {
    setExportType(value);
    if (value === 'csv') {
      handleExportCSV();
    } else if (value === 'pdf') {
      handleExportPDF();
    }
    // Reset the select after export
    setTimeout(() => setExportType(''), 100);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Exportar</InputLabel>
        <Select
          value={exportType}
          onChange={(e) => handleExport(e.target.value as string)}
          disabled={!mesResumen}
          label="Exportar"
        >
          <MenuItem value="csv">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DownloadIcon fontSize="small" />
              <Typography>Archivo CSV</Typography>
            </Box>
          </MenuItem>
          <MenuItem value="pdf">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description fontSize="small" />
              <Typography>Archivo PDF</Typography>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
