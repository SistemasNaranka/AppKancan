import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import {
	type EstadoHoraExtra,
	ETIQUETA_ESTADO_HORA_EXTRA,
	formatoMinutos,
} from '../../domain/horasExtras';

export interface CoincidenciaHoraExtra {
	/** Clave única de la fila (persona + día). */
	clave: string;
	empleado: string;
	cargo?: string;
	/** YYYY-MM-DD */
	fecha: string;
	yaMinutos: number;
	estado: EstadoHoraExtra;
	nuevosMinutos: number;
}

export interface AvisoHorasExistentesDialogProps {
	open: boolean;
	coincidencias: CoincidenciaHoraExtra[];
	onVolver: () => void;
	onContinuar: () => void;
}

const head = { fontWeight: 700, color: '#475569', bgcolor: '#f8fafc' };

/**
 * Paso de advertencia antes de registrar: estas personas ya tienen una hora extra
 * activa ese día. El foco empieza en "Volver y revisar" (la acción segura) y
 * Esc también vuelve; continuar no bloquea, solo confirma que se sabe.
 */
export function AvisoHorasExistentesDialog({
	open,
	coincidencias,
	onVolver,
	onContinuar,
}: AvisoHorasExistentesDialogProps) {
	const personas = new Set(coincidencias.map((c) => c.empleado)).size;
	const yaMinutos = coincidencias.reduce((s, c) => s + c.yaMinutos, 0);
	const una = personas === 1;

	return (
		<Dialog
			open={open}
			onClose={onVolver}
			fullWidth
			maxWidth="md"
			aria-labelledby="aviso-he-titulo"
			aria-describedby="aviso-he-texto"
			slotProps={{ paper: { role: 'alertdialog' } }}
		>
			<DialogTitle
				id="aviso-he-titulo"
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					fontWeight: 700,
					color: '#92400e',
				}}
			>
				<WarningAmberIcon aria-hidden sx={{ color: '#d97706' }} />
				{una
					? 'Esta persona ya tiene horas extras ese día'
					: 'Estas personas ya tienen horas extras ese día'}
			</DialogTitle>
			<DialogContent dividers>
				<Typography id="aviso-he-texto" sx={{ mb: 2 }}>
					<strong>
						{personas} {una ? 'persona ya tiene' : 'personas ya tienen'}{' '}
						{formatoMinutos(yaMinutos)}
					</strong>{' '}
					registradas en {coincidencias.length === 1 ? 'ese día' : 'esos días'}.
					Si continúas, se agrega una hora extra más{una ? '' : ' a cada una'}{' '}
					(queda pendiente de aprobación).
				</Typography>
				<TableContainer sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
					<Table size="small" aria-label="Horas extras ya registradas">
						<TableHead>
							<TableRow>
								{['Persona', 'Cargo', 'Día', 'Ya registrado', 'Nueva'].map(
									(c) => (
										<TableCell key={c} sx={head}>
											{c}
										</TableCell>
									),
								)}
							</TableRow>
						</TableHead>
						<TableBody>
							{coincidencias.map((c) => (
								<TableRow key={c.clave}>
									<TableCell sx={{ fontWeight: 600 }}>{c.empleado}</TableCell>
									<TableCell>{c.cargo || 'Sin cargo'}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										{dayjs(c.fecha).format('DD/MM/YYYY')}
									</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										{formatoMinutos(c.yaMinutos)}{' '}
										<Box component="span" sx={{ color: '#64748b' }}>
											({ETIQUETA_ESTADO_HORA_EXTRA[c.estado].toLowerCase()})
										</Box>
									</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
										+ {formatoMinutos(c.nuevosMinutos)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
				<Button onClick={onVolver} autoFocus>
					Volver y revisar
				</Button>
				<Button variant="contained" color="warning" onClick={onContinuar}>
					Sí, continuar
				</Button>
			</DialogActions>
		</Dialog>
	);
}
