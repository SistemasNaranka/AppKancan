import React, { useMemo } from 'react';
import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InboxIcon from '@mui/icons-material/Inbox';
import { formatearValor, formatearMoneda } from '../utils/formatters';

interface GroupedViewProps {
    gruposPorTienda: Record<string, Record<string, any[]>>;
    columnasPorFuente: Record<string, string[]>;
    busqueda: string;
    valorSeleccionado: string | null;
}

// Configuración de colores para cada fuente
const FUENTE_COLORS = {
    'SISTECREDITOS': {
        border: '#3b82f6', // Azul
        bg: '#eff6ff',
        text: '#1e40af'
    },
    'TRANSFERENCIAS': {
        border: '#10b981', // Verde
        bg: '#f0fdf4',
        text: '#065f46'
    },
    'ADDI': {
        border: '#a855f7', // Púrpura
        bg: '#faf5ff',
        text: '#6b21a8'
    },
    'REDEBAN': {
        border: '#f97316', // Naranja
        bg: '#fff7ed',
        text: '#9a3412'
    }
};

const GroupedView: React.FC<GroupedViewProps> = ({
    gruposPorTienda,
    columnasPorFuente,
    busqueda,
    valorSeleccionado
}) => {

    // Función optimizada para identificar la columna de valor una sola vez
    const identificarColumnaValor = (fila: any): string | null => {
        if (!fila) return null;
        return Object.keys(fila).find(k => {
            const kl = k.toLowerCase();
            return kl.includes('valor') || kl.includes('monto') || kl.includes('total') || kl.includes('neto');
        }) || null;
    };

    // Función para calcular el total de una fuente
    const calcularTotal = (datos: any[]) => {
        if (!datos || datos.length === 0) return 0;

        // Identificar la columna una sola vez para todo el array
        const columnaValor = identificarColumnaValor(datos[0]);
        if (!columnaValor) return 0;

        return datos.reduce((acc, fila) => {
            const val = fila[columnaValor];
            const num = typeof val === 'number' ? val : Number(String(val || 0).replace(/[^0-9.-]+/g, ""));
            return acc + (isNaN(num) ? 0 : num);
        }, 0);
    };

    const gruposFiltrados = useMemo(() => {
        const query = (valorSeleccionado || busqueda).toLowerCase().trim();

        // 1. Filtrar las tiendas
        const tiendasFiltradas = query
            ? Object.entries(gruposPorTienda).filter(([tienda]) => tienda.toLowerCase().includes(query))
            : Object.entries(gruposPorTienda);

        // 2. Calcular totales y preparar objeto de resultados
        return tiendasFiltradas.map(([tienda, fuentes]) => {
            const totalesPorFuente: Record<string, number> = {};
            let granTotal = 0;

            Object.entries(fuentes).forEach(([nombre, datos]) => {
                const total = calcularTotal(datos);
                totalesPorFuente[nombre] = total;
                granTotal += total;
            });

            return {
                nombre: tienda,
                fuentes,
                totalesPorFuente,
                granTotal
            };
        });
    }, [gruposPorTienda, busqueda, valorSeleccionado]);

    // Función para determinar si un valor es negativo o cero
    const esValorNegativoOCero = (valor: any, nombreColumna: string): boolean => {
        const colLower = nombreColumna.toLowerCase();
        // Solo aplicar para columnas de IVA, Retención, Comisión
        if (!colLower.includes('iva') && !colLower.includes('retencion') && !colLower.includes('retención') && !colLower.includes('comision') && !colLower.includes('comisión')) {
            return false;
        }

        const num = typeof valor === 'number' ? valor : Number(String(valor || 0).replace(/[^0-9.-]+/g, ""));
        return num <= 0;
    };

    // Orden fijo de las fuentes
    const ordenFuentes = ['SISTECREDITOS', 'TRANSFERENCIAS', 'ADDI', 'REDEBAN'];

    return (
        <Box sx={{ width: '100%', px: 2 }}>
            {Object.keys(gruposFiltrados).length === 0 ? (
                <Box sx={{
                    p: 8,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: 3,
                    border: '2px dashed #cbd5e1'
                }}>
                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>
                        No se encontraron tiendas que coincidan con la búsqueda
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {gruposFiltrados.map(({ nombre: tienda, fuentes, totalesPorFuente, granTotal }) => {
                        return (
                            <Card
                                key={tienda}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                {/* Header de la Tienda con Total General - STATIC */}
                                <Box sx={{
                                    p: 2,
                                    background: 'linear-gradient(135deg, #017ce1 0%, #0262b0 100%)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <StorefrontIcon sx={{ fontSize: 32, color: '#ffffff', opacity: 0.9 }} />
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 800,
                                                color: '#ffffff',
                                                letterSpacing: '-0.5px',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {tienda.toUpperCase()}
                                        </Typography>
                                    </Box>

                                    {/* Cuadro de Total General */}
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: 2,
                                        px: 2.5,
                                        py: 0.8,
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        textAlign: 'right'
                                    }}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.65rem', display: 'block' }}>
                                            TOTAL TIENDA
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, fontFamily: 'Monaco, monospace', lineHeight: 1 }}>
                                            {formatearMoneda(granTotal)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Grid 2x2 de Tablas */}
                                <Box sx={{ p: 3, backgroundColor: '#f8fafc' }}>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                                        gap: 3
                                    }}>
                                        {ordenFuentes.map(fuenteNombre => {
                                            // BUSCAR DATOS: Intentar coincidencia exacta o coincidencia normalizada
                                            const datos = fuentes[fuenteNombre] ||
                                                fuentes[Object.keys(fuentes).find(k => k.toUpperCase() === fuenteNombre.toUpperCase()) || ''] ||
                                                [];

                                            const colorConfig = FUENTE_COLORS[fuenteNombre as keyof typeof FUENTE_COLORS];

                                            // Si no hay datos, mostrar estado vacío
                                            if (!datos || datos.length === 0) {
                                                return (
                                                    <Card
                                                        key={fuenteNombre}
                                                        sx={{
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            borderTop: `4px solid ${colorConfig.border}`,
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                                        }}
                                                    >
                                                        <Box sx={{ p: 2, backgroundColor: colorConfig.bg, borderBottom: `1px solid ${colorConfig.border}` }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 700, color: colorConfig.text }}>
                                                                {fuenteNombre}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                            <InboxIcon sx={{ fontSize: 48, color: '#e2e8f0' }} />
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                Sin movimientos registrados
                                                            </Typography>
                                                        </Box>
                                                    </Card>
                                                );
                                            }

                                            const columnasAMostrar = columnasPorFuente[fuenteNombre] || [];
                                            const totalFuente = totalesPorFuente[fuenteNombre] ||
                                                totalesPorFuente[Object.keys(totalesPorFuente).find(k => k.toUpperCase() === fuenteNombre.toUpperCase()) || ''] || 0;

                                            return (
                                                <Card
                                                    key={fuenteNombre}
                                                    sx={{
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                        position: 'relative' // Contexto relativo
                                                    }}
                                                >
                                                    {/* Header de la Tabla - STATIC */}
                                                    <Box sx={{
                                                        p: 1.5,
                                                        backgroundColor: colorConfig.bg,
                                                        borderBottom: `1px solid ${colorConfig.border}`,
                                                        borderTop: `4px solid ${colorConfig.border}`
                                                    }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 700, color: colorConfig.text, fontSize: '1rem' }}>
                                                            {fuenteNombre}
                                                        </Typography>
                                                    </Box>

                                                    <TableContainer
                                                        component={Paper}
                                                        elevation={0}
                                                        sx={{
                                                            maxHeight: 500,
                                                            overflow: 'auto',
                                                            flex: 1,
                                                            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                                                            '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9' },
                                                            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' }
                                                        }}
                                                    >
                                                        <Table size="small" stickyHeader>
                                                            <TableHead>
                                                                <TableRow>
                                                                    {columnasAMostrar.map(col => (
                                                                        <TableCell
                                                                            key={col}
                                                                            sx={{
                                                                                fontWeight: 700,
                                                                                fontSize: '0.7rem',
                                                                                py: 1.5,
                                                                                px: 1.5,
                                                                                backgroundColor: '#1e293b',
                                                                                color: '#ffffff',
                                                                                borderBottom: `2px solid ${colorConfig.border}`,
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px',
                                                                                whiteSpace: 'nowrap',
                                                                                // Ajuste para que el header de la tabla no se solape con el sticky header de la fuente
                                                                                // top: 0 está bien porque es relativo al container
                                                                            }}
                                                                        >
                                                                            {col}
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {datos.map((fila, idx) => (
                                                                    <TableRow
                                                                        key={idx}
                                                                        sx={{
                                                                            '&:hover': { backgroundColor: colorConfig.bg },
                                                                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' }
                                                                        }}
                                                                    >
                                                                        {columnasAMostrar.map(col => {
                                                                            const valor = fila[col];
                                                                            const esNegativoOCero = esValorNegativoOCero(valor, col);
                                                                            const colLower = col.toLowerCase();
                                                                            const esNumerico = colLower.includes('valor') ||
                                                                                colLower.includes('monto') ||
                                                                                colLower.includes('total') ||
                                                                                colLower.includes('iva') ||
                                                                                colLower.includes('retencion') ||
                                                                                colLower.includes('retención') ||
                                                                                colLower.includes('comision') ||
                                                                                colLower.includes('comisión');

                                                                            return (
                                                                                <TableCell
                                                                                    key={col}
                                                                                    sx={{
                                                                                        fontSize: '0.75rem',
                                                                                        py: 1,
                                                                                        px: 1.5,
                                                                                        fontFamily: esNumerico ? 'Monaco, Consolas, monospace' : 'inherit',
                                                                                        textAlign: esNumerico ? 'right' : 'left',
                                                                                        backgroundColor: esNegativoOCero ? '#fee2e2' : 'inherit',
                                                                                        color: esNegativoOCero ? '#991b1b' : 'inherit',
                                                                                        fontWeight: esNegativoOCero ? 600 : 400
                                                                                    }}
                                                                                >
                                                                                    {formatearValor(valor, col)}
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                    </TableRow>
                                                                ))}

                                                                {/* Fila de Total */}
                                                                <TableRow sx={{ backgroundColor: colorConfig.bg }}>
                                                                    <TableCell
                                                                        colSpan={columnasAMostrar.length - 1}
                                                                        align="right"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            py: 2,
                                                                            px: 1.5,
                                                                            fontSize: '0.85rem',
                                                                            color: colorConfig.text,
                                                                            borderTop: `2px solid ${colorConfig.border}`
                                                                        }}
                                                                    >
                                                                        TOTAL {fuenteNombre}:
                                                                    </TableCell>
                                                                    <TableCell
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            color: colorConfig.text,
                                                                            py: 2,
                                                                            px: 1.5,
                                                                            fontSize: '0.9rem',
                                                                            fontFamily: 'Monaco, Consolas, monospace',
                                                                            textAlign: 'right',
                                                                            borderTop: `2px solid ${colorConfig.border}`
                                                                        }}
                                                                    >
                                                                        {formatearMoneda(totalFuente)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </Card>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default GroupedView;
