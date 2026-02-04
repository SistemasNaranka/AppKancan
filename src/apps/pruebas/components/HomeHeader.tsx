import React from 'react';
import { Box, Button, Typography, TextField, InputAdornment, Autocomplete } from '@mui/material';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SearchIcon from '@mui/icons-material/Search';
import { ArchivoSubido } from '../types/mapeo.types';

interface HomeHeaderProps {
    archivos: ArchivoSubido[];
    cargando: boolean;
    cargandoMapeos: boolean;
    errorMapeos: string | null;
    mostrarAgrupado: boolean;
    setMostrarAgrupado: (val: boolean) => void;
    handleSubirArchivos: (e: React.ChangeEvent<HTMLInputElement>) => void;
    normalizarTodosArchivos: () => void;
    exportarArchivosNormalizados: (tiendaFiltrada?: string | null) => void;
    busqueda: string;
    setBusqueda: (val: string) => void;
    valorSeleccionado: string | null;
    setValorSeleccionado: (val: string | null) => void;
    tiendasDisponibles: string[];
    procesarArchivosRaw: (files: FileList | File[]) => Promise<void>;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
    archivos,
    cargando,
    cargandoMapeos,
    errorMapeos,
    mostrarAgrupado,
    setMostrarAgrupado,
    handleSubirArchivos,
    normalizarTodosArchivos,
    exportarArchivosNormalizados,
    busqueda,
    setBusqueda,
    valorSeleccionado,
    setValorSeleccionado,
    tiendasDisponibles,
    procesarArchivosRaw
}) => {
    const [dragging, setDragging] = React.useState(false);

    // Estado local para debounce de búsqueda
    const [busquedaLocal, setBusquedaLocal] = React.useState(busqueda);

    // Efecto para actualizar la búsqueda global con delay
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setBusqueda(busquedaLocal);
        }, 300); // 300ms de delay

        return () => clearTimeout(timer);
    }, [busquedaLocal, setBusqueda]);

    // Sincronizar búsqueda local si cambia desde fuera (ej: limpiar)
    React.useEffect(() => {
        setBusquedaLocal(busqueda);
    }, [busqueda]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await procesarArchivosRaw(files);
        }
    };
    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1a2a3a" }}>
                    Pruebas - Comparación de Archivos
                </Typography>
            </Box>

            {/* Barra de Acciones Sticky */}
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backgroundColor: dragging ? 'rgba(1, 124, 225, 0.15)' : 'rgba(240, 244, 248, 0.9)',
                    backdropFilter: 'blur(10px)',
                    py: 2,
                    px: 3,
                    mx: -3,  // Compensa el padding del padre (Home)
                    mb: 3,
                    borderBottom: dragging ? '2px dashed #017ce1' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: dragging ? '0 8px 12px -1px rgba(1, 124, 225, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    cursor: dragging ? 'copy' : 'default'
                }}>
                <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    multiple
                    style={{ display: "none" }}
                    id="input-archivo"
                    onChange={handleSubirArchivos}
                />
                <label htmlFor="input-archivo">
                    <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        disabled={cargandoMapeos || !!errorMapeos}
                        sx={{
                            backgroundColor: "#ffffff",
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            color: '#004680',
                            border: '1px solid #e2e8f0',
                            height: '40px',
                            fontWeight: 600,
                            "&:hover": {
                                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                                backgroundColor: "#f8fafc"
                            }
                        }}
                    >
                        Subir Archivos
                    </Button>
                </label>

                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportarArchivosNormalizados(valorSeleccionado)}
                    disabled={!archivos.some(a => a.normalizado)}
                    sx={{
                        backgroundColor: "#017ce1",
                        boxShadow: '0 2px 4px rgba(1, 124, 225, 0.2)',
                        color: '#ffffff',
                        height: '40px',
                        fontWeight: 600,
                        "&:hover": {
                            boxShadow: "0 4px 8px rgba(1, 124, 225, 0.3)",
                            backgroundColor: "#006fc9"
                        }
                    }}
                >
                    Exportar
                </Button>

                <Button
                    variant="contained"
                    onClick={normalizarTodosArchivos}
                    disabled={archivos.length === 0 || !archivos.some(a => !a.normalizado && a.tipoArchivo) || cargando}
                    sx={{
                        backgroundColor: "#10b981", // Verde más moderno
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                        color: '#ffffff',
                        height: '40px',
                        fontWeight: 600,
                        "&:hover": {
                            boxShadow: "0 4px 8px rgba(16, 185, 129, 0.3)",
                            backgroundColor: "#059669"
                        }
                    }}
                >
                    {cargando ? "Procesando..." : "Normalizar Todo"}
                </Button>

                {archivos.some(a => a.normalizado) && (
                    <Button
                        variant="outlined"
                        onClick={() => setMostrarAgrupado(!mostrarAgrupado)}
                        startIcon={mostrarAgrupado ? <InsertDriveFileIcon /> : <CompareArrowsIcon />}
                        sx={{
                            borderColor: "#017ce1",
                            color: '#017ce1',
                            height: '40px',
                            fontWeight: 600,
                            backgroundColor: 'white',
                            "&:hover": {
                                borderColor: "#006fc9",
                                backgroundColor: "#f0f9ff"
                            }
                        }}
                    >
                        {mostrarAgrupado ? "Vista de Archivos" : "Agrupar por Tienda"}
                    </Button>
                )}

                {/* Filtro de Tiendas con Autocomplete - Integrado en la línea */}
                {mostrarAgrupado && (
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Autocomplete
                            freeSolo
                            options={tiendasDisponibles}
                            value={valorSeleccionado}
                            onChange={(_, newValue) => setValorSeleccionado(newValue)}
                            inputValue={busquedaLocal}
                            onInputChange={(_, newInputValue) => setBusquedaLocal(newInputValue)}
                            sx={{ width: 300 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Buscar tienda..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '40px',
                                            backgroundColor: '#ffffff',
                                            borderRadius: 2,
                                            fieldset: { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: '#017ce1' }
                                        }
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>
                )}
            </Box>
        </>
    );
};

export default HomeHeader;
