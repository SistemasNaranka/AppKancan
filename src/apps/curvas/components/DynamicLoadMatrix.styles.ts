import { SxProps, Theme } from "@mui/material";

export const tableContainerStyles: SxProps<Theme> = {
  maxHeight: 500,
  borderRadius: 3,
  border: "1px solid #e2e8f0",
  "&::-webkit-scrollbar": { width: 8, height: 8 },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: 4 },
};

export const headerCellStyles: SxProps<Theme> = {
  backgroundColor: "#f8fafc",
  color: "#64748b",
  fontWeight: 900,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid #e2e8f0",
  whiteSpace: "nowrap",
};

export const stickyColumnStyles: SxProps<Theme> = {
  position: "sticky",
  left: 0,
  backgroundColor: "#f8fafc",
  zIndex: 10,
  borderRight: "2px solid #e2e8f0",
};

export const inputStyles: SxProps<Theme> = {
  "& .MuiInputBase-input": {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "0.9rem",
    py: 1,
  },
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "2px solid #4f46e5",
    borderRadius: 2,
  },
};