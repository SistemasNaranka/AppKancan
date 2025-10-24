import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useFilteredPromotions } from "../hooks/useFilteredPromotions";
import { CalendarToday, LocalOffer, Store } from "@mui/icons-material";

interface PromotionsListProps {
  onSelect?: (promo: any) => void;
}

const PromotionsList: React.FC<PromotionsListProps> = ({ onSelect }) => {
  const filteredPromotions = useFilteredPromotions();
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const theme = useTheme();

  // ✅ Fechas simplificadas sin errores de zona horaria
  const formatSimplifiedDate = (fechaInicio: string, fechaFinal: string) => {
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
      });
    };
    return `${formatDate(fechaInicio)} - ${formatDate(fechaFinal)}`;
  };

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{ maxHeight: "100%", overflowY: "auto" }}
      >
        {/* 🔹 Título principal */}
        <Typography
          variant="h6"
          fontWeight={700}
          gutterBottom
          sx={{ color: "primary.main", px: 1, margin: "0 auto" }}
        >
          Promociones
        </Typography>

        {/* 🔸 Sin resultados */}
        {filteredPromotions.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              backgroundColor: "grey.50",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              No hay promociones que coincidan con los filtros
            </Typography>
          </Paper>
        )}

        {/* 🔸 Lista de promociones */}
        {filteredPromotions.map((promo) => {
          const color = promo.color || theme.palette.primary.main;

          return (
            <Paper
              key={promo.id}
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                cursor: onSelect ? "pointer" : "default",
                "&:hover": onSelect
                  ? {
                      backgroundColor: "action.hover",
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease",
                      boxShadow: theme.shadows[4],
                    }
                  : undefined,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                background: `linear-gradient(135deg, ${color}15, ${color}08)`,
              }}
              onClick={() => onSelect?.(promo)}
            >
              {/* Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <LocalOffer fontSize="small" sx={{ color }} />
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: "1.25rem",
                    }}
                  >
                    {promo.descuento}% OFF
                  </Typography>
                </Box>
                <Chip
                  label={promo.tipo}
                  size="small"
                  sx={{
                    backgroundColor: color,
                    color: "white",
                    fontWeight: "600",
                    fontSize: "0.75rem",
                    borderRadius: 1,
                  }}
                />
              </Box>

              {/* Fechas */}
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarToday
                  fontSize="small"
                  sx={{ color: "text.secondary", fontSize: "16px" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight="500"
                >
                  {formatSimplifiedDate(promo.fecha_inicio, promo.fecha_final)}
                </Typography>
              </Box>

              {/* Tiendas */}
              <Box display="flex" alignItems="center" gap={1}>
                <Store
                  fontSize="small"
                  sx={{ color: "text.secondary", fontSize: "16px" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight="500"
                >
                  {promo.tiendas.length} tienda
                  {promo.tiendas.length !== 1 ? "s" : ""}
                </Typography>
              </Box>

              {/* Botón de detalles */}
              <Button
                size="small"
                variant="outlined"
                sx={{
                  mt: 0.5,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: "500",
                  borderColor: color,
                  color,
                  "&:hover": {
                    borderColor: color,
                    backgroundColor: `${color}15`,
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPromo(promo);
                }}
              >
                Ver detalles
              </Button>
            </Paper>
          );
        })}
      </Box>

      {/* 🔸 Modal de detalles */}
      <Dialog
        open={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        {selectedPromo && (() => {
          const color = selectedPromo.color || theme.palette.primary.main;
          return (
            <>
              <DialogTitle
                sx={{
                  backgroundColor: `${color}15`,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <LocalOffer sx={{ color }} />
                  <Typography variant="h6" fontWeight="bold">
                    Detalles de la promoción
                  </Typography>
                </Box>
              </DialogTitle>

              <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {selectedPromo.descuento}% OFF
                      </Typography>
                      <Chip
                        label={selectedPromo.tipo}
                        sx={{
                          backgroundColor: color,
                          color: "white",
                          fontWeight: "600",
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday color="action" />
                      <Typography variant="body1" fontWeight="500">
                        {formatSimplifiedDate(
                          selectedPromo.fecha_inicio,
                          selectedPromo.fecha_final
                        )}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      lineHeight={1.6}
                    >
                      {selectedPromo.descripcion}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Store color="action" />
                      <Typography variant="subtitle1" fontWeight="600">
                        {selectedPromo.tiendas.length} Tienda
                        {selectedPromo.tiendas.length !== 1 ? "s" : ""} participantes
                      </Typography>
                    </Box>

                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={1}
                      maxHeight={200}
                      overflow="auto"
                      sx={{
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-track": {
                          background: "grey.100",
                          borderRadius: 1,
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "grey.400",
                          borderRadius: 1,
                        },
                      }}
                    >
                      {selectedPromo.tiendas.map((t: string) => (
                        <Paper
                          key={t}
                          variant="outlined"
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            borderColor: theme.palette.divider,
                            backgroundColor: "grey.50",
                            "&:hover": {
                              backgroundColor: "grey.100",
                            },
                          }}
                        >
                          <Typography variant="body2" fontWeight="500">
                            {t}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions
                sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}
              >
                <Button
                  onClick={() => setSelectedPromo(null)}
                  variant="contained"
                  sx={{
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: "500",
                  }}
                >
                  Cerrar
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </>
  );
};

export default PromotionsList;
