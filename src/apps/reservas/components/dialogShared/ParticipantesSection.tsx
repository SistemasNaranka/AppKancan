// Sección de añadir/listar participantes (input nombre + autocomplete correo + lista con avatar).

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Avatar,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

interface Participante {
  name: string;
  email: string;
}

interface ParticipantesSectionProps {
  titulo: string;
  fields: ({ id: string } & Participante)[];
  onRemove: (index: number) => void;
  onAdd: () => void;
  tempNombre: string;
  tempCorreo: string;
  setTempNombre: (v: string) => void;
  setTempCorreo: (v: string) => void;
  usuariosSugeridos: any[];
  buscandoUsuarios: boolean;
  onBuscarUsuarios: (valor: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const ParticipantesSection: React.FC<ParticipantesSectionProps> = ({
  titulo,
  fields,
  onRemove,
  onAdd,
  tempNombre,
  tempCorreo,
  setTempNombre,
  setTempCorreo,
  usuariosSugeridos,
  buscandoUsuarios,
  onBuscarUsuarios,
  containerRef,
}) => {
  return (
    <Box ref={containerRef}>
      <Box
        sx={{
          p: 1.8,
          bgcolor: "#F9FAFB",
          borderRadius: 2,
          border: "1px solid #E5E7EB",
          mb: 1.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "#374151", mb: 1.2, fontSize: "0.85rem" }}
        >
          {titulo}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 0.5, alignItems: "flex-end" }}>
          <TextField
            placeholder="Nombre"
            variant="standard"
            size="small"
            fullWidth
            value={tempNombre}
            onChange={(e) => setTempNombre(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Autocomplete
            freeSolo
            options={usuariosSugeridos}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.email
            }
            loading={buscandoUsuarios}
            onInputChange={(_, valor) => {
              setTempCorreo(valor);
              onBuscarUsuarios(valor);
            }}
            onChange={(_, data) => {
              if (data && typeof data !== "string") {
                setTempCorreo(data.email);
                setTempNombre(`${data.first_name} ${data.last_name || ""}`.trim());
              } else if (typeof data === "string") {
                setTempCorreo(data);
              } else if (data === null) {
                setTempCorreo("");
                setTempNombre("");
              }
            }}
            value={tempCorreo}
            sx={{ flex: 2 }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Correo"
                variant="standard"
                size="small"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {buscandoUsuarios ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
          <Button
            variant="contained"
            size="small"
            onClick={onAdd}
            disabled={!tempNombre || !tempCorreo}
            sx={{
              minWidth: "auto",
              px: 3,
              textTransform: "none",
              bgcolor: "#3B82F6",
              "&:hover": { bgcolor: "#2563EB" },
              boxShadow: "none",
              borderRadius: 1.5,
              height: 32,
            }}
          >
            Agregar
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          maxHeight: 200,
          overflowY: "auto",
          pr: 1,
          "::-webkit-scrollbar": { width: "6px" },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: "#e5e7eb",
            borderRadius: "10px",
          },
        }}
      >
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 0.8,
              borderBottom: "1px solid #f3f4f6",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: "#EFF6FF",
                color: "#3B82F6",
              }}
            >
              <PersonIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  fontSize: "0.85rem",
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {field.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", fontSize: "0.75rem", display: "block" }}
                noWrap
              >
                {field.email}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => onRemove(index)}
              sx={{ color: "#9ca3af", p: 0.5, "&:hover": { color: "#ef4444" } }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ))}
        {fields.length === 0 && (
          <Box
            sx={{
              py: 3,
              textAlign: "center",
              bgcolor: "#f9fafb",
              borderRadius: 2,
              border: "1px dashed #d1d5db",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.8rem" }}
            >
              No hay invitados en la lista
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
