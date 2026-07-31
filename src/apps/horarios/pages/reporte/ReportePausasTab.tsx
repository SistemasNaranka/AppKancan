import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Avatar, Chip,
  Select, MenuItem
} from '@mui/material';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { getAvatarColor } from './ReporteUtils';
import { formatDocumentNumber } from '../../utils/format';

interface ReportePausasTabProps {
  paginatedPausas: any[];
  eventReportsFiltrados: any[];
  pagePausas: number;
  setPagePausas: React.Dispatch<React.SetStateAction<number>>;
  totalPagesPausas: number;
  rowsPerPagePausas?: number;
  setRowsPerPagePausas?: (rows: number) => void;
}

export default function ReportePausasTab({
  paginatedPausas,
  eventReportsFiltrados,
  pagePausas,
  setPagePausas,
  totalPagesPausas,
  rowsPerPagePausas = 5,
  setRowsPerPagePausas,
}: ReportePausasTabProps) {
  return (
    <>
      <TableContainer sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f0f7ff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Hora</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Empleado</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tienda</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Tipo de Evento</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPausas.map((r: any, idx: number) => {
              const emp = r.employee_id || {};
              const first = emp.first_name || '';
              const middle = emp.middle_name || '';
              const last = emp.last_name || '';
              const second = emp.second_last_name || '';
              const nombreEmpleado = [first, middle, last, second].filter(Boolean).join(' ').trim() || 'Empleado';
              const inicial = nombreEmpleado.charAt(0).toUpperCase();

              const rawDate = r.date || r.report_date || r.record_date || (r.date_created ? dayjs(r.date_created).format('YYYY-MM-DD') : null);
              const fecha = rawDate ? dayjs(rawDate).format('DD [de] MMM [de] YYYY') : '—';

              const rawHour = r.hour || r.record_time || r.time || (r.date_created ? dayjs(r.date_created).format('HH:mm:ss') : null);
              const hora = rawHour ? String(rawHour).substring(0, 5) : '—';
              const tiendaNombre = r.store_id?.name || (r.store_id ? `Tienda #${r.store_id}` : '—');
              const tipoEvento = r.event_type || r.event || 'Pausa Activa';

              return (
                <TableRow
                  key={r.id || idx}
                  hover
                  sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                >
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{fecha}</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 600, color: '#004680' }}>{hora}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                        {inicial}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                        {emp.document_number && (
                          <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {formatDocumentNumber(emp.document_number)}</Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#475569' }}>{tiendaNombre}</TableCell>
                  <TableCell>
                    {(() => {
                      const isStart = (tipoEvento || '').toLowerCase().includes('inici') || (tipoEvento || '').toLowerCase().includes('comenz');
                      const chipBg = isStart ? '#e6f4ea' : '#fff7ed';
                      const chipColor = isStart ? '#15803d' : '#c2410c';
                      const chipBorder = isStart ? '1px solid #bbf7d0' : '1px solid #ffedd5';

                      return (
                        <Chip
                          icon={<PauseCircleIcon sx={{ fontSize: '1rem !important', color: `${chipColor} !important` }} />}
                          label={tipoEvento}
                          size="medium"
                          sx={{
                            bgcolor: chipBg,
                            color: chipColor,
                            border: chipBorder,
                            fontWeight: 600,
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#475569', maxWidth: 300, wordBreak: 'break-word' }}>
                      {r.observations || r.observaciones || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}

            {eventReportsFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <PauseCircleIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                    <Typography variant="body1" color="#94a3b8" sx={{ fontWeight: 500 }}>
                      No hay reportes de pausas activas para mostrar
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginador */}
      {eventReportsFiltrados.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', borderTop: '1px solid #eef2f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="#64748b">
              Mostrando {paginatedPausas.length} de {eventReportsFiltrados.length} pausas activas
            </Typography>
            {setRowsPerPagePausas && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="#64748b">
                  Registros por página:
                </Typography>
                <Select
                  value={rowsPerPagePausas}
                  onChange={(e) => {
                    setRowsPerPagePausas(Number(e.target.value));
                    setPagePausas(0);
                  }}
                  size="small"
                  sx={{
                    bgcolor: '#f1f7fe',
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    minWidth: 70,
                    height: 30,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#004680' }
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" disabled={pagePausas === 0} onClick={() => setPagePausas((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {(() => {
              const paginas: (number | string)[] = [];
              if (totalPagesPausas <= 7) {
                for (let i = 0; i < totalPagesPausas; i++) paginas.push(i);
              } else {
                paginas.push(0);
                if (pagePausas > 2) paginas.push('dots-1');
                const start = Math.max(1, pagePausas - 1);
                const end = Math.min(totalPagesPausas - 2, pagePausas + 1);
                for (let i = start; i <= end; i++) paginas.push(i);
                if (pagePausas < totalPagesPausas - 3) paginas.push('dots-2');
                paginas.push(totalPagesPausas - 1);
              }
              return paginas.map((item, idx) =>
                typeof item === 'string' ? (
                  <Typography key={`${item}-${idx}`} variant="caption" sx={{ color: '#94a3b8', px: 0.5 }}>...</Typography>
                ) : (
                  <Box
                    key={item}
                    onClick={() => setPagePausas(item)}
                    sx={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                      bgcolor: pagePausas === item ? '#004680' : '#fff', color: pagePausas === item ? '#fff' : '#5e6f8d',
                      border: pagePausas === item ? 'none' : '1px solid #dfe4ec', fontWeight: pagePausas === item ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                      '&:hover': { bgcolor: pagePausas === item ? '#004680' : '#f1f5f9' }
                    }}
                  >
                    {item + 1}
                  </Box>
                )
              );
            })()}
            <IconButton size="small" disabled={pagePausas === totalPagesPausas - 1} onClick={() => setPagePausas((p) => Math.min(p + 1, totalPagesPausas - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
}
