// Toolbar superior del DataGrid: buscador rápido + botón de lote actual + filtros.

import React from "react";
import { Box, Button, InputAdornment, Stack } from "@mui/material";
import { QuickFilter, Toolbar, FilterPanelTrigger } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import FilterIcon from "@mui/icons-material/FilterList";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { BRAND } from "./dashboard.constants";

interface DashboardToolbarProps {
  currentRef?: string;
  onOpenSelector: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  currentRef,
  onOpenSelector,
}) => {
  return (
    <Box
      sx={{
        p: 1,
        px: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderBottom: "1px solid #e5e7eb",
        bgcolor: "#fafafa",
      }}
    >
      <QuickFilter
        placeholder="Buscar establecimiento..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
              </InputAdornment>
            ),
            sx: {
              height: 34,
              borderRadius: 2,
              fontSize: "0.82rem",
              bgcolor: "white",
              width: 280,
              "& fieldset": { borderColor: "#e5e7eb" },
              "&:hover fieldset": { borderColor: "#d1d5db" },
              "&.Mui-focused fieldset": { borderColor: BRAND.primary },
            },
          },
        }}
      />

      <Box sx={{ flexGrow: 1 }}></Box>

      <Toolbar
        render={
          <Stack direction="row" spacing={1}>
            {currentRef && (
              <Button
                size="small"
                onClick={onOpenSelector}
                startIcon={<LibraryBooksIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  color: BRAND.primary,
                  px: 1.5,
                  bgcolor: "white",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.8rem",
                  height: 34,
                  "&:hover": { bgcolor: "#f9fafb", borderColor: "#d1d5db" },
                }}
              >
                {currentRef}
              </Button>
            )}
            <FilterPanelTrigger
              render={
                <Button
                  size="small"
                  startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    color: "#6b7280",
                    px: 1.5,
                    bgcolor: "white",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.8rem",
                    height: 34,
                    "&:hover": { bgcolor: "#f9fafb", borderColor: "#d1d5db" },
                  }}
                >
                  Filtros
                </Button>
              }
            />
          </Stack>
        }
      />
    </Box>
  );
};
