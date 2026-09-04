import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import HttpIcon from '@mui/icons-material/Http';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TerminalIcon from '@mui/icons-material/Terminal';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ShieldIcon from '@mui/icons-material/Shield';
import TableViewIcon from '@mui/icons-material/TableView';

import {
  RequestConfig,
  DiagnosticResult,
  generateSQLEquivalent,
  generateSDKCodeSnippet,
  generateHTTPRequest,
} from '../../../lib/DirectusTestHelper';
import LiveTablePreviewModal from './LiveTablePreviewModal';

interface PlaygroundTabProps {
  config: RequestConfig;
  setConfig: (config: RequestConfig) => void;
  loading: boolean;
  result: DiagnosticResult | null;
  activeErrorSimulationName: string | null;
  setActiveErrorSimulationName: (name: string | null) => void;
  handleRunTest: (overrideConfig?: RequestConfig) => Promise<void>;
  handleCopy: (text: string, label: string) => void;
  refreshTableCount?: number;
}

const DEFAULT_COLLECTION_PAYLOADS: Record<string, any> = {
  test_products: {
    category_id: 1,
    sku: 'SKU-RGB-001',
    name: 'Mouse Gamer RGB 16000 DPI',
    price: 85000,
    stock: 15,
    status: 'disponible',
    description: 'Mouse ergonómico con iluminación RGB y sensor óptico'
  },
  test_categories: {
    name: 'Periféricos & Hardware',
    code: 'CAT-PERIF-001',
    status: 'activo',
    description: 'Dispositivos de entrada y salida para computadoras'
  },
  directus_users: {
    first_name: 'Ana',
    last_name: 'López',
    email: 'ana.lopez@estudiante.com',
    status: 'active'
  },
  core_stores: {
    name: 'Tienda Central Kancan',
    code: 'STR-001',
    status: 'activo'
  },
};

const getDefaultPayload = (colName: string) => {
  const payloadObj = DEFAULT_COLLECTION_PAYLOADS[colName] || {
    name: 'Nuevo Registro',
    status: 'activo',
  };
  return JSON.stringify(payloadObj, null, 2);
};

export default function PlaygroundTab({
  config,
  setConfig,
  loading,
  result,
  activeErrorSimulationName,
  setActiveErrorSimulationName,
  handleRunTest,
  handleCopy,
  refreshTableCount = 0,
}: PlaygroundTabProps) {
  const [openTableModal, setOpenTableModal] = useState<boolean>(false);
  const [codeVisorTab, setCodeVisorTab] = useState<number>(0);

  const commonCollections = [
    { name: 'test_products', label: 'test_products (CRUD)', readOnly: false },
    { name: 'test_categories', label: 'test_categories (CRUD)', readOnly: false },
    { name: 'directus_users', label: 'directus_users (Solo Leer)', readOnly: true },
    { name: 'core_stores', label: 'core_stores (Solo Leer)', readOnly: true },
  ];

  const handleSelectCollection = (colName: string, isReadOnly: boolean) => {
    const samplePayload = getDefaultPayload(colName);
    if (isReadOnly && (config.action === 'createItem' || config.action === 'updateItem' || config.action === 'deleteItem')) {
      setConfig({
        ...config,
        collection: colName,
        action: 'readItems',
        payload: samplePayload,
      });
    } else {
      setConfig({ ...config, collection: colName, payload: samplePayload });
    }
  };

  const sqlCode = generateSQLEquivalent(config);
  const sdkSnippet = generateSDKCodeSnippet(config);
  const httpReq = generateHTTPRequest(config);

  return (
    <Grid container spacing={3}>
      {/* Panel Izquierdo: Configuración de la Petición */}
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          {activeErrorSimulationName && (
            <Alert
              severity="warning"
              onClose={() => setActiveErrorSimulationName(null)}
              sx={{ mb: 2.5, borderRadius: 2 }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>Simulación de Error Activa</AlertTitle>
              Se cargaron los parámetros que provocan: <strong>{activeErrorSimulationName}</strong>. Inspecciona el panel derecho para ver la respuesta.
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon color="primary" /> Configurar Petición
            </Typography>

            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<TableViewIcon />}
              onClick={() => setOpenTableModal(true)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: '0.8rem' }}
            >
              Ver Tabla en BD (Modal)
            </Button>
          </Box>

          {/* Nombre de la Colección / Tabla Personalizable + Accesos Rápidos */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre de la Tabla / Colección (collection)"
              value={config.collection}
              onChange={(e) => setConfig({ ...config, collection: e.target.value.trim() })}
              placeholder="Ej: test_products, app_proyectos, usuarios, tareas..."
              helperText="Escribe manualmente cualquier tabla de la base de datos o usa las sugerencias rápidas."
              slotProps={{
                input: {
                  startAdornment: (
                    <StorageIcon fontSize="small" sx={{ color: '#2563eb', mr: 1 }} />
                  ),
                  sx: {
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontWeight: 600,
                  },
                },
              }}
            />

            {/* Accesos Rápidos / Sugerencias */}
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Sugerencias rápidas:
              </Typography>
              {commonCollections.map((col) => {
                const isSelected = config.collection === col.name;
                return (
                  <Chip
                    key={col.name}
                    label={col.label}
                    size="small"
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => handleSelectCollection(col.name, col.readOnly)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1.5,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Función SDK y (ID o Límite) en la MISMA LÍNEA para ahorrar espacio vertical */}
            <Grid size={{ xs: 12, sm: config.action === 'createItem' ? 12 : 7 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Función Directus SDK (Acción)</InputLabel>
                <Select
                  value={config.action}
                  label="Función Directus SDK (Acción)"
                  onChange={(e) => setConfig({ ...config, action: e.target.value as any })}
                >
                  <MenuItem value="readItems">readItems() — Lista de Filas (GET /items)</MenuItem>
                  <MenuItem value="readItem">readItem() — Fila por ID (GET /items/:id)</MenuItem>
                  <MenuItem value="createItem">createItem() — Crear Registro (POST /items)</MenuItem>
                  <MenuItem value="updateItem">updateItem() — Actualizar por ID (PATCH /items/:id)</MenuItem>
                  <MenuItem value="deleteItem">deleteItem() — Eliminar por ID (DELETE /items/:id)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Campo ID en la misma fila si aplica */}
            {(config.action === 'readItem' || config.action === 'updateItem' || config.action === 'deleteItem') && (
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="ID del Registro"
                  value={config.id || ''}
                  onChange={(e) => setConfig({ ...config, id: e.target.value })}
                  placeholder="Ej: 1"
                />
              </Grid>
            )}

            {/* Límite de Resultados en la misma fila al consultar lista */}
            {config.action === 'readItems' && (
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Límite (limit)"
                  value={config.limit}
                  onChange={(e) => setConfig({ ...config, limit: Number(e.target.value) })}
                  slotProps={{ htmlInput: { min: 1, max: 100 } }}
                />
              </Grid>
            )}

            {/* Selección de Campos (fields) */}
            {(config.action === 'readItems' || config.action === 'readItem') && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Campos a Retornar (fields)"
                  value={config.fields}
                  onChange={(e) => setConfig({ ...config, fields: e.target.value })}
                  placeholder="id, name, price, category_id.name"
                  helperText="Usa * para todos o sintaxis con puntos para relaciones (JOINs)."
                />
              </Grid>
            )}

            {/* Filtros JSON (filter) — ¡MUCHO MÁS GRANDE Y CON ESTILO CÓDIGO MONOESPACIADO! */}
            {config.action === 'readItems' && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', mb: 0.5 }}>
                  FILTRO JSON (filter)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  maxRows={12}
                  size="small"
                  value={config.filter}
                  onChange={(e) => setConfig({ ...config, filter: e.target.value })}
                  placeholder='{\n  "status": {\n    "_eq": "disponible"\n  }\n}'
                  slotProps={{
                    input: {
                      sx: {
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                        backgroundColor: '#f8fafc',
                        lineHeight: 1.5,
                      },
                    },
                  }}
                  helperText="Usa operadores como _eq, _neq, _contains, _gt, _in, _between, etc."
                />
              </Grid>
            )}

            {/* Payload JSON de Datos — ¡MUCHO MÁS GRANDE Y CON ESTILO CÓDIGO MONOESPACIADO! */}
            {(config.action === 'createItem' || config.action === 'updateItem') && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    PAYLOAD DE DATOS (JSON BODY)
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={() => setConfig({ ...config, payload: getDefaultPayload(config.collection) })}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0 }}
                  >
                    Restablecer Ejemplo de {config.collection}
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={14}
                  size="small"
                  value={config.payload}
                  onChange={(e) => setConfig({ ...config, payload: e.target.value })}
                  placeholder='{\n  "name": "Producto",\n  "price": 10000\n}'
                  slotProps={{
                    input: {
                      sx: {
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                        backgroundColor: '#f8fafc',
                        lineHeight: 1.5,
                      },
                    },
                  }}
                  helperText="Estructura JSON con los campos y datos a insertar o actualizar en la tabla."
                />
              </Grid>
            )}
          </Grid>

          {/* Interruptor de Modo Seguro */}
          <Box sx={{ mt: 2.5, mb: 2, p: 1.5, backgroundColor: config.safeMode ? '#f0fdf4' : '#fef2f2', borderRadius: 2, border: `1px solid ${config.safeMode ? '#bbf7d0' : '#fecaca'}` }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.safeMode}
                  onChange={(e) => setConfig({ ...config, safeMode: e.target.checked })}
                  color="success"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700, color: config.safeMode ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <ShieldIcon fontSize="small" />
                  {config.safeMode ? 'Modo Seguro: Simular escrituras sin modificar BD real' : 'Modo Real: Modificaciones impactarán la BD real'}
                </Typography>
              }
            />
          </Box>

          {/* Botón de Ejecutar */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            disabled={loading}
            onClick={() => handleRunTest()}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
          >
            {loading ? 'Ejecutando en Directus...' : 'Ejecutar Consulta en Directus API'}
          </Button>
        </Paper>
      </Grid>

      {/* Panel Derecho: Resultado de la Ejecución PRIMERO + Visor de Código 3-en-1 (Tabs) */}
      <Grid size={{ xs: 12, lg: 7 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          
          {/* 1. VISOR DE RESULTADO / DIAGNÓSTICO (UBICADO ARRIBA PARA VISIBILIDAD INMEDIATA SIN SCROLL) */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', minHeight: 280, backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TerminalIcon color="primary" /> Resultado de la Ejecución
              </Typography>
              {result && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={result.isError ? `HTTP ${result.httpStatus} ${result.code}` : `200 OK (${result.latencyMs} ms)`}
                    color={result.isError ? 'error' : 'success'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              )}
            </Box>

            {!result && !loading && (
              <Alert severity="info" icon={<HelpOutlineIcon />}>
                Haz clic en <strong>"Ejecutar Consulta en Directus API"</strong> para probar la llamada y ver la respuesta de la base de datos o el diagnóstico de error en vivo.
              </Alert>
            )}

            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress size={36} sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Enviando solicitud al SDK de Directus...
                </Typography>
              </Box>
            )}

            {result && result.isError && (
              <Box sx={{ mb: 1 }}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>
                    {result.code}: {result.message}
                  </AlertTitle>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                    Causa en BD / Directus:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {result.rootCauseSpan}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Recomendación para solución:
                  </Typography>
                  <Typography variant="body2">
                    {result.recommendationSpan}
                  </Typography>
                </Alert>

                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  RESPUESTA COMPLETA DE ERROR DE DIRECTUS:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    backgroundColor: '#450a0a',
                    color: '#fca5a5',
                    borderRadius: 1.5,
                    fontSize: '0.8rem',
                    maxHeight: 220,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(result.rawResponse, null, 2)}
                </Box>
              </Box>
            )}

            {result && !result.isError && (
              <Box>
                <Alert
                  severity="success"
                  action={
                    <Button color="inherit" size="small" startIcon={<TableViewIcon />} onClick={() => setOpenTableModal(true)}>
                      Abrir Tabla en BD
                    </Button>
                  }
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  ¡Consulta ejecutada exitosamente! Se obtuvieron los datos correctamente desde Directus.
                </Alert>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  DATOS DEVUELTOS POR DIRECTUS API:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: '#022c22',
                    color: '#6ee7b7',
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    maxHeight: 260,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(result.rawResponse, null, 2)}
                </Box>
              </Box>
            )}
          </Paper>

          {/* 2. VISOR DE CÓDIGO Y PETICIONES (CONSOLIDADOS EN PESTAÑAS PARA AHORRAR ESPACIO) */}
          <Paper sx={{ borderRadius: 3, backgroundColor: '#0f172a', color: '#f8fafc', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#334155', px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tabs
                value={codeVisorTab}
                onChange={(_, newVal) => setCodeVisorTab(newVal)}
                textColor="inherit"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#94a3b8',
                    '&.Mui-selected': { color: '#38bdf8' },
                  },
                }}
              >
                <Tab icon={<CodeIcon />} iconPosition="start" label="Código SDK TypeScript" />
                <Tab icon={<StorageIcon />} iconPosition="start" label="Consulta SQL" />
                <Tab icon={<HttpIcon />} iconPosition="start" label="Petición HTTP REST" />
              </Tabs>

              {codeVisorTab === 0 && (
                <Tooltip title="Copiar Código TypeScript SDK">
                  <IconButton size="small" onClick={() => handleCopy(sdkSnippet, 'Código SDK')} sx={{ color: '#94a3b8' }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {codeVisorTab === 1 && (
                <Tooltip title="Copiar SQL">
                  <IconButton size="small" onClick={() => handleCopy(sqlCode, 'Consulta SQL')} sx={{ color: '#94a3b8' }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {codeVisorTab === 2 && (
                <Tooltip title="Copiar URL REST">
                  <IconButton size="small" onClick={() => handleCopy(httpReq.url, 'URL HTTP REST')} sx={{ color: '#94a3b8' }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Tab 0: TypeScript SDK */}
              {codeVisorTab === 0 && (
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                    m: 0,
                    p: 1.5,
                    backgroundColor: '#1e293b',
                    borderRadius: 1.5,
                    color: '#a7f3d0',
                    maxHeight: 240,
                    overflowX: 'auto',
                  }}
                >
                  {sdkSnippet}
                </Box>
              )}

              {/* Tab 1: SQL Equivalente */}
              {codeVisorTab === 1 && (
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                    m: 0,
                    p: 1.5,
                    backgroundColor: '#1e293b',
                    borderRadius: 1.5,
                    color: '#38bdf8',
                    maxHeight: 240,
                    overflowX: 'auto',
                  }}
                >
                  {sqlCode}
                </Box>
              )}

              {/* Tab 2: HTTP REST */}
              {codeVisorTab === 2 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, backgroundColor: '#1e293b', borderRadius: 1.5, overflowX: 'auto' }}>
                  <Chip label={httpReq.method} color={httpReq.method === 'GET' ? 'info' : httpReq.method === 'POST' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 700 }} />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#f8fafc', wordBreak: 'break-all' }}>
                    {httpReq.url}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

        </Box>
      </Grid>

      {/* Modal Desplegable de Tabla de BD en Vivo (Sin necesidad de hacer Scroll) */}
      <LiveTablePreviewModal
        open={openTableModal}
        onClose={() => setOpenTableModal(false)}
        collection={config.collection}
        triggerRefreshCount={refreshTableCount}
      />
    </Grid>
  );
}
