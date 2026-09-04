import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import DataObjectIcon from '@mui/icons-material/DataObject';

import {
  CHEAT_SHEET_OPERATORS,
  SDK_FUNCTIONS_EXPLANATION,
} from '../../../lib/DirectusTutorialData';

export default function CheatSheetTab() {
  const [subTab, setSubTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFunctionName, setSelectedFunctionName] = useState<string>(
    SDK_FUNCTIONS_EXPLANATION[0].functionName
  );

  const filteredSdkFunctions = SDK_FUNCTIONS_EXPLANATION.filter((fn) => {
    const q = searchQuery.toLowerCase();
    return (
      fn.functionName.toLowerCase().includes(q) ||
      fn.description.toLowerCase().includes(q) ||
      fn.useCase.toLowerCase().includes(q)
    );
  });

  const activeFunction =
    filteredSdkFunctions.find((fn) => fn.functionName === selectedFunctionName) ||
    filteredSdkFunctions[0] ||
    SDK_FUNCTIONS_EXPLANATION[0];

  const filteredOperators = CHEAT_SHEET_OPERATORS.filter((op) => {
    const q = searchQuery.toLowerCase();
    return (
      op.operator.toLowerCase().includes(q) ||
      op.sqlEquivalent.toLowerCase().includes(q) ||
      op.description.toLowerCase().includes(q)
    );
  });

  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" /> Guía de Referencia Directus
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Documentación interactiva de funciones y operadores de filtro para consultar la API de Directus.
          </Typography>
        </Box>

        {/* Buscador Rápido */}
        <TextField
          size="small"
          placeholder="Buscar función u operador (ej. readUsers, _contains)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Sub-Pestañas de Selección */}
      <Tabs
        value={subTab}
        onChange={(_, val) => setSubTab(val)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.92rem' },
        }}
      >
        <Tab icon={<CodeIcon />} iconPosition="start" label={`Funciones Directus SDK (${filteredSdkFunctions.length})`} />
        <Tab icon={<StorageIcon />} iconPosition="start" label={`Operadores de Filtro SQL (${filteredOperators.length})`} />
      </Tabs>

      {/* SUB-PESTAÑA 1: INSPECTOR DINÁMICO DE FUNCIONES SDK */}
      {subTab === 0 && (
        <Grid container spacing={3}>
          {/* Lado Izquierdo: Lista de Selección de Funciones SDK */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {filteredSdkFunctions.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', py: 2 }}>
                  Sin coincidencias para "{searchQuery}".
                </Typography>
              ) : (
                filteredSdkFunctions.map((fn) => {
                  const isSelected = fn.functionName === activeFunction?.functionName;
                  return (
                    <Card
                      key={fn.functionName}
                      variant="outlined"
                      onClick={() => setSelectedFunctionName(fn.functionName)}
                      sx={{
                        cursor: 'pointer',
                        borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': { shadow: 2 },
                      }}
                    >
                      <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
                            {fn.functionName}()
                          </Typography>
                          <Chip
                            label={fn.httpMethod}
                            size="small"
                            color={fn.httpMethod === 'GET' ? 'info' : fn.httpMethod === 'POST' ? 'success' : fn.httpMethod === 'PATCH' ? 'warning' : 'error'}
                            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fn.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          </Grid>

          {/* Lado Derecho: Inspector Detallado (Código Formateado + Respuesta Devuelta JSON) */}
          <Grid size={{ xs: 12, md: 8 }}>
            {activeFunction && (
              <Paper
                variant="outlined"
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Cabecera de la Función */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={activeFunction.httpMethod}
                      color={activeFunction.httpMethod === 'GET' ? 'info' : activeFunction.httpMethod === 'POST' ? 'success' : activeFunction.httpMethod === 'PATCH' ? 'warning' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {activeFunction.functionName}()
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6', backgroundColor: '#eff6ff', px: 1.5, py: 0.5, borderRadius: 1.5 }}>
                    {activeFunction.signature}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ color: '#334155', fontWeight: 600, mb: 1 }}>
                  {activeFunction.description}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
                  <strong>Caso de Uso en Proyecto:</strong> {activeFunction.useCase}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* 1. Código TypeScript Formateado y Multilínea */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon fontSize="small" color="primary" /> Código de Ejemplo en TypeScript (SDK Directus)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: '#0f172a',
                    color: '#a7f3d0',
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    fontFamily: 'Consolas, Monaco, monospace',
                    overflowX: 'auto',
                    mb: 3,
                    border: '1px solid #1e293b',
                  }}
                >
                  {activeFunction.exampleSnippet}
                </Box>

                {/* 2. Estructura de Datos que Retorna Directus (JSON Output) */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#065f46', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DataObjectIcon fontSize="small" color="success" /> Datos Devueltos por la API de Directus (Respuesta JSON)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: '#022c22',
                    color: '#6ee7b7',
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    fontFamily: 'Consolas, Monaco, monospace',
                    overflowX: 'auto',
                    m: 0,
                    border: '1px solid #064e3b',
                  }}
                >
                  {activeFunction.returnedDataExample}
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* SUB-PESTAÑA 2: OPERADORES DE FILTRO SQL */}
      {subTab === 1 && (
        <Grid container spacing={2}>
          {filteredOperators.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                No se encontraron operadores de filtro que coincidan con "{searchQuery}".
              </Typography>
            </Grid>
          ) : (
            filteredOperators.map((op) => (
              <Grid size={{ xs: 12, md: 6 }} key={op.operator}>
                <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip label={op.operator} color="primary" sx={{ fontWeight: 700, fontFamily: 'monospace' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                        SQL: {op.sqlEquivalent}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 1.5 }}>
                      {op.description}
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        p: 1.2,
                        backgroundColor: '#0f172a',
                        color: '#38bdf8',
                        borderRadius: 1.5,
                        fontSize: '0.8rem',
                        m: 0,
                      }}
                    >
                      {op.exampleJson}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Paper>
  );
}
