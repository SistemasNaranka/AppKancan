import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Avatar, Chip
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
}

export default function ReportePausasTab({
  paginatedPausas,
  eventReportsFiltrados,
  pagePausas,
  setPagePausas,
  totalPagesPausas
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
            {paginatedPausas.map((report: any, idx: number) => {
              const first = report.employee_id?.first_name || '';
              const middle = report.employee_id?.middle_name || '';
              const last = report.employee_id?.last_name || '';
              const second = report.employee_id?.second_last_name || '';
              const nombreEmpleado = [first, middle, last, second].filter(Boolean).join(' ').trim() || `Empleado #${report.employee_id?.id || ''}`;
              const inicial = nombreEmpleado.charAt(0).toUpperCase();
              const fechaFormateada = report.date ? dayjs(report.date).format('DD [de] MMM [de] YYYY') : '—';
              const horaFormateada = report.hour ? report.hour.substring(0, 5) : '—';
              const observacion = report.observations || '—';

              return (
                <TableRow
                  key={report.id || idx}
                  hover
                  sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#fafcff', transition: 'all 0.2s', '&:hover': { bgcolor: '#eef4ff' } }}
                >
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{fechaFormateada}</TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#1e293b' }}>{horaFormateada}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: getAvatarColor(nombreEmpleado), fontSize: '1rem', fontWeight: 600 }}>
                        {inicial}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{nombreEmpleado}</Typography>
                        {report.employee_id?.document_number && (
                          <Typography variant="caption" sx={{ color: '#64748b' }}>Doc: {formatDocumentNumber(report.employee_id.document_number)}</Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#475569' }}>
                    {report.store_id?.name || '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<PauseCircleIcon sx={{ fontSize: '1rem !important' }} />}
                      label={report.event_type}
                      size="medium"
                      sx={{
                        bgcolor: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.06)' : 'rgba(8, 145, 178, 0.06)',
                        color: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.8)' : 'rgba(8, 145, 178, 0.8)',
                        fontWeight: 600,
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        '& .MuiChip-icon': {
                          color: report.event_type.includes('Terminar') ? 'rgba(22, 163, 74, 0.8)' : 'rgba(8, 145, 178, 0.8)',
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#475569', maxWidth: 300, wordBreak: 'break-word' }}>{observacion}</Typography>
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
          <Typography variant="caption" color="#64748b">
            Mostrando {paginatedPausas.length} de {eventReportsFiltrados.length} pausas activas
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" disabled={pagePausas === 0} onClick={() => setPagePausas((p) => Math.max(p - 1, 0))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {[...Array(Math.min(totalPagesPausas, 7))].map((_, i) => {
              let pageNum = i;
              if (totalPagesPausas > 7) {
                if (pagePausas < 3) pageNum = i;
                else if (pagePausas > totalPagesPausas - 4) pageNum = totalPagesPausas - 7 + i;
                else pageNum = pagePausas - 3 + i;
              }
              const isActive = pagePausas === pageNum;
              return (
                <Box
                  key={i}
                  onClick={() => setPagePausas(pageNum)}
                  sx={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, cursor: 'pointer',
                    bgcolor: isActive ? '#004680' : '#fff', color: isActive ? '#fff' : '#5e6f8d',
                    border: isActive ? 'none' : '1px solid #dfe4ec', fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', transition: 'all 0.2s',
                    '&:hover': { bgcolor: isActive ? '#004680' : '#f1f5f9' }
                  }}
                >
                  {pageNum + 1}
                </Box>
              );
            })}
            <IconButton size="small" disabled={pagePausas === totalPagesPausas - 1} onClick={() => setPagePausas((p) => Math.min(p + 1, totalPagesPausas - 1))} sx={{ border: '1px solid #dfe4ec', borderRadius: 1.5, width: 32, height: 32 }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
}
