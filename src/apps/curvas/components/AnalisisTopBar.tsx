import { Stack, FormControl, InputLabel, Select, MenuItem, Box, Tooltip, Button, Badge, TextField, InputAdornment, IconButton, Typography } from "@mui/material";
import { Refresh as RefreshIcon, Download as DownloadIcon, Store as StoreIcon, Close as CloseIcon, LibraryBooks as LibraryBooksIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import { StatPill } from "./StatPill";

export const AnalisisTopBar = ({ data, exportFn }: any) => {
  const { matrixData, fecha, setFecha, setSelectedRef, fechasConDatos, selectedRef, uniqueReferences, setShowRefModal, filtroTienda, setFiltroTienda, filtroUsuario, setFiltroUsuario, uniqueUsuarios, fetchLogsByDate, loading } = data;

  return (
    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ overflow: "hidden" }}>
      {matrixData && (
        <Stack direction="row" spacing={0.8} sx={{ display: { xs: "none", lg: "flex" }, mr: 1 }}>
          <StatPill value={matrixData.tiendasUnicas} label="Tiendas" />
          <StatPill value={matrixData.usuariosUnicos} label="Usuarios" />
          <StatPill value={matrixData.grandTotal} label="Total Uds" />
        </Stack>
      )}

      <FormControl className="tour-curvas-analisis-rango" size="small" sx={{ minWidth: { xs: 120, sm: 140, md: 150 } }}>
        <InputLabel sx={{ color: "#b8dcff", fontWeight: 600, fontSize: "0.7rem", bgcolor: "transparent", px: 0.5, "&.Mui-focused": { color: "#99ccff" } }}>Fecha</InputLabel>
        <Select
          value={fecha?.format("YYYY-MM-DD") || ""}
          onChange={(e) => { setFecha(e.target.value ? dayjs(e.target.value) : null); setSelectedRef(null); }}
          sx={{ bgcolor: "#0052a3", borderRadius: 2, boxShadow: "0 2px 6px rgba(0,0,0,0.25)", color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, height: 36, "& fieldset": { borderColor: "#4da6ff", borderWidth: "2px" } }}
        >
          {Object.keys(fechasConDatos).length > 0 ? Object.keys(fechasConDatos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((f) => (
            <MenuItem key={f} value={f}>{dayjs(f).format("DD MMM YYYY")}</MenuItem>
          )) : <MenuItem value="" disabled>Sin fechas disponibles</MenuItem>}
        </Select>
      </FormControl>

      <Tooltip title="Ver todo el historial acumulado">
        <Button
          variant={selectedRef === "ALL_HISTORICAL" ? "contained" : "outlined"}
          size="small"
          onClick={() => { selectedRef === "ALL_HISTORICAL" ? setSelectedRef(null) : setSelectedRef("ALL_HISTORICAL"); }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, fontSize: "0.78rem", height: 36, px: 2, flexShrink: 0, bgcolor: selectedRef === "ALL_HISTORICAL" ? "#f59e0b" : "transparent", border: "2px solid", borderColor: selectedRef === "ALL_HISTORICAL" ? "#d97706" : "#f59e0b", color: selectedRef === "ALL_HISTORICAL" ? "#ffffff" : "#f59e0b" }}
        >
          {selectedRef === "ALL_HISTORICAL" ? "Histórico Global" : "Históricos"}
        </Button>
      </Tooltip>

      <Tooltip title="Ver y cambiar referencia">
        <Badge badgeContent={uniqueReferences.length} color="info" sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 18, minWidth: 18, bgcolor: "#f59e0b", color: "white", top: 8, right: 6, border: "2px solid #006ACC" } }}>
          <Button variant="contained" size="small" startIcon={<LibraryBooksIcon sx={{ fontSize: 15 }} />} onClick={() => setShowRefModal(true)} disabled={uniqueReferences.length === 0} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.78rem", height: 36, px: 2, flexShrink: 0, bgcolor: "#0052a3", border: "2px solid #4da6ff", color: "#ffffff" }}>
            <Box component="span" sx={{ maxWidth: { xs: 60, sm: 100, md: 130 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedRef === "ALL_HISTORICAL" ? "Histórico Global" : (selectedRef ?? "Referencia")}
            </Box>
          </Button>
        </Badge>
      </Tooltip>

      <TextField size="small" placeholder="Tienda…" value={filtroTienda} onChange={(e) => setFiltroTienda(e.target.value)} sx={{ width: { xs: 0, md: 130 }, flexShrink: 0, display: { xs: "none", md: "flex" }, bgcolor: "#0052a3", borderRadius: 2, "& .MuiOutlinedInput-root": { color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, height: 36, bgcolor: "transparent", "& fieldset": { borderColor: "#4da6ff", borderWidth: "2px" } } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><StoreIcon sx={{ fontSize: 16, color: "#b8dcff" }} /></InputAdornment>,
          endAdornment: filtroTienda ? <InputAdornment position="end"><IconButton size="small" onClick={() => setFiltroTienda("")} sx={{ color: "#b8dcff", p: 0.2 }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment> : null,
        }}
      />

      <TextField select size="small" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} sx={{ width: { xs: 0, md: 150 }, flexShrink: 0, display: { xs: "none", md: "flex" }, bgcolor: "#0052a3", borderRadius: 2, "& .MuiOutlinedInput-root": { color: "#ffffff", fontSize: "0.78rem", fontWeight: 700, height: 36, bgcolor: "transparent", "& fieldset": { borderColor: "#4da6ff", borderWidth: "2px" } }, "& .MuiInputLabel-root": { color: "#b8dcff", fontSize: "0.7rem", fontWeight: 600, top: -2 } }}
        slotProps={{
          select: { displayEmpty: true, renderValue: (selected: any) => { if (!selected) return <Typography sx={{ fontSize: "0.78rem", color: "#b8dcff", fontWeight: 600 }}>Usuario…</Typography>; const u = uniqueUsuarios.find((u: any) => u.id === selected); return u?.nombreCompleto || selected; } }
        }}
      >
        <MenuItem value="" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Todos los usuarios</MenuItem>
        {uniqueUsuarios.map((u: any) => <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{u.nombreCompleto}</MenuItem>)}
      </TextField>

      <Tooltip title="Actualizar">
        <IconButton size="small" onClick={fetchLogsByDate} disabled={loading} sx={{ color: "#ffffff", flexShrink: 0, bgcolor: "#0052a3", border: "2px solid #4da6ff", width: 36, height: 36, animation: loading ? "spin 1s linear infinite" : "none" }}>
          <RefreshIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={!selectedRef ? "Selecciona una referencia" : "Descargar análisis en Excel (.xlsx)"}>
        <span>
          <Button variant="contained" size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={exportFn} disabled={!selectedRef || !matrixData} sx={{ flexShrink: 0, borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.78rem", height: 36, bgcolor: "#0052a3", border: "2px solid #4da6ff", color: "#ffffff", px: { xs: 1, sm: 2 } }}>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Exportar</Box>
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
};