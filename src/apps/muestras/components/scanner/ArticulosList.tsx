// src/components/scanner/ArticulosList.tsx
import { Box, IconButton, Typography, Stack, Paper } from "@mui/material";
import { Delete, RemoveCircle } from "@mui/icons-material";
import { Articulo } from "./types";

interface ArticulosListProps {
  articulos: Articulo[];
  onDelete: (referencia: string) => void;
  onReduce: (referencia: string) => void;
}

export const ArticulosList: React.FC<ArticulosListProps> = ({
  articulos,
  onDelete,
  onReduce,
}) => {
  if (articulos.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,

          color: "grey.500",
          fontStyle: "italic",
        }}
      >
        <Typography variant="h6">Escanea un artículo para comenzar</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        overflowX: "hidden",
        pr: 1,
        pt: 1,
        pb: 1,
        display: "grid",
        gap: 2,
        boxSizing: "border-box",
        alignItems: "start",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        justifyItems: "center",
      }}
    >
      {articulos.map((item) => (
        <Paper
          key={item.codigo}
          sx={(theme) => ({
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1.5,
            gap: 0.8,
            borderRadius: 2,
            width: "100%",
            maxWidth: 280,
            mb: 1,
            minWidth: 240,
            minHeight: 120,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[3],
            cursor: "default",
            transition: "all 0.25s ease",
            "&:hover": {
              boxShadow: theme.shadows[6],
              transform: "translateY(-1px)",
            },
          })}
        >
          {/* Código del artículo */}
          <Typography
            variant="h5"
            fontWeight="bold"
            fontFamily="monospace"
            sx={{
              fontSize: item.codigo.length > 10 ? "1.6rem" : "1.6rem",
              color: "text.primary",
              letterSpacing: 1,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.codigo}
          </Typography>

          {/* Footer con cantidad y acciones */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Cantidad */}
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 0.7,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                }}
              >
                {item.cantidad}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "1.3rem" }}
              >
                {item.cantidad === 1 ? "unidad" : "unidades"}
              </Typography>
            </Box>

            {/* Botones de acción */}
            <Stack direction="row" spacing={0.5}>
              {item.cantidad > 1 && (
                <IconButton
                  size="medium"
                  onClick={() => onReduce(item.codigo)}
                  sx={{
                    color: "warning.main",
                    "&:hover": {
                      bgcolor: "#FFEEB8",
                    },
                  }}
                >
                  <RemoveCircle sx={{ fontSize: 24 }} />
                </IconButton>
              )}
              <IconButton
                size="medium"
                onClick={() => onDelete(item.codigo)}
                sx={{
                  color: "error.main",
                  "&:hover": {
                    bgcolor: "error.light",
                  },
                }}
              >
                <Delete sx={{ fontSize: 24 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
};
