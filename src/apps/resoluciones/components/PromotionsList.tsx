import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import { promotionColors } from "../data/mockPromotionsColors";
import { useFilteredPromotions } from "../hooks/useFilteredPromotions";

interface PromotionsListProps {
  onSelect?: (promo: any) => void;
}

const PromotionsList: React.FC<PromotionsListProps> = ({ onSelect }) => {
  const filteredPromotions = useFilteredPromotions();
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const theme = useTheme();

  return (
    <>
      <Box display="flex" flexDirection="column" gap={1} sx={{ maxHeight: "100%", overflowY: "auto" }}>
        {filteredPromotions.length === 0 && (
          <Typography variant="caption" color="text.secondary" textAlign="center" fontStyle="italic">
            Sin promociones
          </Typography>
        )}

        {filteredPromotions.map((promo) => (
          <Paper
            key={promo.id}
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              cursor: onSelect ? "pointer" : "default",
              "&:hover": onSelect ? { backgroundColor: "action.hover" } : undefined,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
            onClick={() => onSelect?.(promo)}
          >
            <Typography variant="body2" fontWeight="bold" sx={{ color: promotionColors[promo.tipo] }}>
              {promo.tipo} — {promo.descuento}%
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {promo.fecha_inicio}
              {promo.fecha_final ? ` → ${promo.fecha_final}` : ""}
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {promo.tiendas.slice(0, 3).map((t) => (
                <Chip
                  key={t}
                  size="small"
                  label={t}
                  sx={{
                    fontSize: "0.65rem",
                    bgcolor: "transparent",
                    border: `1px solid ${promotionColors[promo.tipo]}`,
                    color: promotionColors[promo.tipo],
                    height: 18,
                    "& .MuiChip-label": { px: 0.5 },
                  }}
                />
              ))}
              {promo.tiendas.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  +{promo.tiendas.length - 3} más
                </Typography>
              )}
            </Box>

            <Button
              size="small"
              variant="outlined"
              sx={{ mt: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPromo(promo);
              }}
            >
              Ver detalles
            </Button>
          </Paper>
        ))}
      </Box>

      {/* Modal de detalles con grid para tiendas */}
      <Dialog open={!!selectedPromo} onClose={() => setSelectedPromo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles de la promoción</DialogTitle>
        <DialogContent dividers>
          {selectedPromo && (
            <>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ color: promotionColors[selectedPromo.tipo] }}
                gutterBottom
              >
                {selectedPromo.tipo} — {selectedPromo.descuento}%
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedPromo.fecha_inicio}
                {selectedPromo.fecha_final ? ` → ${selectedPromo.fecha_final}` : ""}
              </Typography>

              <Typography variant="body2" gutterBottom>
                {selectedPromo.descripcion}
              </Typography>

              <Typography variant="subtitle2" mt={1} gutterBottom>
                Tiendas:
              </Typography>

              <Box display="flex" flexDirection="column" gap={0.5} maxHeight={300} overflow="auto">
                {selectedPromo.tiendas.map((t: string) => (
                  <Paper
                    key={t}
                    variant="outlined"
                    sx={{
                      px: 1,
                      py: 0.25,
                      fontSize: "0.85rem",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      borderColor: promotionColors[selectedPromo.tipo],
                      color: promotionColors[selectedPromo.tipo],
                      bgcolor: "transparent",
                    }}
                  >
                    {t}
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPromo(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PromotionsList;
