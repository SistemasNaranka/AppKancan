import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableViewIcon from '@mui/icons-material/TableView';

import directus from '@/services/directus/directus';
import { withAutoRefresh } from '@/auth/services/directusInterceptor';
import { readItems } from '@directus/sdk';

interface LiveTablePreviewProps {
  collection: string;
  triggerRefreshCount?: number;
}

export default function LiveTablePreview({ collection, triggerRefreshCount = 0 }: LiveTablePreviewProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveTableData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let fieldsParam: string[] = ['*'];
      if (collection === 'test_products') {
        fieldsParam = ['id', 'sku', 'name', 'price', 'stock', 'status', 'category_id.name'];
      }

      const data = await withAutoRefresh(() =>
        directus.request(
          readItems(collection as any, {
            fields: fieldsParam as any,
            limit: 15,
            sort: ['-id'] as any,
          })
        )
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Error al cargar vista previa de la tabla:', err);
      setError(err?.message || 'No se pudieron obtener los registros de la tabla o no tienes permisos.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchLiveTableData();
  }, [fetchLiveTableData, triggerRefreshCount]);

  const formatPrice = (val: any) => {
    if (typeof val === 'number') {
      return `$${val.toLocaleString('es-CO')}`;
    }
    return val || '-';
  };

  const renderStatusChip = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'disponible' || s === 'activo' || s === 'active') {
      return <Chip label={status} color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />;
    }
    if (s === 'agotado' || s === 'inactivo' || s === 'inactive') {
      return <Chip label={status} color="warning" size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />;
    }
    if (s === 'descontinuado' || s === 'graduado') {
      return <Chip label={status} color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />;
    }
    return <Chip label={status || 'N/A'} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
  };

  const isKnownCollection = ['test_products', 'test_categories', 'directus_users', 'core_stores'].includes(collection);

  // Columnas dinámicas para tablas personalizadas
  const dynamicColumns = rows.length > 0 && !isKnownCollection
    ? Object.keys(rows[0]).filter((k) => k !== 'id' && k !== 'status').slice(0, 8)
    : [];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TableViewIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Visor en Vivo de la Tabla: <span style={{ color: '#2563eb' }}>{collection}</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Muestra los registros reales almacenados en la base de datos de Directus para verificar inserciones, ediciones o borrados.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`${rows.length} Registros`} color="primary" size="small" sx={{ fontWeight: 700 }} />
          <Tooltip title="Actualizar Datos de la Tabla">
            <IconButton size="small" color="primary" onClick={() => fetchLiveTableData()} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && rows.length === 0 && !error && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No hay registros en la tabla <strong>{collection}</strong>. Prueba a insertar un nuevo registro usando <code>createItem()</code> en el formulario de arriba.
        </Alert>
      )}

      {rows.length > 0 && (
        <TableContainer sx={{ maxHeight: 380, borderRadius: 2, border: '1px solid #cbd5e1' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: '#0f172a', color: '#f8fafc', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' } }}>
                <TableCell width={70}>id</TableCell>

                {collection === 'test_products' && <TableCell>sku</TableCell>}
                {collection === 'test_products' && <TableCell>name</TableCell>}
                {collection === 'test_products' && <TableCell>price</TableCell>}
                {collection === 'test_products' && <TableCell>stock</TableCell>}
                {collection === 'test_products' && <TableCell>category_id</TableCell>}

                {collection === 'test_categories' && <TableCell>code</TableCell>}
                {collection === 'test_categories' && <TableCell>name</TableCell>}
                {collection === 'test_categories' && <TableCell>description</TableCell>}

                {collection === 'directus_users' && <TableCell>first_name</TableCell>}
                {collection === 'directus_users' && <TableCell>last_name</TableCell>}
                {collection === 'directus_users' && <TableCell>email</TableCell>}

                {collection === 'core_stores' && <TableCell>code</TableCell>}
                {collection === 'core_stores' && <TableCell>name</TableCell>}

                {!isKnownCollection && dynamicColumns.map((colKey) => (
                  <TableCell key={colKey}>{colKey}</TableCell>
                ))}

                {rows.some((r) => 'status' in r) && <TableCell align="center">status</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id || Math.random()} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>
                    {row.id}
                  </TableCell>

                  {collection === 'test_products' && <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.sku || '-'}</TableCell>}
                  {collection === 'test_products' && <TableCell sx={{ fontWeight: 600 }}>{row.name || '-'}</TableCell>}
                  {collection === 'test_products' && <TableCell sx={{ fontWeight: 700, color: '#15803d' }}>{formatPrice(row.price)}</TableCell>}
                  {collection === 'test_products' && <TableCell sx={{ fontWeight: 600 }}>{row.stock ?? '-'}</TableCell>}
                  {collection === 'test_products' && (
                    <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                      {typeof row.category_id === 'object' && row.category_id !== null
                        ? row.category_id.name
                        : row.category_id
                        ? `ID ${row.category_id}`
                        : 'Sin Categoría'}
                    </TableCell>
                  )}

                  {collection === 'test_categories' && <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.code || '-'}</TableCell>}
                  {collection === 'test_categories' && <TableCell sx={{ fontWeight: 600 }}>{row.name || '-'}</TableCell>}
                  {collection === 'test_categories' && <TableCell sx={{ color: '#475569', fontSize: '0.82rem' }}>{row.description || '-'}</TableCell>}

                  {collection === 'directus_users' && <TableCell sx={{ fontWeight: 600 }}>{row.first_name || '-'}</TableCell>}
                  {collection === 'directus_users' && <TableCell sx={{ fontWeight: 600 }}>{row.last_name || '-'}</TableCell>}
                  {collection === 'directus_users' && <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.email || '-'}</TableCell>}

                  {collection === 'core_stores' && <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.code || '-'}</TableCell>}
                  {collection === 'core_stores' && <TableCell sx={{ fontWeight: 600 }}>{row.name || '-'}</TableCell>}

                  {!isKnownCollection && dynamicColumns.map((colKey) => {
                    const val = row[colKey];
                    const displayVal = typeof val === 'object' && val !== null
                      ? (val.name || val.title || val.id || JSON.stringify(val))
                      : String(val ?? '-');
                    return (
                      <TableCell key={colKey} sx={{ fontSize: '0.82rem' }}>
                        {displayVal}
                      </TableCell>
                    );
                  })}

                  {rows.some((r) => 'status' in r) && (
                    <TableCell align="center">{renderStatusChip(row.status)}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
