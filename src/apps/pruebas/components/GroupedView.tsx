import React, { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputAdornment,
    Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatearValor } from '../utils/formatters';

interface GroupedViewProps {
    gruposPorTienda: Record<string, Record<string, any[]>>;
    columnasPorFuente: Record<string, string[]>;
    busqueda: string;
    valorSeleccionado: string | null;
}

const GroupedView: React.FC<GroupedViewProps> = ({
    gruposPorTienda,
    columnasPorFuente,
    busqueda,
    valorSeleccionado
}) => {

    const gruposFiltrados = useMemo(() => {
        const query = (valorSeleccionado || busqueda).toLowerCase().trim();
        if (!query) return gruposPorTienda;

        const resultado: Record<string, Record<string, any[]>> = {};

        Object.entries(gruposPorTienda).forEach(([tienda, fuentes]) => {
            if (tienda.toLowerCase().includes(query)) {
                resultado[tienda] = fuentes;
            }
        });

        return resultado;
    }, [gruposPorTienda, busqueda, valorSeleccionado]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {Object.keys(gruposFiltrados).length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2, border: '1px dashed #ced4da' }}>
                    <Typography variant="h6" color="text.secondary">
                        No se encontraron tiendas que coincidan con la búsqueda
                    </Typography>
                </Box>
            ) : (
                Object.entries(gruposFiltrados).map(([tienda, fuentes]) => (
                    <Card key={tienda} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e6ed' }}>
                        {/* Cabecera de la Tienda - Color Azul Principal Kancan (#017ce1) */}
                        <Box sx={{ p: 2, backgroundColor: '#017ce1', borderBottom: '1px solid #006fc9' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                                {tienda.toUpperCase()}
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 4 }}>
                                {Object.entries(fuentes).map(([fuente, datos]) => {
                                    const columnasAMostrar = columnasPorFuente[fuente] || [];
                                    const totalValor = datos.reduce((acc, fila) => {
                                        const v = Object.keys(fila).find(k => {
                                            const kl = k.toLowerCase();
                                            return kl.includes('valor') || kl.includes('monto') || kl.includes('total');
                                        });
                                        const val = fila[v || ''];
                                        const num = typeof val === 'number' ? val : Number(String(val || 0).replace(/[^0-9.-]+/g, ""));
                                        return acc + (isNaN(num) ? 0 : num);
                                    }, 0);

                                    return (
                                        <Box key={fuente}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#017ce1', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 4, height: 16, bgcolor: '#017ce1', borderRadius: 1 }} />
                                                {fuente.toUpperCase()}
                                            </Typography>
                                            <TableContainer
                                                component={Paper}
                                                elevation={0}
                                                sx={{
                                                    border: '1px solid #e0e6ed',
                                                    borderRadius: 1,
                                                    maxHeight: 650,
                                                    overflow: 'auto'
                                                }}
                                            >
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            {columnasAMostrar.map(col => (
                                                                <TableCell
                                                                    key={col}
                                                                    sx={{
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.75rem',
                                                                        py: 1.5,
                                                                        backgroundColor: '#f1f5f9', // Fondo Gris Azulado claro (Slate 100) para encabezados de tabla
                                                                        color: '#334155', // Texto Gris Oscuro (Slate 700)
                                                                        borderBottom: '2px solid #e2e8f0'
                                                                    }}
                                                                >
                                                                    {col.toUpperCase()}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {datos.map((fila, idx) => (
                                                            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                                                                {columnasAMostrar.map(col => (
                                                                    <TableCell key={col} sx={{ fontSize: '0.75rem', py: 1 }}>
                                                                        {formatearValor(fila[col], col)}
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))}
                                                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                                            <TableCell colSpan={columnasAMostrar.length - 1} align="right" sx={{ fontWeight: 'bold', py: 1.5 }}>
                                                                TOTAL {fuente.toUpperCase()}:
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2', py: 1.5 }}>
                                                                {totalValor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    );
};

export default GroupedView;
