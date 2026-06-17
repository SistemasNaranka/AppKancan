// TextField estilizado que oculta las flechas nativas del input numérico.

import { styled, TextField } from "@mui/material";

export const StyledNumberField = styled(TextField)({
  "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
});
