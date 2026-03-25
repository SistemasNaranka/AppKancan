import React from 'react';
import { Alert, AlertTitle, Box, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import BarChartIcon from '@mui/icons-material/BarChart';
import StoreIcon from '@mui/icons-material/Store';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { ResultadoValidacion } from '../utils/fileNormalization';

interface ValidationAlertProps {
    validaciones: Record<string, ResultadoValidacion>;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ validaciones }) => {
    const [expandido, setExpandido] = React.useState(false);

    // Filtrar solo archivos con errores o advertencias
    const archivosConProblemas = Object.entries(validaciones).filter(
        ([_, validacion]) => validacion.errores.length > 0 || validacion.advertencias.length > 0
    );

    if (archivosConProblemas.length === 0) {
        return null;
    }

    // Determinar severidad general
    const hayErrores = archivosConProblemas.some(([_, v]) => v.errores.length > 0);
    const severity = hayErrores ? 'error' : 'warning';

    return (
        <Alert
            severity={severity}
            sx={{ mb: 2 }}
            action={
                <IconButton
                    size="small"
                    onClick={() => setExpandido(!expandido)}
                    sx={{ color: 'inherit' }}
                >
                    {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            }
        >
            <AlertTitle>
                {hayErrores ? 'Errores en Normalización' : 'Advertencias en Normalización'}
            </AlertTitle>

            <Typography variant="body2" sx={{ mb: 1 }}>
                {archivosConProblemas.length} archivo(s) con problemas de mapeo de tiendas.
                {!expandido && ' Haz clic para ver detalles.'}
            </Typography>

            <Collapse in={expandido}>
                <Box sx={{ mt: 2 }}>
                    {archivosConProblemas.map(([nombreArchivo, validacion]) => (
                        <Box key={nombreArchivo} sx={{ mb: 2, pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <InsertDriveFileIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {nombreArchivo}
                                </Typography>
                            </Box>

                            {/* Estadísticas */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BarChartIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    {validacion.estadisticas.filasMapeadas}/{validacion.estadisticas.totalFilas} filas mapeadas
                                    ({validacion.estadisticas.porcentajeMapeado.toFixed(1)}%)
                                </Typography>
                            </Box>

                            {validacion.estadisticas.tiendasUnicas.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <StoreIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        Tiendas encontradas: {validacion.estadisticas.tiendasUnicas.join(', ')}
                                    </Typography>
                                </Box>
                            )}

                            {/* Errores */}
                            {validacion.errores.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ErrorIcon fontSize="small" color="error" />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            Errores:
                                        </Typography>
                                    </Box>
                                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                        {validacion.errores.map((error, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2">{error}</Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </Box>
                            )}

                            {/* Advertencias */}
                            {validacion.advertencias.length > 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon fontSize="small" color="warning" />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                            Advertencias:
                                        </Typography>
                                    </Box>
                                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                        {validacion.advertencias.slice(0, 5).map((advertencia, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2">{advertencia}</Typography>
                                            </li>
                                        ))}
                                        {validacion.advertencias.length > 5 && (
                                            <li>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    ... y {validacion.advertencias.length - 5} advertencias más
                                                </Typography>
                                            </li>
                                        )}
                                    </ul>
                                </Box>
                            )}
                        </Box>
                    ))}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'flex-start' }}>
                        <LightbulbIcon fontSize="small" color="info" sx={{ mt: 0.3 }} />
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            Sugerencia: Verifica que los nombres de tienda en los archivos coincidan con los configurados en Directus.
                            Abre la consola del navegador (F12) para ver detalles completos del mapeo.
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Alert>
    );
};

export default ValidationAlert;
