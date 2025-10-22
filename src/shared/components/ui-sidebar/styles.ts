import { useTheme } from "@mui/material/styles";

/**
 * Estilos generales para cada ítem del sidebar
 */
export const getItemStyles = (selected: boolean, open: boolean, level = 0) => {
  const theme = useTheme();

  return {
    borderRadius: 2,
    mx: 1,
    my: 0.5,
    pl: open ? 2 + level * 2 : 0,
    justifyContent: open ? "flex-start" : "center",
    transition: "all 0.3s ease-in-out",
    color: selected ? theme.palette.primary.main : theme.palette.text.primary,
    backgroundColor: selected ? `${theme.palette.primary.main}22` : "transparent",
    "& .MuiListItemIcon-root": {
      minWidth: 0,
      mr: open ? 1 : 0,
      display: "flex",
      justifyContent: "center",
      color: selected ? theme.palette.primary.main : theme.palette.text.primary,
      width: open ? "auto" : "100%",
    },
    "& .MuiListItemText-root": {
      display: open ? "block" : "none",
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
        color: theme.palette.primary.main,
      },
    },
  };
};

