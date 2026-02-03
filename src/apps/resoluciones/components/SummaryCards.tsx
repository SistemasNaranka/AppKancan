import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface SummaryCardsProps {
  totalResoluciones: number;
  totalPendientes: number;
  totalPorVencer: number;
  totalVigentes: number;
  totalVencidos: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalResoluciones,
  totalPendientes,
  totalPorVencer,
  totalVigentes,
  totalVencidos,
}) => {
  const cards = [
    {
      label: "Total",
      value: totalResoluciones,
      color: "#1976d2",
      borderColor: "#1976d2",
    },
    {
      label: "Pendientes",
      value: totalPendientes,
      color: "#989898",
      borderColor: "#989898",
    },
    {
      label: "Por vencer",
      value: totalPorVencer,
      color: "#ed6c02",
      borderColor: "#ed6c02",
    },
    {
      label: "Vigentes",
      value: totalVigentes,
      color: "#2e7d32",
      borderColor: "#2e7d32",
    },
    {
      label: "Vencidos",
      value: totalVencidos,
      color: "#d32f2f",
      borderColor: "#d32f2f",
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <Card
          key={card.label}
          sx={{
            backgroundColor: "#ffffff",
            border: card.label === "Total" ? "1px solid #ddd" : "none",
            borderLeft: `3px solid ${card.borderColor}`,
            minWidth: { xs: 80, sm: 100, md: 110 },
            flex: { xs: "1 1 calc(50% - 8px)", sm: 1 },
          }}
        >
          <CardContent
            sx={{
              py: 0.5,
              px: 1.5,
              "&:last-child": { pb: 0.5 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              {card.label}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: card.color,
                fontSize: "1.1rem",
              }}
            >
              {card.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default SummaryCards;
