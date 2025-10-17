import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#004680",
      light: "#117888",
      contrastText: "#FFFFFF",
      dark: "#002747"
    },
    secondary: {
      main: "#117888",
      light: "#48A9A6",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#88112F",
      light: "#B7324B",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#E6A700",
      light: "#FFD54F",
      contrastText: "#333333",
    },
    success: {
      main: "#3B8E4D",
      light: "#6FBF73",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#E6E6E6",
      paper: "#ffffff",
	  
    },
    text: {
      primary: "#333333",
      secondary: "#000000",
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', sans-serif",
  },
});

export default theme;
