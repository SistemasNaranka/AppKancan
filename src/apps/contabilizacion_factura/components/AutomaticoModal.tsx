import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    CircularProgress,
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";

interface AutomaticoModalProps {
    open: boolean;
    nit: string | null;
    proveedorNombre?: string;
    numeroFactura?: string;
    onClose: () => void;
    onConfirm: (automatico: string) => Promise<void>;
}

export function AutomaticoModal({
    open,
    nit,
    proveedorNombre,
    numeroFactura,
    onClose,
    onConfirm,
}: AutomaticoModalProps) {
    const [automaticoStr, setAutomaticoStr] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorStr, setErrorStr] = useState("");

    const handleConfirm = async () => {
        if (!automaticoStr.trim()) {
            setErrorStr("Debes ingresar un número automático");
            return;
        }

        setLoading(true);
        setErrorStr("");
        try {
            await onConfirm(automaticoStr.trim());
            setAutomaticoStr(""); // Reset
        } catch (err) {
            setErrorStr("Hubo un error al guardar el registro. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                Asignar automático
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        El NIT <strong>{nit}</strong> no tiene número asignado.
                    </Typography>
                    
                    {/* Información del proveedor y factura */}
                    {(proveedorNombre || numeroFactura) && (
                        <Box 
                            sx={{ 
                                mb: 2, 
                                p: 1.5, 
                                borderRadius: 1, 
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #e0e0e0'
                            }}
                        >
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                                Información del proveedor:
                            </Typography>
                            {proveedorNombre && (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                    {proveedorNombre}
                                </Typography>
                            )}
                            {numeroFactura && (
                                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                                    Factura: <strong>{numeroFactura}</strong>
                                </Typography>
                            )}
                        </Box>
                    )}
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Asignar Automático"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={automaticoStr}
                        onChange={(e) => {
                            const valor = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setAutomaticoStr(valor);
                            if (errorStr) setErrorStr("");
                        }}
                        error={!!errorStr}
                        helperText={errorStr}
                        disabled={loading}
                        inputProps={{ maxLength: 4 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    startIcon={<Cancel />}
                    disabled={loading}
                    sx={{ color: "text.secondary" }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{
                        background: "#004680",
                        color: "#fff",
                        boxShadow: "none",
                        "&:hover": {
                            background: "#005aa3",
                            boxShadow: "none",
                        },
                    }}
                >
                    {loading ? "Guardando..." : "Guardar y Continuar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
