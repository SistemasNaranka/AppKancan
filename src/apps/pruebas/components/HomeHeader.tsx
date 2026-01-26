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
    exportarArchivosNormalizados: () => void;
    busqueda: string;
    setBusqueda: (val: string) => void;
    valorSeleccionado: string | null;
    setValorSeleccionado: (val: string | null) => void;
    tiendasDisponibles: string[];
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
    tiendasDisponibles
}) => {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "#1a2a3a" }}>
                Pruebas - Comparación de Archivos
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
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
                            backgroundColor: "#ffffff63",
                            boxShadow: 'none',
                            color: '#004680',
                            border: 'solid 1px',
                            height: '40px',
                            "&:hover": {
                                boxShadow: "none",
                                backgroundColor: "#0c4c810e"
                            }
                        }}
                    >
                        Subir Archivos
                    </Button>
                </label>

                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={exportarArchivosNormalizados}
                    disabled={!archivos.some(a => a.normalizado)}
                    sx={{
                        backgroundColor: "#017ce1",
                        boxShadow: 'none',
                        color: '#ffffff',
                        height: '40px',
                        "&:hover": {
                            boxShadow: "none",
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
                        backgroundColor: "#218838",
                        boxShadow: 'none',
                        color: '#ffffff',
                        height: '40px',
                        "&:hover": {
                            boxShadow: "none",
                            backgroundColor: "#1e7e34"
                        }
                    }}
                >
                    {cargando ? "Procesando Todo..." : "Normalizar Todo"}
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
                            "&:hover": {
                                borderColor: "#006fc9",
                                backgroundColor: "#017ce10a"
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
                            inputValue={busqueda}
                            onInputChange={(_, newInputValue) => setBusqueda(newInputValue)}
                            sx={{ width: 300 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Buscar tienda..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '40px',
                                            backgroundColor: '#ffffff'
                                        }
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" sx={{ color: '#017ce1' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default HomeHeader;
