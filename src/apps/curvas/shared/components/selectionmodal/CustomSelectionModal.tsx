/** @jsxImportSource react */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Fade,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";

export interface SelectionItem {
  id: number | string;
  label: string;
  description?: string;
}

interface CustomSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: string[]) => void;
  items: SelectionItem[];
  title: string;
  initialSelected?: number[];
  labelKey?: keyof SelectionItem;
  multiSelect?: boolean;
}

const CustomSelectionModal = ({
  open,
  onClose,
  onConfirm,
  items,
  title,
  initialSelected = [],
  labelKey = "label",
  multiSelect = false,
}: CustomSelectionModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>(initialSelected);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setSearch("");
    }
  }, [open, initialSelected]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        String(item[labelKey]).toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [items, search, labelKey]);

  const handleToggle = (index: number) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setSelected([index]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selected.map(String));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth TransitionComponent={Fade}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
          {filteredItems.map((item, idx) => (
            <ListItem
              key={item.id}
              button
              selected={selected.includes(idx)}
              onClick={() => handleToggle(idx)}
            >
              <ListItemAvatar>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#e2e8f0", fontSize: "0.8rem" }}>
                  {String(item.label).charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={String(item[labelKey])}
                secondary={item.description}
                primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              {multiSelect && (
                <Checkbox checked={selected.includes(idx)} size="small" />
              )}
            </ListItem>
          ))}
          {filteredItems.length === 0 && (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron resultados
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained">
          {multiSelect ? "Seleccionar" : "Aceptar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomSelectionModal;
