import { Dialog, DialogContent, DialogTitle, DialogActions, IconButton, Typography, Box, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Contactos } from '../types/contact';
import { DeleteIcon, EditIcon } from "lucide-react";
import { useState } from "react";
import ConfirmarDialog from "./ConfirmarDialog";

interface Props {
    open: boolean;
    onClose: () => void;
    contacto: Contactos | null;
}

export default function DetalleModal ({open, onClose, contacto}: Props) {
    if (!contacto) return null;
    const [confirmarAbierto, setConfirmarAbierto] = useState(false);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Detalle del Contacto
                <IconButton onClick={onClose} sx={{position: "obsolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    <Typography><strong>Nombre:</strong> {contacto.full_name}</Typography>
                    <Typography><strong>Correo:</strong> {contacto.email}</Typography>
                    <Typography><strong>Teléfono:</strong>{contacto.phone_number}</Typography>
                    <Typography><strong>Departamento:</strong>{contacto.department}</Typography>
                    <Typography><strong>Visibilidad:</strong>{contacto.visibility_type}</Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmarAbierto(true)}>
                Borrar
                </Button>
                <Button variant="contained" startIcon={<EditIcon />}>
                Editar
                </Button>
            </DialogActions>

            <ConfirmarDialog
            open={confirmarAbierto}
            onClose={() => setConfirmarAbierto(false)}
            onConfirm={() => {
                setConfirmarAbierto(false);
                onClose();
            }}
            nombre={contacto.full_name} 
            />
        </Dialog>
    );
}


