// Wrapper del DataGrid con la toolbar custom y los estilos del dashboard.

import React from "react";
import { Box, alpha } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { BRAND } from "./dashboard.constants";
import { DashboardToolbar } from "./DashboardToolbar";

interface DashboardDataGridProps {
  filas: any[];
  columnas: GridColDef[];
  isToday: boolean;
  currentRef?: string;
  onOpenSelector: () => void;
  onCellClick: (rowId: string, field: string) => void;
  onCellEdit: (rowId: string, field: string, value: any) => void;
  onPaste: (event: React.ClipboardEvent) => void;
}

export const DashboardDataGrid: React.FC<DashboardDataGridProps> = ({
  filas,
  columnas,
  isToday,
  currentRef,
  onOpenSelector,
  onCellClick,
  onCellEdit,
  onPaste,
}) => {
  return (
    <Box
      className="tour-curvas-datagrid"
      sx={{
        height: "calc(100vh - 280px)",
        minHeight: 400,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      onPaste={onPaste}
    >
      <DataGrid
        rows={filas}
        columns={columnas}
        slots={{
          toolbar: () => (
            <DashboardToolbar
              currentRef={currentRef}
              onOpenSelector={onOpenSelector}
            />
          ),
        }}
        onCellClick={(params) =>
          onCellClick(String(params.id), params.field)
        }
        processRowUpdate={(newRow: any) => {
          if (!isToday) return newRow;
          const oldRow = filas.find((r) => r.id === newRow.id);
          if (oldRow) {
            Object.keys(newRow).forEach((key) => {
              if (
                key.startsWith("val_") &&
                newRow[key] !== oldRow[key]
              )
                onCellEdit(String(newRow.id), key, newRow[key]);
            });
          }
          return newRow;
        }}
        autoHeight={false}
        sx={{
          border: "none",
          width: "100%",
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#fafafa",
            borderTop: "1px solid #e5e7eb",
            borderBottom: "2px solid #e5e7eb",
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
              color: "#6b7280",
              fontSize: "0.7rem",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
          },
          "& .MuiDataGrid-row": {
            borderBottom: "none",
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: alpha(BRAND.primary, 0.03) },
          },
          "& .MuiDataGrid-row:last-child": {
            bgcolor: "transparent",
            fontWeight: 800,
            position: "sticky",
            bottom: 0,
            zIndex: 2,
            "& .MuiDataGrid-cell": {
              color: BRAND.primary,
              fontSize: "0.9rem",
            },
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#f3f4f6",
            borderBottom: "1px solid #f3f4f6",
            "&:focus": {
              outline: `2px solid ${BRAND.primary}`,
              outlineOffset: -2,
            },
            "&:focus-within": {
              outline: `2px solid ${BRAND.primary}`,
              outlineOffset: -2,
            },
          },
          "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-withBorder": {
            border: "none",
          },
          "& .MuiDataGrid-filler": {
            borderTop: "none",
          },
          "& .MuiTablePagination-toolbar": {
            borderBottom: "1px solid #f3f4f6",
          },
        }}
      />
    </Box>
  );
};
