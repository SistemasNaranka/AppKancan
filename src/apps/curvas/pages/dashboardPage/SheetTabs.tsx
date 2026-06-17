// Tabs horizontales con la lista de hojas/lotes activos en el dashboard.

import React from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import dayjs from "dayjs";
import { BRAND, MONO_FONT } from "./dashboard.constants";

interface SheetTabsProps {
  allSheets: any[];
  sheetIndex: number;
  setSheetIndex: (i: number) => void;
  extractRef: (s: any) => string;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  allSheets,
  sheetIndex,
  setSheetIndex,
  extractRef,
}) => {
  return (
    <Tabs
      value={sheetIndex}
      onChange={(_, v) => setSheetIndex(v)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: "#fafafa",
        borderBottom: "1px solid #e5e7eb",
        "& .MuiTabs-indicator": { display: "none" },
        "& .MuiTabs-flexContainer": { gap: 0.5 },
      }}
    >
      {allSheets.map((sheet, i) => {
        const tabFecha = (sheet as any).fechaCarga
          ? dayjs((sheet as any).fechaCarga).format("DD/MM/YY")
          : null;
        return (
          <Tab
            key={i}
            label={
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                  lineHeight: 1,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: MONO_FONT,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    lineHeight: 1.2,
                    color: "inherit",
                  }}
                >
                  {extractRef(sheet)}
                </Typography>
                {tabFecha && (
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      lineHeight: 1.1,
                      color:
                        sheetIndex === i ? BRAND.primary : "#9ca3af",
                      letterSpacing: 0.2,
                    }}
                  >
                    {tabFecha}
                  </Typography>
                )}
              </Box>
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              minHeight: tabFecha ? 48 : 36,
              borderRadius: "8px",
              fontSize: "0.8rem",
              px: 2,
              fontFamily: MONO_FONT,
              transition: "all 0.2s ease",
              color: sheetIndex === i ? BRAND.primary : "#6b7280",
              bgcolor: sheetIndex === i ? "white" : "transparent",
              border:
                sheetIndex === i
                  ? "1px solid #e5e7eb"
                  : "1px solid transparent",
              boxShadow:
                sheetIndex === i ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              "&.Mui-selected": {
                color: BRAND.primary,
                bgcolor: "white",
                border: "1px solid #e5e7eb",
              },
              "&:hover": {
                bgcolor: sheetIndex === i ? "white" : "#f3f4f6",
              },
            }}
          />
        );
      })}
    </Tabs>
  );
};
