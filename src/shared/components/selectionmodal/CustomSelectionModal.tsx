import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
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
  Portal,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { CheckSquare, SquareX } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

export interface SelectionItem {
  id: string | number;
  [key: string]: any;
}

export interface SelectionCardProps {
  item: SelectionItem;
  selected: boolean;
  onToggle: (id: string | number) => void;
  mode: "select" | "view";
}

export interface CustomSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: (string | number)[]) => void;
  items: SelectionItem[];
  title?: string;
  mode?: "select" | "view";
  initialSelected?: (string | number)[];
  modalHeight?: number | string;
  maxColumns?: number;
  labelKey?: string;
}

const CustomSelectionModal: React.FC<CustomSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  items,
  title = "Selecciona elementos",
  mode = "select",
  initialSelected = [],
  maxColumns = 3,
  labelKey = "label",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const adaptiveHeight = isMobile ? 600 : 800; // <-- valor corregido según tu petición
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<Set<string | number>>(
    new Set(initialSelected)
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Sincronizar con initialSelected
  useEffect(() => {
    setSelected(new Set(initialSelected));
  }, [initialSelected]);

  // Gestión del ESC
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Auto-focus en el input de búsqueda
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        String(item[labelKey] ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false)
    );
  }, [items, searchTerm, labelKey]);

  const handleToggleItem = useCallback((id: string | number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const handleSelectAll = () => setSelected(new Set(items.map((i) => i.id)));
  const handleDeselectAll = () => setSelected(new Set());

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setTimeout(() => {
      setSelected(new Set(initialSelected));
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isAllSelected = items.length > 0 && selected.size === items.length;

  const SelectionCard = React.memo<SelectionCardProps>(
    ({ item, selected, onToggle, mode }) => (
      <Card
        key={item.id}
        sx={{
          cursor: mode === "select" ? "pointer" : "default",
          backgroundColor: selected ? "#eef2ff" : "white",
          border: "2px solid",
          borderColor: selected ? "#667eea" : "#e0e7ff",
          transition: "all 0.2s ease",
          "&:hover":
            mode === "select"
              ? {
                  borderColor: "#667eea",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
                }
              : {},
          "&:focus-visible": {
            outline: "3px solid #667eea",
            outlineOffset: "2px",
          },
        }}
        onClick={() => mode === "select" && onToggle(item.id)}
        tabIndex={mode === "select" ? 0 : undefined}
        onKeyDown={(e) => {
          if (mode === "select" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onToggle(item.id);
          }
        }}
        role={mode === "select" ? "checkbox" : undefined}
        aria-checked={mode === "select" ? selected : undefined}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {item[labelKey] ?? "(Sin nombre)"}
          </Typography>
          {item.description && (
            <Typography variant="caption" sx={{ color: "#718096" }}>
              {item.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    ),
    (prev, next) =>
      prev.selected === next.selected && prev.item.id === next.item.id
  );

  if (!open) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <Box
        onClick={handleBackdropClick}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        {/* Modal Content */}
        <Box
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            width: "100%",
            maxWidth: "900px",
            height: adaptiveHeight,
            display: "flex",
            flexDirection: "column",
            mx: 2,
            animation: "slideIn 0.3s ease",
            "@keyframes slideIn": {
              from: { opacity: 0, transform: "translateY(-20px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 2,
              background: theme.palette.primary.main,
              color: "white",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <Typography id="modal-title" variant="h5" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Button
              onClick={handleClose}
              sx={{
                minWidth: "auto",
                color: "white",
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
              aria-label="Cerrar modal"
            >
              <CloseIcon fontSize="large" />
            </Button>
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 3,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Stack spacing={2} sx={{ height: "100%" }}>
              {/* Búsqueda */}
              <Autocomplete
                freeSolo
                disableClearable
                options={[]}
                value={searchTerm}
                onInputChange={(_, newValue) => setSearchTerm(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Buscar..."
                    variant="outlined"
                    size="small"
                    inputRef={searchInputRef}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "#667eea" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {searchTerm && (
                            <InputAdornment position="end">
                              <Button
                                onClick={() => {
                                  setSearchTerm("");
                                  searchInputRef.current?.focus();
                                }}
                                size="small"
                                sx={{
                                  minWidth: 0,
                                  color: "text.secondary",
                                  p: 0.5,
                                  "&:hover": {
                                    color: theme.palette.error.main,
                                  },
                                }}
                                aria-label="Limpiar búsqueda"
                              >
                                <SquareX size={16} />
                              </Button>
                            </InputAdornment>
                          )}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {mode === "select" && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ flex: 1, fontWeight: 600 }}
                  >
                    Seleccionados: {selected.size} / {items.length}
                  </Typography>

                  <Button
                    size="small"
                    startIcon={<CheckSquare size={16} />}
                    onClick={handleSelectAll}
                    disabled={isAllSelected}
                    sx={{
                      color: "primary.main",
                      textTransform: "none",
                      fontWeight: 500,
                      minWidth: "auto",
                      "&:hover": { textDecoration: "underline" },
                      "&:disabled": { color: "#cbd5e1" },
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
                      color: "primary.main",
                      textTransform: "none",
                      fontWeight: 500,
                      minWidth: "auto",
                      ml: 1,
                      "&:hover": { textDecoration: "underline" },
                      "&:disabled": { color: "#cbd5e1" },
                    }}
                  >
                    Deseleccionar todo
                  </Button>
                </Box>
              )}

              <Divider />

              {/* Lista de items */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  pr: 1,
                  pt: 1, // Espacio adicional arriba para evitar colisión en hover
                  "&::-webkit-scrollbar": { width: 8 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#a5b4fc",
                    borderRadius: 4,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: `repeat(${maxColumns}, 1fr)`,
                    },
                    gap: 1.5,
                  }}
                >
                  {filteredItems
                    .sort((a, b) =>
                      String(a[labelKey] ?? "").localeCompare(
                        String(b[labelKey] ?? ""),
                        "es",
                        { sensitivity: "base" }
                      )
                    )
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
          </Box>

          {/* Footer */}
          <Box
            sx={{
              borderTop: "1px solid #e0e7ff",
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              onClick={handleClose}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 500,
                px: 3,
                color: theme.palette.error.main,
                borderColor: theme.palette.error.main,
              }}
              variant="outlined"
            >
              Cancelar
            </Button>
            {mode === "select" && (
              <Button
                onClick={handleConfirm}
                sx={{
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  px: 3,
                }}
                variant="contained"
                color="primary"
              >
                Confirmar ({selected.size})
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Portal>
  );
};

export default CustomSelectionModal;
