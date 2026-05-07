import { Box, Typography, Stack, Button, TextField, Divider, Chip } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircle from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import dayjs, { type Dayjs } from "dayjs";
import { DebouncedSearchInput } from "./EnviosPage.components";

interface EnviosPageHeaderProps {
  filtroFecha: Dayjs | null;
  setFiltroFecha: (date: Dayjs | null) => void;
  fechasConDatos: Record<string, "pendiente" | "enviado">;
  filtroReferencia: string;
  setFiltroReferencia: (val: string) => void;
  validationStats: { matched: number; total: number; percent: number };
  isEverythingValid: boolean;
  isSending: boolean;
  isSaving: boolean;
  handleEnviarADespacho: (type: "save" | "send") => void;
}

export const EnviosPageHeader = ({
  filtroFecha, setFiltroFecha, fechasConDatos, filtroReferencia, setFiltroReferencia,
  validationStats, isEverythingValid, isSending, isSaving, handleEnviarADespacho
}: EnviosPageHeaderProps) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ py: 0.5, justifyContent: "flex-end", width: "100%", gap: 1.5 }}>
      <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 0.75 }}>
        <LocalShippingIcon sx={{ fontSize: 18, color: "white" }} />
        <Typography sx={{ fontWeight: 900, fontSize: "0.75rem", color: "white", textTransform: "uppercase" }}>
          DESPACHO
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ height: 16, bgcolor: "rgba(255,255,255,0.25)" }} />
      <TextField
        select
        value={filtroFecha?.format("YYYY-MM-DD") || ""}
        onChange={(e) => setFiltroFecha(e.target.value ? dayjs(e.target.value) : null)}
        size="small"
        slotProps={{
          select: { native: true },
          input: { sx: { color: "white", fontSize: "0.85rem", fontWeight: 700, height: 16 } },
        }}
        sx={{ width: 170, "& .MuiOutlinedInput-root": { height: 40, color: "white", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 1.5 } }}
      >
        {Object.keys(fechasConDatos).sort((a, b) => b.localeCompare(a)).map((fecha) => (
          <option key={fecha} value={fecha} style={{ backgroundColor: "#ffffff", color: "#1e293b" }}>
            {fecha ? dayjs(fecha).format("DD MMM YYYY") : "Seleccionar"}
          </option>
        ))}
      </TextField>
      <DebouncedSearchInput
        value={filtroReferencia}
        onChange={setFiltroReferencia}
        placeholder="Buscar..."
        sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { color: "white", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 1.5 } }}
      />
      <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 0.75 }}>
        <Chip
          label={`${validationStats.matched}/${validationStats.total} (${validationStats.percent}%)`}
          color={validationStats.percent === 100 ? "success" : "warning"}
          size="small"
          icon={<CheckCircle sx={{ fontSize: "14px !important" }} />}
          sx={{ fontWeight: 700 }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          disabled={isSending || isSaving}
          startIcon={<SaveIcon />}
          onClick={() => handleEnviarADespacho("save")}
          sx={{ fontWeight: 700, px: 2.5, borderRadius: 2, height: 40, bgcolor: "#64748b", "&:hover": { bgcolor: "#475569" } }}
        >
          {isSaving ? "GUARDANDO..." : "GUARDAR"}
        </Button>
        <Button
          variant="contained"
          disabled={!isEverythingValid || isSending || isSaving}
          startIcon={<SendIcon />}
          onClick={() => handleEnviarADespacho("send")}
          sx={{ fontWeight: 800, px: 2.5, borderRadius: 2, height: 40, bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
        >
          {isSending ? "ENVIANDO..." : "ENVIAR"}
        </Button>
      </Box>
    </Stack>
  );
};