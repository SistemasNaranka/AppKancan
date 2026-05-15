import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    nombre: string;
}

export default function ConfirmarDialog({ open, onClose, onConfirm, nombre}: Props){
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
                <Typography>
                    ¿Estas segurdo de que quieres borrar a <strong>{nombre}</strong>?
                </Typography>
            </DialogContent>
            <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button onClick={onConfirm}color="error" variant="contained">
                Borrar
            </Button>
            </DialogActions>
        </Dialog>
    );
}