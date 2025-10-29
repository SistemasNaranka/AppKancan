import { useState, useRef } from 'react';
import { Button, Modal, Box, Typography } from '@mui/material';

// Estilos básicos para el contenido del modal
const style = {
  position: 'absolute' as 'absolute', // 'as 'absolute'' es necesario para TypeScript en objetos de estilo
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function SelectionModal() {
  // 1. Tipificación explícita de useRef
  //    El tipo es 'HTMLButtonElement' para el elemento DOM del botón,
  //    y se inicializa con 'null'.
  const botonAbreModalRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);

  // 2. Función de cierre con gestión de foco explícita
  const handleClose = () => {
    // Cerrar el modal
    setOpen(false);

    // Devolver el foco al botón que abrió el modal
    setTimeout(() => {
      // La verificación del tipo de referencia ahora es crucial
      if (botonAbreModalRef.current) {
        // TypeScript ahora sabe que botonAbreModalRef.current es un HTMLButtonElement
        // y que tiene el método .focus()
        botonAbreModalRef.current.focus();
      }
    }, 0);
  };

  return (
    <div>
      {/* El botón que abre el modal debe tener la referencia */}
      <Button
        variant="contained"
        onClick={handleOpen}
        // La propiedad 'ref' de un componente MUI Button acepta el tipo de referencia
        // que hemos definido (<HTMLButtonElement>).
        ref={botonAbreModalRef} 
      >
        Abrir Modal de Promociones
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2">
            Contenido del Modal
          </Typography>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            Aquí va la información de la promoción.
          </Typography>
          <Button onClick={handleClose} sx={{ mt: 3 }}>
            Cerrar
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default SelectionModal;
