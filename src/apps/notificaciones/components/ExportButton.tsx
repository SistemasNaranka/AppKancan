import React from 'react';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { INotification } from '../interfaces/notification.interface';

interface ExportProps {
  data: INotification[];
}

export default function ExportButton({ data }: ExportProps) {
  const exportarCSV = () => {
    const headers = 'ID,Titulo,Mensaje,Tipo,Progreso,Fecha,Hora\n';
    const rows = data.map(item => 
      `"${item.id}","${item.titulo}","${item.mensaje.replace(/<[^>]*>/g, '')}","${item.tipo_notificacion}",${item.progreso},"${item.fecha}","${item.hora}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Historial_Notificaciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="contained"
      startIcon={<DownloadIcon style={{ fontSize: '18px' }} />}
      onClick={exportarCSV}
      sx={{
        bgcolor: '#1e293b',
        color: '#fff',
        textTransform: 'none',
        borderRadius: '12px',
        fontWeight: 700,
        px: 3,
        py: 1,
        fontSize: '0.85rem',
        boxShadow: '0px 2px 4px rgba(15, 23, 42, 0.06)',
        '&:hover': { bgcolor: '#0f172a' }
      }}
    >
      Export History to CSV
    </Button>
  );
}