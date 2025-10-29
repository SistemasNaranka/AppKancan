import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { CustomButton } from "@/shared/components/button/CancelButton";
type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (identificacion: string) => void;
  cantidadTraslados: number;
};

const ConfirmacionAprobacion: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  cantidadTraslados,
}) => {
  const [identificacion, setIdentificacion] = useState(""); // solo dígitos
  const [mostrarIdentificacion, setMostrarIdentificacion] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!identificacion.trim()) {
      setError("Por favor ingrese su Contrase del UltraSystem.");
      return;
    }

    const cleanId = identificacion.replace(/[^0-9]/g, "");
    if (cleanId.length < 4) {
      setError("La Contraseña es inválida. Se requieren minimo 4 digitos");
      return;
    }

    onConfirm(cleanId); // envía solo dígitos
    handleClose();
  };

  const handleClose = () => {
    setIdentificacion("");
    setMostrarIdentificacion(false);
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={(theme) => ({
        "& .MuiDialog-paper": {
          borderRadius: 4,
          boxShadow: `0 0 2px 1px ${theme.palette.primary.main}`,
        },
      })}
    >
      <DialogTitle
        sx={(theme) => ({
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "1.3rem",
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider} `,
        })}
      >
        ¿Está seguro?
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ textAlign: "center", pt: 3 }}>
          <Typography
            variant="body1"
            color="primary"
            sx={{ mb: 1, fontSize: "1.1rem", fontWeight: "medium" }}
          >
            Se aprobarán{" "}
            <Typography
              component="span"
              color="primary"
              fontSize="1.2rem"
              fontWeight="bold"
            >
              {cantidadTraslados}
            </Typography>{" "}
            traslado{cantidadTraslados !== 1 ? "s" : ""}.
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: "1rem" }}
          >
            Digite su contraseña del <strong>ULTRA SYSTEMS</strong> para aprobar
            los traslados.
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            value={identificacion}
            onChange={(e) => {
              const valor = e.target.value.replace(/[^0-9]/g, "");
              if (valor.length <= 10) {
                setIdentificacion(valor);
              }
            }}
            type={mostrarIdentificacion ? "text" : "password"}
            error={!!error}
            placeholder="******"
            slotProps={{
              htmlInput: {
                maxLength: 10,
                style: {
                  textAlign: "center",
                  fontSize: "1.4rem",
                },
              },
              input: {
                endAdornment: (
                  <IconButton
                    onClick={() =>
                      setMostrarIdentificacion(!mostrarIdentificacion)
                    }
                    edge="end"
                    aria-label={
                      mostrarIdentificacion
                        ? "Ocultar identificación"
                        : "Mostrar identificación"
                    }
                    color="primary"
                    sx={{
                      transition: "filter 0.2s ease, transform 0.2s ease",
                      transform: mostrarIdentificacion
                        ? "scale(1.1)"
                        : "scale(1)",
                      filter: mostrarIdentificacion
                        ? "brightness(1.4)"
                        : "brightness(1)",
                    }}
                  >
                    {mostrarIdentificacion ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              },
            }}
            sx={(theme) => ({
              width: {
                xs: "100%", // Pantallas pequeñas (móviles)
                sm: "80%", // Tablets
                md: "60%", // Escritorio mediano
                lg: "50%", // Escritorio grande
              },

              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontSize: "1.4rem",
                height: 54,
                backgroundColor: theme.palette.background.paper,
                transition: "all 0.2s ease",
                "& fieldset": {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.grey[400],
                },
                "&:hover fieldset": {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                },
              },
            })}
          />
        </Box>

        {error && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={(theme) => ({
              mt: 2,
              backgroundColor: "#FCE8ED",
              color: theme.palette.error.main,
              fontWeight: "bold",
              fontSize: "0.95rem",
              borderRadius: 2,
              border: `1px solid ${theme.palette.error.main}`,
            })}
          >
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          px: 3,
          pb: 2,
          justifyContent: "space-between",
          borderTop: `1px solid  ${theme.palette.background.default} `,
          bgcolor: theme.palette.background.paper,
        })}
      >
        <CustomButton text="Cancelar" color="error" onClick={handleClose} />

        <Button
          onClick={handleConfirm}
          variant="contained"
          color="success"
          disabled={!identificacion.trim()}
          sx={{
            fontWeight: "bold",
            px: 3,
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          Aprobar traslado{cantidadTraslados !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmacionAprobacion;
