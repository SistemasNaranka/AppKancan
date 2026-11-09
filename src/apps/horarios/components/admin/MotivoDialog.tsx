import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from '@mui/material';
import { useState } from 'react';
import type { DatosMotivo } from '../../api/directus/motivos';
import {
	type ErroresNuevoMotivo,
	MAX_NOMBRE_MOTIVO,
	type Motivo,
	validarNuevoMotivo,
} from '../../domain/horasExtras';

export interface MotivoDialogProps {
	/** Título de la lista ("solicitud" / "rechazo"). */
	lista: string;
	/** Al editar, el motivo; al crear, `null`. */
	motivo: Motivo | null;
	/** Los de la misma lista, para no repetir nombres. */
	delTipo: readonly Motivo[];
	guardando: boolean;
	onClose: () => void;
	onGuardar: (datos: DatosMotivo) => void;
}

/** Crear o editar una opción de la lista (los del sistema no llegan aquí). */
export function MotivoDialog({
	lista,
	motivo,
	delTipo,
	guardando,
	onClose,
	onGuardar,
}: MotivoDialogProps) {
	const [nombre, setNombre] = useState(motivo?.nombre ?? '');
	const [descripcion, setDescripcion] = useState(motivo?.descripcion ?? '');
	const [errores, setErrores] = useState<ErroresNuevoMotivo>({});

	const guardar = () => {
		const e = validarNuevoMotivo({ nombre, descripcion }, delTipo, motivo?.id);
		setErrores(e);
		if (Object.keys(e).length === 0) onGuardar({ nombre, descripcion });
	};

	return (
		<Dialog
			open
			onClose={guardando ? undefined : onClose}
			fullWidth
			maxWidth="xs"
			aria-labelledby="motivo-dialog-titulo"
		>
			<DialogTitle id="motivo-dialog-titulo" sx={{ fontWeight: 700 }}>
				{motivo ? 'Editar motivo' : `Nuevo motivo de ${lista}`}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					{motivo && (
						<Alert severity="info">
							Si cambias el sentido del motivo, mejor crea uno nuevo: los
							informes agrupan las horas por motivo.
						</Alert>
					)}
					<TextField
						label="Nombre"
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
						error={!!errores.nombre}
						helperText={
							errores.nombre ?? `${nombre.trim().length}/${MAX_NOMBRE_MOTIVO}`
						}
						required
						autoFocus
						fullWidth
					/>
					<TextField
						label="Descripción (opcional)"
						value={descripcion}
						onChange={(e) => setDescripcion(e.target.value)}
						error={!!errores.descripcion}
						helperText={
							errores.descripcion ?? 'Se muestra bajo la opción al elegirla'
						}
						multiline
						minRows={2}
						fullWidth
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={guardando}>
					Cancelar
				</Button>
				<Button variant="contained" onClick={guardar} disabled={guardando}>
					{motivo ? 'Guardar cambios' : 'Agregar'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
