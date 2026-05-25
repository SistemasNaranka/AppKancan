import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { INotification } from '../interfaces/notification.interface';

interface TableProps {
  registros: INotification[];
  onSelect: (n: INotification | null) => void; 
}

export default function NotificationTable({ registros, onSelect }: TableProps) {
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  // Estados para el menú de los tres puntos
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<INotification | null>(null);

  const totalPaginas = Math.ceil(registros.length / porPagina) || 1;
  const dataVisible = registros.slice((pagina - 1) * porPagina, pagina * porPagina);

  const getBadgeConfig = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case 'ENTREGADO': return { bg: '#e2f4f2', color: '#16a34a' };
      case 'ERROR': return { bg: '#f9e2e4', color: '#dc2626' };
      case 'ADVERTENCIA': return { bg: '#fff6e2', color: '#ca8a04' };
      case 'EN COLA':
      default: return { bg: '#e2ebf4', color: '#1e40af' };
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, row: INotification) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleViewDetails = () => {
    if (selectedRow) {
      onSelect(selectedRow);
    }
    handleCloseMenu();
  };

  // Ajustamos el layout de columnas removiendo el espacio de la flecha
  const gridLayout = '2fr 5fr 1.5fr 2fr 1fr';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* ENCABEZADO DE LA TABLA */}
      <Box sx={{ display: 'grid', gridTemplateColumns: gridLayout, gap: 3, px: 3, mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px' }}>ID / ASUNTO</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px' }}>MENSAJE LOGÍSTICO</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px' }}>ESTADO</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px' }}>FECHA Y HORA</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textAlign: 'center' }}>ACCIONES</Typography>
      </Box>

      {/* CONTENEDOR DE FILAS */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.02)'
        }}
      >
        {dataVisible.map((item) => {
          const badge = getBadgeConfig(item.tipo_notificacion);
          
          return (
            <Box 
              key={item.id} 
              sx={{ 
                borderBottom: '1px solid #f1f5f9',
                '&:hover': { bgcolor: '#f8fafc' },
                transition: 'background-color 0.2s'
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: gridLayout, alignItems: 'center', gap: 3, p: 2.5, px: 3 }}>
                
                {/* ID / Asunto */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', display: 'block', mb: 0.2 }}>
                    {item.id}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    {item.titulo}
                  </Typography>
                </Box>
                
                {/* Mensaje resumido */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b', 
                    fontSize: '0.88rem', 
                    pr: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.mensaje}
                </Typography>
                
                {/* Estado Badge */}
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ 
                    bgcolor: badge.bg, 
                    color: badge.color, 
                    px: 2.2, 
                    py: 0.5, 
                    borderRadius: '12px', 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    textAlign: 'center', 
                    minWidth: '90px',
                    letterSpacing: '0.3px'
                  }}>
                    {item.tipo_notificacion}
                  </Box>
                </Box>

                {/* Fecha y Hora */}
                <Box>
                  <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: '0.88rem' }}>
                    {item.fecha}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', mt: 0.2 }}>
                    {item.hora}
                  </Typography>
                </Box>

                {/* Acciones (Tres Puntos) */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleOpenMenu(e, item)}
                    sx={{ color: '#64748b', '&:hover': { bgcolor: '#e2e8f0' } }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          );
        })}

        {/* MENÚ FLOTANTE PARA LOS TRES PUNTOS */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          elevation={2}
          onClick={handleCloseMenu}
          PaperProps={{
            sx: {
              borderRadius: '10px',
              minWidth: '130px',
              border: '1px solid #e2e8f0',
              boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05)',
            }
          }}
        >
          <MenuItem 
            onClick={handleViewDetails}
            sx={{ 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: '#334155',
              py: 1
            }}
          >
            Ver detalles
          </MenuItem>
        </Menu>

        {/* PIE DE TABLA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, px: 3, bgcolor: '#f8fafc' }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            Mostrando <b style={{ color: '#004a99' }}>{dataVisible.length}</b> de <b style={{ color: '#004a99' }}>{registros.length}</b> registros
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
            <Box onClick={() => setPagina(prev => Math.max(prev - 1, 1))} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}>‹</Box>
            {[...Array(totalPaginas)].map((_, i) => (
              <Box key={i} onClick={() => setPagina(i + 1)} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', bgcolor: pagina === i + 1 ? '#004a99' : '#ffffff', color: pagina === i + 1 ? '#ffffff' : '#004a99', border: pagina === i + 1 ? '1px solid #004a99' : '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: pagina === i + 1 ? '#004a99' : '#f1f5f9' } }}>{i + 1}</Box>
            ))}
            <Box onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas))} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', bgcolor: '#ffffff', color: '#004a99', fontWeight: 700, fontSize: '0.85rem', userSelect: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}>›</Box>
          </Box>
        </Box>

      </Paper>
    </Box>
  );
}