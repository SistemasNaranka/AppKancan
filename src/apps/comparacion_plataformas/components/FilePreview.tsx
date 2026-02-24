import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { ArchivoSubido } from '../types/mapeo.types';
import { formatearValor } from '../utils/formatters';

interface FilePreviewProps {
    archivo: ArchivoSubido | null;
}

const FilePreview: React.FC<FilePreviewProps> = ({ archivo }) => {
    if (!archivo) {
        return (
            <Card sx={{ flex: 1, borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                        Vista Previa
                    </Typography>
                    <Typography color="text.secondary" sx={{ textAlign: "center", py: 8 }}>
                        Selecciona un archivo para ver su contenido
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ flex: 1, borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Vista Previa
                </Typography>

                <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip label={`Archivo: ${archivo.nombre}`} color="primary" />
                    <Chip label={`Filas: ${archivo.datos.length}`} variant="outlined" />
                    <Chip label={`Columnas: ${archivo.columnas.length}`} variant="outlined" />
                    {archivo.tipoArchivo && (
                        <Chip
                            label={`Tipo: ${archivo.tipoArchivo}`}
                            color="secondary"
                            variant="outlined"
                        />
                    )}
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: "auto", boxShadow: "none" }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        fontWeight: "bold",
                                        backgroundColor: "#1976d2",
                                        color: "white",
                                        minWidth: 50,
                                    }}
                                >
                                    #
                                </TableCell>
                                {archivo.columnas.map((columna, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{
                                            fontWeight: "bold",
                                            backgroundColor: "#1976d2",
                                            color: "white",
                                            minWidth: 120,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {columna}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {archivo.datos.map((fila, indexFila) => (
                                <TableRow
                                    key={indexFila}
                                    hover
                                    sx={{
                                        backgroundColor: indexFila % 2 === 0 ? "#ffffff" : "#f5f5f5",
                                    }}
                                >
                                    <TableCell sx={{ color: "#666", fontWeight: "bold" }}>
                                        {indexFila + 1}
                                    </TableCell>
                                    {archivo.columnas.map((columna, indexCol) => (
                                        <TableCell
                                            key={indexCol}
                                            sx={{
                                                whiteSpace: "nowrap",
                                                maxWidth: 200,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {formatearValor(fila[columna], columna)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, textAlign: "center" }}
                >
                    Total filas: {archivo.datos.length}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default FilePreview;
