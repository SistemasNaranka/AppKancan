import React from "react";
import { Box, Typography, TextField, MenuItem, Button, InputAdornment, alpha } from "@mui/material";
import { PersonAdd, Badge, Search } from "@mui/icons-material";

export const AddEmployeeForm = ({
  cargoSeleccionado, setCargoSeleccionado, cargos,
  codigoEmpleado, setCodigoEmpleado, handleKeyPress,
  empleadoEncontrado, handleAgregarEmpleado,
  tiendaSeleccionada, fecha
}) => (
  <Box sx={{ p: 3, mb: 4, bgcolor: "white", borderRadius: 3, border: "1px solid", borderColor: "grey.200", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
      <PersonAdd sx={{ color: "primary.main" }} />
      <Typography variant="subtitle1" fontWeight="700">Agregar Personal</Typography>
    </Box>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 2 }}>
      <TextField
        select label="Cargo" size="small" fullWidth
        value={cargoSeleccionado}
        onChange={(e) => setCargoSeleccionado(e.target.value)}
      >
        {cargos.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
      </TextField>

      <TextField
        label="Código de Empleado" size="small" fullWidth
        placeholder="Presiona Enter para buscar"
        value={codigoEmpleado}
        onChange={(e) => setCodigoEmpleado(e.target.value)}
        onKeyPress={handleKeyPress}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Badge sx={{ fontSize: 20, color: "action.active" }} /></InputAdornment>,
        }}
      />

      <Button
        variant="contained"
        onClick={handleAgregarEmpleado}
        disabled={!empleadoEncontrado || !tiendaSeleccionada || !fecha}
        sx={{ px: 4, fontWeight: "bold", textTransform: "none", borderRadius: 2 }}
      >
        Añadir
      </Button>
    </Box>

    {empleadoEncontrado && (
      <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha("#2e7d32", 0.05), borderRadius: 2, border: "1px solid", borderColor: alpha("#2e7d32", 0.2), display: "flex", alignItems: "center", gap: 2 }}>
        <Search sx={{ color: "success.main", fontSize: 20 }} />
        <Typography variant="body2" fontWeight="600">
          Encontrado: <Box component="span" sx={{ color: "text.secondary" }}>{empleadoEncontrado.nombre}</Box>
        </Typography>
      </Box>
    )}
  </Box>
);