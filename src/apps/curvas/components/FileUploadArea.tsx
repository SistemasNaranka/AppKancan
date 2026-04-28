import { useCallback, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import type { EstadoCarga } from '../types';

interface FileUploadAreaProps {
  tipo: 'matriz_general' | 'detalle_producto_a' | 'detalle_producto_b';
  titulo: string;
  descripcion: string;
  acceptedFiles: string;
  onUpload: (file: File) => void;
  estado?: EstadoCarga;
}

/**
 * Área de carga de archivos con drag & drop
 * 
 * Características:
 * - Soporte para drag & drop
 * - Indicadores de progreso
 * - Manejo de errores por archivo
 * - Validación de tipo de archivo
 */
export const FileUploadArea = ({
  tipo,
  titulo,
  descripcion,
  acceptedFiles,
  onUpload,
  estado = 'vacio',
}: FileUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Validar y procesar archivo
  const processFile = useCallback((file: File) => {
    setError(null);
    
    // Validar tipo de archivo
    const validExtensions = acceptedFiles.split(',').map(ext => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.some(ext => ext === fileExtension || ext.includes(fileExtension.replace('.', '')))) {
      setError(`Tipo de archivo no válido. Aceptados: ${acceptedFiles}`);
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo de 10MB');
      return;
    }

    setFileName(file.name);
    onUpload(file);
  }, [acceptedFiles, onUpload]);

  // Manejar drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Manejar click para seleccionar archivo
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Obtener color de estado
  const getStatusColor = () => {
    switch (estado) {
      case 'exito':
        return 'success.main';
      case 'error':
        return 'error.main';
      case 'cargando':
      case 'procesando':
        return 'primary.main';
      default:
        return 'grey.400';
    }
  };

  // Obtener icono de estado
  const getStatusIcon = () => {
    switch (estado) {
      case 'exito':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={estado === 'vacio' || estado === 'error' ? handleClick : undefined}
      sx={{
        p: 3,
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : error ? 'error.main' : estado === 'exito' ? 'success.main' : 'grey.300',
        bgcolor: isDragging ? 'primary.light' : estado === 'exito' ? 'success.light' : estado === 'error' ? 'error.light' : 'background.paper',
        borderRadius: 2,
        cursor: estado === 'vacio' || estado === 'error' ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: estado === 'vacio' || estado === 'error' ? 'primary.main' : undefined,
          bgcolor: estado === 'vacio' || estado === 'error' ? 'action.hover' : undefined,
        },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFiles}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Icono */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getStatusColor(),
          }}
        >
          {estado === 'exito' || estado === 'error' ? (
            getStatusIcon()
          ) : (
            <CloudUploadIcon sx={{ fontSize: 32 }} />
          )}
        </Box>

        {/* Contenido */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {titulo}
            </Typography>
            <Chip
              label={
                tipo === 'matriz_general' ? 'TEXTIL' :
                tipo === 'detalle_producto_a' ? 'CALZADO/BOLSO' :
                tipo === 'detalle_producto_b' ? 'CALZADO/BOLSO' :
                String(tipo).replace('_', ' ').toUpperCase()
              }
              size="small"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {descripcion}
          </Typography>
          
          {/* Nombre del archivo o estado */}
          {fileName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <InsertDriveFileIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {fileName}
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          {/* Barra de progreso */}
          {(estado === 'cargando' || estado === 'procesando') && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={estado === 'cargando' ? 30 : 70}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {estado === 'cargando' ? 'Cargando archivo...' : 'Procesando datos...'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Botón de cerrar si hay archivo */}
        {fileName && estado === 'exito' && (
          <IconButton size="small" color="default">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default FileUploadArea;
