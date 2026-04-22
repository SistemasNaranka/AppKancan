import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  InputAdornment,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useContracts } from '../hooks/useContracts';

interface ContractSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contractId: number) => void;
}

const ContractSelectorModal: React.FC<ContractSelectorModalProps> = ({ open, onClose, onSelect }) => {
  const { allEnriched } = useContracts();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allEnriched.slice(0, 50); // Show recent 50 when empty
    
    return allEnriched.filter(c => {
      return (
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.apellido && c.apellido.toLowerCase().includes(q)) ||
        (c.documento && c.documento.toLowerCase().includes(q)) ||
        (c.cargo && String(c.cargo).toLowerCase().includes(q)) ||
        (c.tipo_contrato && c.tipo_contrato.toLowerCase().includes(q)) ||
        (c.id && String(c.id).includes(q))
      );
    }).slice(0, 50);
  }, [allEnriched, query]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>Seleccionar un contrato</Typography>
        <Typography variant="body2" color="text.secondary">
          Busca por nombre, documento, cargo, N° de prórroga o tipo.
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Buscar empleado o contrato..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              sx: { bgcolor: 'background.paper' }
            }}
          />
        </Box>

        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0, maxHeight: 400, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No se encontraron resultados.</Typography>
            </Box>
          ) : (
            filtered.map((c) => {
              const isCritico = c.daysLeft >= 0 && c.daysLeft <= 30;
              const isVencido = c.daysLeft < 0;

              return (
                <ListItemButton
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#004680', width: 40, height: 40 }}>
                      <PersonIcon sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 24 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={700}>{c.nombre} {c.apellido}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary" noWrap>ID: {c.documento} — {c.cargo}</Typography>}
                  />
                  <Box textAlign="right">
                    <Chip 
                      label={isVencido ? 'Vencido' : isCritico ? 'Próximo a Vencer' : 'Activo'}
                      size="small"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.65rem', 
                        fontWeight: 700,
                        bgcolor: isVencido ? '#f3f4f6' : isCritico ? '#fffbeb' : '#f0fdf4',
                        color: isVencido ? '#4b5563' : isCritico ? '#d97706' : '#16a34a',
                       }}
                    />
                  </Box>
                </ListItemButton>
              );
            })
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1.5 }}>
        <Button onClick={onClose} variant="text" color="inherit">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractSelectorModal;
