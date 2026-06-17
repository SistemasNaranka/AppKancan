import React from "react";
import { Box, TextField, Typography, alpha } from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { BRAND, MONO_FONT } from "./dashboard.constants";

interface BuildColumnsParams {
  datosActuales: any | null;
  canEdit: boolean;
  isToday: boolean;
  cambiarTalla: (
    sheetId: string,
    oldTalla: string,
    newTalla: string,
  ) => void;
}

export function buildDashboardColumns({
  datosActuales,
  canEdit,
  isToday,
  cambiarTalla,
}: BuildColumnsParams): GridColDef[] {
  if (!datosActuales) return [];
  const isMatriz = "curvas" in datosActuales;
  const items: string[] = isMatriz
    ? (datosActuales as any).curvas
    : (datosActuales as any).tallas;

  const cols: GridColDef[] = [
    {
      field: "tienda",
      headerName: "ESTABLECIMIENTO",
      minWidth: 280,
      flex: 2,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const isTotalRow = params.row.id === "row-total-final";
        return (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              bgcolor: isTotalRow ? BRAND.primary : "transparent",
              color: isTotalRow ? "white" : BRAND.text,
              px: 2.5,
              fontWeight: isTotalRow ? 800 : 600,
              gap: 1.5,
              boxSizing: "border-box",
            }}
          >
            <StorefrontIcon
              sx={{
                fontSize: 17,
                opacity: isTotalRow ? 0.9 : 0.7,
                color: isTotalRow ? "white" : BRAND.primary,
                flexShrink: 0,
              }}
            />
            <Typography
              noWrap
              sx={{
                fontWeight: "inherit",
                fontSize: "0.82rem",
                letterSpacing: -0.3,
              }}
            >
              {params.row.tienda?.nombre || ""}
            </Typography>
          </Box>
        );
      },
      valueGetter: (_val: any, row: any) => row.tienda?.nombre || "",
    },
  ];

  items.forEach((item) => {
    cols.push({
      field: `val_${item}`,
      renderHeader: () => (
        <Box sx={{ textAlign: "center", lineHeight: 1.1, py: 0.5 }}>
          {isToday && canEdit ? (
            <TextField
              size="small"
              defaultValue={
                item.length === 1 && !isNaN(Number(item)) ? `0${item}` : item
              }
              onBlur={(e) => {
                const newValue = e.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 2);
                if (newValue && newValue !== item && datosActuales?.id) {
                  cambiarTalla(datosActuales.id, item, newValue);
                }
              }}
              inputProps={{
                style: {
                  textAlign: "center",
                  fontFamily: MONO_FONT,
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  color: BRAND.text,
                  letterSpacing: 0.5,
                  padding: "2px 4px",
                  height: "auto",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { border: "1px solid rgba(0,0,0,0.1)" },
                  "&.Mui-focused fieldset": { border: "1px solid #1976d2" },
                },
                "& .MuiOutlinedInput-input": { padding: "2px 4px" },
                minWidth: 40,
                maxWidth: 50,
              }}
            />
          ) : (
            <Typography
              sx={{
                fontFamily: MONO_FONT,
                fontWeight: 900,
                fontSize: "0.78rem",
                color: BRAND.text,
                letterSpacing: 0.5,
              }}
            >
              {item.length === 1 && !isNaN(Number(item)) ? `0${item}` : item}
            </Typography>
          )}
        </Box>
      ),
      minWidth: 65,
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      editable: false,
      renderCell: (params: GridRenderCellParams) => {
        const valor = Number(params.value || 0);
        const isTotalRow = params.row.id === "row-total-final";
        if (isTotalRow) {
          return (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "white",
                fontSize: "1rem",
                fontFamily: MONO_FONT,
                bgcolor: alpha(BRAND.primary, 0.25),
                boxSizing: "border-box",
              }}
            >
              <Typography
                sx={{
                  fontFamily: MONO_FONT,
                  fontWeight: 900,
                  color: "white",
                  fontSize: "1rem",
                }}
              >
                {valor || "—"}
              </Typography>
            </Box>
          );
        }
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
            }}
          >
            <Typography
              sx={{
                fontFamily: MONO_FONT,
                fontSize: "0.88rem",
                fontWeight: valor > 0 ? 700 : 500,
                color: valor > 0 ? BRAND.text : "#cbd5e1",
              }}
            >
              {valor}
            </Typography>
          </Box>
        );
      },
    });
  });

  cols.push({
    field: "total",
    headerName: "TOTAL",
    minWidth: 110,
    flex: 1,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params: GridRenderCellParams) => {
      const isTotalRow = params.row.id === "row-total-final";
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isTotalRow ? BRAND.primary : alpha(BRAND.primary, 0.06),
            boxSizing: "border-box",
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontFamily: MONO_FONT,
              color: isTotalRow ? "white" : BRAND.primary,
              fontSize: isTotalRow ? "0.95rem" : "0.88rem",
            }}
          >
            {Number(params.value || 0).toLocaleString()}
          </Typography>
        </Box>
      );
    },
  });

  return cols;
}
