import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import {
	type ErroresMotivo,
	formatoMinutos,
	TIPO_MOTIVO,
	textoDelMotivo,
	validarMotivo,
} from '../../domain/horasExtras';
import { MAX_CARACTERES_OBSERVACION } from '../../domain/registro';
import { useMotivos } from '../../hooks/useMotivos';
import type { HoraExtraFila } from '../../interfaces/horasExtras';

export type DecisionRevision = 'aprobada' | 'descartada_comercial';

export interface RevisionHoraExtraDialogProps {
	/** `null` = cerrado. */
	decision: DecisionRevision | null;
	filas: HoraExtraFila[];
	guardando: boolean;
	onClose: () => void;
	onConfirmar: (r: { motivoId: number | null; nota: string }) => void;
}

export function RevisionHoraExtraDialog({
	decision,
	filas,
	guardando,
	onClose,
	onConfirmar,
}: RevisionHoraExtraDialogProps) {
	const [motivoId, setMotivoId] = useState<number | ''>('');
	const [nota, setNota] = useState('');
	const [errores, setErrores] = useState<ErroresMotivo>({});
	const rechazar = decision === 'descartada_comercial';
	const motivos = useMotivos(TIPO_MOTIVO.rechazo, rechazar);
	const motivo = motivoId === '' ? undefined : motivos.porId.get(motivoId);
	const total = filas.reduce((s, f) => s + f.minutos, 0);
	const quien =
		filas.length === 1
			? `${filas[0].empleado} (${filas[0].cargo || 'Sin cargo'}) · ${formatoMinutos(filas[0].minutos)}`
			: `${filas.length} registros vinculados · ${formatoMinutos(total)} en total`;

	const confirmar = () => {
		if (!rechazar) {
			onConfirmar({ motivoId: null, nota: '' });
			return;
		}
		const e = validarMotivo(motivo, nota);
		setErrores(e);
		if (Object.keys(e).length > 0) return;
		onConfirmar({
			motivoId: Number(motivoId),
			nota: textoDelMotivo(motivo, nota),
		});
	};

	return (
		<Dialog
			open={decision != null}
			onClose={guardando ? undefined : onClose}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle
				sx={{ fontWeight: 700, color: rechazar ? '#991b1b' : '#065f46' }}
			>
				{rechazar ? 'Rechazar horas extras' : 'Aprobar horas extras'}
				<Typography variant="body2" sx={{ color: '#64748b' }}>
					{quien}
				</Typography>
			</DialogTitle>
			<DialogContent dividers>
				{rechazar ? (
					<Stack spacing={2} sx={{ pt: 1 }}>
						<FormControl fullWidth required error={!!errores.motivo}>
							<InputLabel id="rev-motivo">Motivo del rechazo</InputLabel>
							<Select
								labelId="rev-motivo"
								label="Motivo del rechazo"
								value={motivoId}
								autoFocus
								onChange={(e) => {
									setMotivoId(Number(e.target.value) || '');
									setErrores({});
								}}
							>
								{motivos.opciones.map((m) => (
									<MenuItem key={m.id} value={m.id}>
										{m.nombre}
									</MenuItem>
								))}
							</Select>
							<FormHelperText>
								{errores.motivo ??
									(motivos.error
										? 'No se pudieron cargar los motivos'
										: motivo?.descripcion || 'Por qué no se aprueba')}
							</FormHelperText>
						</FormControl>
						{motivo?.pideTexto && (
							<TextField
								label="Escribe el motivo"
								required
								value={nota}
								onChange={(e) => {
									setNota(e.target.value);
									setErrores({});
								}}
								multiline
								minRows={3}
								fullWidth
								error={!!errores.texto}
								helperText={
									errores.texto ??
									`${nota.length}/${MAX_CARACTERES_OBSERVACION}`
								}
								slotProps={{
									htmlInput: { maxLength: MAX_CARACTERES_OBSERVACION },
								}}
							/>
						)}
					</Stack>
				) : (
					<Alert severity="info">
						Al aprobar, las horas extras quedan en estado <b>Aprobada</b> y ya
						no se pueden modificar.
					</Alert>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={guardando}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					color={rechazar ? 'error' : 'success'}
					onClick={confirmar}
					disabled={guardando}
					startIcon={guardando ? <CircularProgress size={16} /> : undefined}
				>
					{rechazar ? 'Rechazar' : 'Aprobar'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
