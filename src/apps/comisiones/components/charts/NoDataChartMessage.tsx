import React from "react";
import { Typography, Paper } from "@mui/material";
import {
  Insights,
  BarChart,
  PieChart,
  TrendingUp,
  Warning,
} from "@mui/icons-material";

interface NoDataChartMessageProps {
  title: string;
  message?: string;
  icon?: "default" | "bar" | "pie" | "trend" | "warning";
  height?: number;
}

export const NoDataChartMessage: React.FC<NoDataChartMessageProps> = ({
  title,
  message = "No hay datos disponibles para hacer cálculos",
  icon = "default",
  height = 250,
}) => {
  const getIcon = () => {
    const iconProps = {
      sx: {
        fontSize: 48,
        color: "text.secondary",
        mb: 1,
      },
    };

    switch (icon) {
      case "bar":
        return <BarChart {...iconProps} />;
      case "pie":
        return <PieChart {...iconProps} />;
      case "trend":
        return <TrendingUp {...iconProps} />;
      case "warning":
        return <Warning {...iconProps} />;
      default:
        return <Insights {...iconProps} />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height,
        bgcolor: "background.default",
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        p: 3,
        textAlign: "center",
      }}
    >
      {getIcon()}
      <Typography
        variant="h6"
        color="text.secondary"
        fontWeight="bold"
        gutterBottom
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 300, lineHeight: 1.4 }}
      >
        {message}
      </Typography>
    </Paper>
  );
};
