import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
}) => {
  // Generar los números de página a mostrar
  const generarPaginas = () => {
    const paginas: (number | string)[] = [];
    
    if (totalPaginas <= 7) {
      // Si hay 7 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      paginas.push(1);
      
      if (paginaActual > 3) {
        paginas.push('...');
      }
      
      // Páginas alrededor de la actual
      const inicio = Math.max(2, paginaActual - 1);
      const fin = Math.min(totalPaginas - 1, paginaActual + 1);
      
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
      
      if (paginaActual < totalPaginas - 2) {
        paginas.push('...');
      }
      
      // Siempre mostrar la última página
      paginas.push(totalPaginas);
    }
    
    return paginas;
  };

  const paginas = generarPaginas();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 2 }}>
      {/* Botón anterior */}
      <IconButton
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        size="small"
        sx={{ color: paginaActual === 1 ? '#ccc' : '#666' }}
      >
        <ChevronLeftIcon />
      </IconButton>

      {/* Números de página */}
      {paginas.map((pagina, index) => (
        pagina === '...' ? (
          <Typography key={`dots-${index}`} sx={{ px: 1, color: '#666' }}>
            ...
          </Typography>
        ) : (
          <IconButton
            key={pagina}
            onClick={() => onCambiarPagina(pagina as number)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: paginaActual === pagina ? '#015aa3e8' : 'transparent',
              color: paginaActual === pagina ? '#fff' : '#333',
              fontWeight: paginaActual === pagina ? 'bold' : 'normal',
              '&:hover': {
                backgroundColor: paginaActual === pagina ? '#015aa3e8' : '#e3f2fd',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
              {pagina}
            </Typography>
          </IconButton>
        )
      ))}

      {/* Botón siguiente */}
      <IconButton
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas || totalPaginas === 0}
        size="small"
        sx={{ color: paginaActual === totalPaginas || totalPaginas === 0 ? '#ccc' : '#666' }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};

export default Pagination;