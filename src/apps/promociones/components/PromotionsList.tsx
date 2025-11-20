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

import { useFilteredPromotions } from "../hooks/useFilteredPromotions";
import { CalendarToday, LocalOffer, Store } from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

interface PromotionsListProps {
  onSelect?: (promo: any) => void;
}

const PromotionsList: React.FC<PromotionsListProps> = ({ onSelect }) => {
  const filteredPromotions = useFilteredPromotions();
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const theme = useTheme();

  // ✅ Fechas simplificadas sin errores de zona horaria
  const formatSimplifiedDate = (
    fechaInicio: string,
    fechaFinal: string | null
  ) => {
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
      });
    };
    if (fechaFinal) {
      return `${formatDate(fechaInicio)} - ${formatDate(fechaFinal)}`;
    } else {
      return formatDate(fechaInicio);
    }
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
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
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

              {/* Nombre de la promoción */}
              <Typography
                variant="subtitle1"
                fontWeight="600"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: "0.9rem",
                  mt: 0.5,
                }}
              >
                {promo.descripcion}
              </Typography>

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
        {selectedPromo &&
          (() => {
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
                  <Box display="flex" flexDirection="column" gap={3}>
                    {/* Header principal con descuento y tipo */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      gap={2}
                    >
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color="primary"
                        sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}
                      >
                        {selectedPromo.descuento}% OFF
                      </Typography>
                      <Chip
                        label={selectedPromo.tipo}
                        size="medium"
                        sx={{
                          backgroundColor: color,
                          color: "white",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          px: 2,
                        }}
                      />
                    </Box>

                    {/* Nombre de la promoción */}
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight="600"
                        color="text.primary"
                        sx={{ mb: 1 }}
                      >
                        {selectedPromo.descripcion}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontStyle: "italic",
                          borderLeft: `3px solid ${color}`,
                          pl: 2,
                          py: 0.5,
                          backgroundColor: `${color}08`,
                        }}
                      >
                        {selectedPromo.duracion === "temporal"
                          ? "Promoción Temporal"
                          : "Promoción Fija"}
                      </Typography>
                    </Box>

                    {/* Información de fechas */}
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "grey.50",
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarToday color="action" />
                        <Typography variant="subtitle1" fontWeight="600">
                          Vigencia
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="text.primary">
                        {formatSimplifiedDate(
                          selectedPromo.fecha_inicio,
                          selectedPromo.fecha_final
                        )}
                      </Typography>
                    </Box>

                    {/* Observaciones */}
                    {selectedPromo.observaciones && (
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "info.50",
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.info.light}`,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="600"
                          color="info.main"
                          sx={{ mb: 1 }}
                        >
                          Observaciones
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          lineHeight={1.6}
                        >
                          {selectedPromo.observaciones}
                        </Typography>
                      </Box>
                    )}

                    {/* Tiendas participantes */}
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Store color="action" />
                        <Typography variant="subtitle1" fontWeight="600">
                          Tiendas participantes ({selectedPromo.tiendas.length})
                        </Typography>
                      </Box>

                      {/* Contenedor con mejor indicación de scroll */}
                      <Box
                        sx={{
                          position: "relative",
                          maxHeight: 300,
                          overflow: "hidden",
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          backgroundColor: "grey.50",
                        }}
                      >
                        {/* Indicador de scroll superior (sombra) */}
                        {selectedPromo.tiendas.length > 9 && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 20,
                              background:
                                "linear-gradient(to bottom, rgba(0,0,0,0.06), transparent)",
                              pointerEvents: "none",
                              zIndex: 1,
                            }}
                          />
                        )}

                        {/* Grid de tiendas con scroll mejorado */}
                        <Box
                          display="grid"
                          gridTemplateColumns={{
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(3, 1fr)",
                          }}
                          gap={1.5}
                          sx={{
                            maxHeight: 300,
                            overflowY: "auto",
                            p: 2,
                            // Scrollbar personalizado más visible
                            "&::-webkit-scrollbar": {
                              width: 14,
                              backgroundColor: "transparent",
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: "rgba(0, 0, 0, 0.05)",
                              borderRadius: 7,
                              margin: "8px 0",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor:
                                color || theme.palette.primary.main,
                              borderRadius: 7,
                              border: "3px solid transparent",
                              backgroundClip: "padding-box",
                              opacity: 0.8,
                              "&:hover": {
                                backgroundColor: theme.palette.primary.dark,
                                opacity: 1,
                              },
                            },
                            // Para Firefox
                            scrollbarWidth: "thin",
                            scrollbarColor: `${
                              color || theme.palette.primary.main
                            } rgba(0, 0, 0, 0.05)`,
                          }}
                        >
                          {selectedPromo.tiendas.map(
                            (tienda: string, index: number) => (
                              <Paper
                                key={`${tienda}-${index}`}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  border: `1px solid ${theme.palette.divider}`,
                                  backgroundColor: "background.paper",
                                  transition: "background-color 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minHeight: 50,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="500"
                                  textAlign="center"
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {tienda}
                                </Typography>
                              </Paper>
                            )
                          )}
                        </Box>

                        {/* Indicador de scroll inferior */}
                        {selectedPromo.tiendas.length > 9 && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 20,
                              background:
                                "linear-gradient(to top, rgba(0,0,0,0.06), transparent)",
                              pointerEvents: "none",
                              zIndex: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
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
