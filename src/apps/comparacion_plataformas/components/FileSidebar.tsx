import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Chip } from '@mui/material';
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import { ArchivoSubido } from '../types/mapeo.types';

interface FileSidebarProps {
    archivos: ArchivoSubido[];
    archivoSeleccionado: ArchivoSubido | null;
    setArchivoSeleccionado: (archivo: ArchivoSubido) => void;
    handleEliminarArchivo: (nombre: string) => void;
}

const FileSidebar: React.FC<FileSidebarProps> = ({
    archivos,
    archivoSeleccionado,
    setArchivoSeleccionado,
    handleEliminarArchivo
}) => {
    return (
        <Card sx={{ width: 335, height: "fit-content", borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Archivos Subidos ({archivos.length})
                </Typography>

                {archivos.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                        No hay archivos subidos
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {archivos.map((archivo) => (
                            <Box
                                key={archivo.nombre}
                                onClick={() => setArchivoSeleccionado(archivo)}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 1.5,
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    backgroundColor:
                                        archivoSeleccionado?.nombre === archivo.nombre
                                            ? "#e3f2fd"
                                            : "#f5f5f5",
                                    border:
                                        archivoSeleccionado?.nombre === archivo.nombre
                                            ? "2px solid #1976d2"
                                            : "2px solid transparent",
                                    "&:hover": {
                                        backgroundColor: "#e3f2fd",
                                    },
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <InsertDriveFileIcon sx={{ color: "#1976d2" }} />
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: "bold",
                                                maxWidth: 150,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {archivo.nombre}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                            <Chip
                                                label={archivo.tipo}
                                                size="small"
                                                color="primary"
                                                sx={{ fontSize: "0.7rem", height: 20 }}
                                            />
                                            <Chip
                                                label={`${archivo.datos.length} filas`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: "0.7rem", height: 20 }}
                                            />
                                            {archivo.normalizado && (
                                                <Chip
                                                    label="Normalizado"
                                                    size="small"
                                                    color="success"
                                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                                />
                                            )}
                                            {!archivo.tipoArchivo && (
                                                <Chip
                                                    label="Sin mapeo"
                                                    size="small"
                                                    color="warning"
                                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEliminarArchivo(archivo.nombre);
                                    }}
                                    sx={{ color: "#d63e3e" }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default FileSidebar;
