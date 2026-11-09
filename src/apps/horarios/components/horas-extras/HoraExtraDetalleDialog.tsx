import CloseIcon from '@mui/icons-material/Close';
import {
	Box,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import {
	ESTADO_HORA_EXTRA,
	formatoMinutos,
	SIN_MOTIVO,
} from '../../domain/horasExtras';
import type { HoraExtraFila } from '../../interfaces/horasExtras';
import { HoraExtraEstadoChip } from './HoraExtraEstadoChip';

const fecha = (f: string) => dayjs(f).format('DD/MM/YYYY');
const fechaHora = (f: string) => (f ? dayjs(f).format('DD/MM/YYYY HH:mm') : '');

function Dato({
	label,
	children,
	nota,
	ancho = false,
}: {
	label: string;
	children: ReactNode;
	nota?: string;
	ancho?: boolean;
}) {
	return (
		<Box sx={{ minWidth: 0, gridColumn: ancho ? '1 / -1' : undefined }}>
			<Typography variant="caption" sx={{ color: '#64748b' }}>
				{label}
			</Typography>
			<Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
				{children || '--'}
			</Typography>
			{nota && (
				<Typography
					variant="caption"
					component="div"
					sx={{ color: '#64748b', whiteSpace: 'pre-wrap' }}
				>
					{nota}
				</Typography>
			)}
		</Box>
	);
}

const grilla = {
	display: 'grid',
	gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' },
	columnGap: 2,
	rowGap: 1.5,
};
const seccion = {
	fontWeight: 700,
	color: '#004680',
	mt: 2,
	mb: 1,
	pt: 1.5,
	borderTop: '1px solid #e2e8f0',
};

export interface HoraExtraDetalleDialogProps {
	/** `null` = cerrado. */
	fila: HoraExtraFila | null;
	onClose: () => void;
}

export function HoraExtraDetalleDialog({
	fila,
	onClose,
}: HoraExtraDetalleDialogProps) {
	if (!fila) return null;
	const rechazada = fila.estado === ESTADO_HORA_EXTRA.descartadaComercial;
	const periodo = fila.periodo
		? [
				fila.periodo.nombre,
				fila.periodo.inicio && fila.periodo.fin
					? `${fecha(fila.periodo.inicio)} – ${fecha(fila.periodo.fin)}`
					: '',
			]
				.filter(Boolean)
				.join(' · ') || `Periodo ${fila.periodo.id}`
		: '';
	return (
		<Dialog
			open
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			aria-labelledby="he-detalle-titulo"
		>
			<DialogTitle
				id="he-detalle-titulo"
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					fontWeight: 700,
					color: '#004680',
					pr: 6,
				}}
			>
				Detalle de hora extra
				<HoraExtraEstadoChip estado={fila.estado} />
				<IconButton
					aria-label="Cerrar"
					onClick={onClose}
					sx={{ position: 'absolute', right: 12, top: 12 }}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers sx={{ pt: 2 }}>
				<Typography
					variant="subtitle2"
					sx={{ ...seccion, mt: 0, pt: 0, borderTop: 0 }}
				>
					Persona
				</Typography>
				<Box sx={grilla}>
					<Dato label="Nombre">{fila.empleado}</Dato>
					<Dato label="Cédula">{fila.documento}</Dato>
					<Dato label="Cargo">{fila.cargo || 'Sin cargo'}</Dato>
				</Box>

				<Typography variant="subtitle2" sx={seccion}>
					Hora extra
				</Typography>
				<Box sx={grilla}>
					<Dato label="Fecha trabajada">{fecha(fila.fecha)}</Dato>
					<Dato label="Horas extras">{formatoMinutos(fila.minutos)}</Dato>
					<Dato
						label="Tienda donde trabajó"
						nota={fila.rotacion ? 'Rotación: no es su tienda' : undefined}
					>
						{fila.tienda}
					</Dato>
					<Dato label="Motivo" nota={fila.observacion || undefined} ancho>
						<Box
							component="span"
							sx={{ color: fila.motivo ? 'inherit' : '#94a3b8' }}
						>
							{fila.motivo || SIN_MOTIVO}
						</Box>
					</Dato>
					{periodo && (
						<Dato label="Periodo de nómina" ancho>
							{periodo}
						</Dato>
					)}
				</Box>

				<Typography variant="subtitle2" sx={seccion}>
					Trazabilidad
				</Typography>
				<Box sx={{ ...grilla, gridTemplateColumns: '1fr 1fr' }}>
					<Dato label="Creada por" nota={fechaHora(fila.creadaEl)}>
						{fila.creadaPor}
					</Dato>
					<Dato
						label={rechazada ? 'Rechazada por' : 'Revisada por'}
						nota={fechaHora(fila.revisadaEl)}
					>
						{fila.revisadaPor}
					</Dato>
					{rechazada && (
						// Las horas anteriores a los motivos solo tienen el texto libre.
						<Dato label="Motivo del rechazo" ancho>
							{[fila.motivoRevision, fila.motivoRechazo]
								.filter(Boolean)
								.join(': ')}
						</Dato>
					)}
				</Box>
			</DialogContent>
		</Dialog>
	);
}
