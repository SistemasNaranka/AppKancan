// src/apps/contactos/components/ContactTable.tsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Box, Typography,
  Chip, IconButton, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Contactos } from '../types/contact';

interface Props {
  contactos: Contactos[];
  onEliminar?: (id: number) => void;
}

const chipColor = (tipo: string): 'success' | 'warning' | 'default' => {
  if (tipo === 'Public')   return 'success';
  if (tipo === 'Internal') return 'warning';
  return 'default';
};

export const ContactTable: React.FC<Props> = ({ contactos, onEliminar }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead sx={{ bgcolor: 'rgba(241,245,249,0.8)' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Personal</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Departamento</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
             <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contactos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                No se encontraron contactos
              </TableCell>
            </TableRow>
          ) : (
            contactos.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: c.color, fontSize: '0.75rem', width: 36, height: 36 }}>
                      {c.iniciales}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{c.full_name}</Typography>
                      {c.date_created && (
                        <Typography variant="caption" color="text.secondary">
                          Desde {new Date(c.date_created).toLocaleDateString('es-CO')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={c.department} size="small" variant="outlined"
                    sx={{ borderColor: '#004a99', color: '#004a99', fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{c.phone_number}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={c.visibility_type} size="small"
                    color={chipColor(c.visibility_type)} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Ver">
                      <IconButton size="small" sx={{ color: '#64748b', '&:hover': { color: '#004a99' } }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" sx={{ color: '#64748b', '&:hover': { color: '#f59e0b' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                        onClick={() => onEliminar?.(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};