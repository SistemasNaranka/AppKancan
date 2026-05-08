import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Inventory from '@mui/icons-material/Inventory';
import Numbers from '@mui/icons-material/Numbers';

interface Props {
  articulos: number;
  unidades: number;
}

const ArticlesCounter: React.FC<Props> = ({ articulos, unidades }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // 🔹 Detecta pantallas pequeñas (por debajo de 600px)
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: isSmallScreen ? 1.5 : 2,
        mb: isSmallScreen ? 1.5 : 2,
        flexWrap: "wrap",
        justifyContent: "flex-start",
      }}
    >
      {/* —— CARD: ARTÍCULOS ESCANEADOS —— */}
      <Card
        variant="outlined"
        sx={{
          borderBottom: `4px solid ${theme.palette.primary.main}`,
          borderRadius: isSmallScreen ? 1.5 : 2,
          boxShadow: 1,
          backgroundColor: isDark ? theme.palette.background.paper : "#fff",
          minWidth: isSmallScreen ? 150 : 180,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: isSmallScreen ? 1 : 1.5,
            "&:last-child": { pb: isSmallScreen ? 1 : 1.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Inventory
              sx={{
                color: theme.palette.primary.main,
                fontSize: isSmallScreen ? 20 : 24,
                mr: isSmallScreen ? 0.7 : 1,
              }}
            />
            <Typography
              fontWeight={700}
              sx={{ fontSize: isSmallScreen ? "1.1rem" : "1.5rem" }}
            >
              Artículos:
            </Typography>
          </Box>

          <Typography
            variant="h6"
            sx={{
              ml: isSmallScreen ? 0.5 : 1,
              fontWeight: "bold",
              color: theme.palette.primary.main,
              fontSize: isSmallScreen ? "1.3rem" : "1.5rem",
            }}
          >
            {articulos}
          </Typography>
        </CardContent>
      </Card>

      {/* —— CARD: TOTAL UNIDADES —— */}
      <Card
        variant="outlined"
        sx={{
          borderBottom: `4px solid ${theme.palette.secondary.main}`,
          borderRadius: isSmallScreen ? 1.5 : 2,
          boxShadow: 1,
          backgroundColor: isDark ? theme.palette.background.paper : "#fff",
          minWidth: isSmallScreen ? 150 : 180,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: isSmallScreen ? 1 : 1.5,
            "&:last-child": { pb: isSmallScreen ? 1 : 1.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Numbers
              sx={{
                color: theme.palette.secondary.main,
                fontSize: isSmallScreen ? 20 : 24,
                mr: isSmallScreen ? 0.7 : 1,
              }}
            />
            <Typography
              fontWeight={700}
              sx={{ fontSize: isSmallScreen ? "1.1rem" : "1.5rem" }}
            >
              Unidades:
            </Typography>
          </Box>

          <Typography
            variant="h6"
            sx={{
              ml: isSmallScreen ? 0.5 : 1,
              fontWeight: "bold",
              color: theme.palette.secondary.main,
              fontSize: isSmallScreen ? "1.3rem" : "1.5rem",
            }}
          >
            {unidades}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ArticlesCounter;
