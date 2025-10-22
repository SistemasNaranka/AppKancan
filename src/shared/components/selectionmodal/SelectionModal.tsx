import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  InputAdornment,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { CheckSquare, SquareX } from 'lucide-react';
import { useTheme } from "@mui/material/styles";
export interface SelectionItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface SelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: (string | number)[]) => void;
  items: SelectionItem[];
  title?: string;
  mode?: 'select' | 'view';
  initialSelected?: (string | number)[];
  modalHeight?: number | string;
  maxColumns?: number;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  items,
  title = 'Selecciona elementos',
  mode = 'select',
  initialSelected = [],
  modalHeight = 600,
  maxColumns = 3,
}) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<Set<string | number>>(new Set(initialSelected));
  const [searchTerm, setSearchTerm] = useState('');
  const [openAutocomplete, setOpenAutocomplete] = useState(false);
  const autocompleteRef = useRef(null);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [items, searchTerm]);

  const handleToggleItem = useCallback((id: string | number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const handleSelectAll = () => setSelected(new Set(items.map(i => i.id)));
  const handleDeselectAll = () => setSelected(new Set());
  const handleConfirm = () => { onConfirm(Array.from(selected)); onClose(); };

  const handleClose = () => {
    setSearchTerm('');
    setSelected(new Set(initialSelected));
    setOpenAutocomplete(false);
    onClose();
  };

  const handleAutocompleteSelect = (event: any, value: SelectionItem | null) => {
    if (value) {
      handleToggleItem(value.id);
      setSearchTerm('');
      setOpenAutocomplete(false);
    }
  };

  const isAllSelected = items.length > 0 && selected.size === items.length;

  const SelectionCard = React.memo(
    ({ item, selected, onToggle, mode }: any) => (
      <Card
        key={item.id}
        sx={{
          cursor: mode === 'select' ? 'pointer' : 'default',
          backgroundColor: selected ? '#eef2ff' : 'white',
          border: '2px solid',
          borderColor: selected ? '#667eea' : '#e0e7ff',
        }}
        onClick={() => mode === 'select' && onToggle(item.id)}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {item.label}
          </Typography>
          {item.description && (
            <Typography variant="caption" sx={{ color: '#718096' }}>
              {item.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    ),
    (prev, next) => prev.selected === next.selected && prev.item.id === next.item.id
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          height: modalHeight,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: '1.5rem',
          fontWeight: 600,
          background: theme.palette.primary.main,
          color: 'white',
          pb: 2,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ py: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Autocomplete
            ref={autocompleteRef}
            options={filteredItems}
            getOptionLabel={(option) => option.label}
            inputValue={searchTerm}
            onInputChange={(_, value) => {
              setSearchTerm(value);
              setOpenAutocomplete(value.length > 0);
            }}
            onChange={handleAutocompleteSelect}
            open={openAutocomplete && filteredItems.length > 0}
            onClose={() => setOpenAutocomplete(false)}
            noOptionsText="No se encontraron elementos"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Buscar..."
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {mode === 'select' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                borderRadius: 1,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                Seleccionados: {selected.size} / {items.length}
              </Typography>

              <Button
                size="small"
                startIcon={<CheckSquare size={16} />}
                onClick={handleSelectAll}
                disabled={isAllSelected}
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 'auto',
                  '&:hover': { textDecoration: 'underline' },
                  '&:disabled': { color: '#cbd5e1' },
                }}
              >
                Seleccionar todo
              </Button>

              <Button
                size="small"
                startIcon={<SquareX size={16} />}
                onClick={handleDeselectAll}
                disabled={selected.size === 0}
                sx={{
                  color: 'primary.main',
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: 'auto',
                  ml: 1,
                  '&:hover': { textDecoration: 'underline' },
                  '&:disabled': { color: '#cbd5e1' },
                }}
              >
                Deseleccionar todo
              </Button>
            </Box>
          )}

          <Divider />

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#a5b4fc',
                borderRadius: 4,
              },
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: `repeat(${maxColumns}, 1fr)`,
                },
                gap: 1.5,
              }}
            >
              {[...items]
                .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
                .map((item) => (
                  <SelectionCard
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onToggle={handleToggleItem}
                    mode={mode}
                  />
                ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e7ff', p: 2 }}>
        <Button
          onClick={handleClose}
          //variant="outlined"
          sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 500,background: theme.palette.background.paper, color: theme.palette.error.main }}
        >
          Cancelar
        </Button>
        {mode === 'select' && (
          <Button
            onClick={handleConfirm}
            //variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              //background: theme.lightheme.background.paper,
              background: theme.palette.background.paper,
              color: theme.palette.primary.main
            }}
          >
            Confirmar ({selected.size})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SelectionModal;
