// src/apps/reservas/components/subcomponents/ListaParticipantes.tsx
import React, { useState, useRef } from "react";
import {
  Box, Typography, TextField, Autocomplete, Button, 
  CircularProgress, Avatar, IconButton
} from "@mui/material";
import {
  Person as PersonIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { buscarUsuarios } from "../services/reservas";

interface Participante {
  name: string;
  email: string;
}

interface ListaParticipantesProps {
  fields: any[];
  append: (data: Participante) => void;
  remove: (index: number) => void;
  loading: boolean;
}

export const ListaParticipantes: React.FC<ListaParticipantesProps> = ({ fields, append, remove, loading }) => {
  const [usuariosSugeridos, setUsuariosSugeridos] = useState<any[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [tempNombre, setTempNombre] = useState("");
  const [tempCorreo, setTempCorreo] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAddParticipante = () => {
    if (tempNombre.trim() && tempCorreo.trim()) {
      if (!fields.some(f => f.email === tempCorreo)) {
        append({ name: tempNombre, email: tempCorreo });
        setTempNombre("");
        setTempCorreo("");
      }
    }
  };

  const handleBuscarUsuarios = (valor: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (valor.length < 3) {
      setUsuariosSugeridos([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setBuscandoUsuarios(true);
      const resultados = await buscarUsuarios(valor);
      setUsuariosSugeridos(resultados as any[]);
      setBuscandoUsuarios(false);
    }, 500);
  };

  return (
    <Box>
      <Box sx={{ p: 1.8, bgcolor: "#F9FAFB", borderRadius: 2, border: "1px solid #E5E7EB", mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#374151", mb: 1.2, fontSize: "0.85rem" }}>
          Añadir Participantes
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 0.5, alignItems: "flex-end" }}>
          <TextField
            placeholder="Nombre"
            variant="standard"
            size="small"
            fullWidth
            value={tempNombre}
            onChange={(e) => setTempNombre(e.target.value)}
            disabled={loading}
            sx={{ flex: 1 }}
          />
          <Autocomplete
            freeSolo
            options={usuariosSugeridos}
            getOptionLabel={(option) => typeof option === "string" ? option : option.email}
            loading={buscandoUsuarios}
            onInputChange={(_, valor) => {
              setTempCorreo(valor);
              handleBuscarUsuarios(valor);
            }}
            onChange={(_, data) => {
              if (data && typeof data !== "string") {
                setTempCorreo(data.email);
                if (!tempNombre.trim()) {
                  setTempNombre(`${data.first_name} ${data.last_name || ""}`.trim());
                }
              }
            }}
            disabled={loading}
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
                      {buscandoUsuarios ? <CircularProgress color="inherit" size={16} /> : null}
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
            onClick={handleAddParticipante}
            disabled={!tempNombre || !tempCorreo || loading}
            sx={{ minWidth: "auto", px: 3, textTransform: "none", bgcolor: "#3B82F6", borderRadius: 1.5, height: 32 }}
          >
            Agregar
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxHeight: 200, overflowY: "auto", pr: 1, "::-webkit-scrollbar": { width: "6px" } }}>
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.8, borderBottom: "1px solid #f3f4f6" }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: "#EFF6FF", color: "#3B82F6" }}>
              <PersonIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#1f2937" }} noWrap>{field.name}</Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }} noWrap>{field.email}</Typography>
            </Box>
            <IconButton size="small" onClick={() => remove(index)} disabled={loading} sx={{ color: "#9ca3af", "&:hover": { color: "#ef4444" } }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};