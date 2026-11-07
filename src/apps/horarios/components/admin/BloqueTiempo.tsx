import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Skeleton,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
	guardarBloqueHorasExtras,
	leerConfigBloqueAdmin,
	minutosPendientes,
} from '../../api/directus/configHorasExtras';
import {
	BLOQUE_MINUTOS,
	BLOQUES_PERMITIDOS,
	esBloquePermitido,
	fueraDeBloque,
	textoBloque,
} from '../../domain/horasExtras';
import { horariosKeys } from '../../hooks/registro/keys';
import { useAvisos } from '../../hooks/useAvisos';
import { usePeriodosGerencia } from '../../hooks/useReporteGerencia';
import { mensajeDeError } from '../../utils/errores';
import { getRealColombiaTime } from '../../utils/timeSync';

const GRIS = '#64748b';
const corta = (f: string) => dayjs(f).format('DD/MM/YYYY');

/** Lo que se avisa antes de cambiar el bloque, con datos reales. */
function Implicaciones({ nuevo }: { nuevo: number }) {
	const hoy = getRealColombiaTime().format('YYYY-MM-DD');
	const pendientesQ = useQuery({
		queryKey: [...horariosKeys.horasExtras.todos, 'minutosPendientes'],
		queryFn: minutosPendientes,
	});
	const periodosQ = usePeriodosGerencia();
	const periodos = periodosQ.data ?? [];
	const enCurso = periodos.find(
		(p) => p.start_date <= hoy && hoy <= p.end_date,
	);
	const noCuadran = pendientesQ.data
		? fueraDeBloque(pendientesQ.data, nuevo)
		: 0;

	return (
		<Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 1 } }}>
			<li>
				Desde ahora, las horas extras nuevas se registran en bloques de{' '}
				<strong>{textoBloque(nuevo)}</strong>. Las ya registradas no cambian.
			</li>
			{pendientesQ.isLoading ? (
				<li>Revisando las horas pendientes…</li>
			) : pendientesQ.isError ? (
				<li>No se pudieron revisar las horas pendientes.</li>
			) : (
				noCuadran > 0 && (
					<li>
						Hay <strong>{noCuadran} horas pendientes</strong> que no son
						múltiplo de {nuevo} min. Comercial las puede aprobar igual.
					</li>
				)
			)}
			{periodosQ.isError && (
				<li>No se pudo revisar si hay un periodo en curso.</li>
			)}
			{enCurso && (
				<li>
					El periodo <strong>{enCurso.name || 'actual'}</strong> está en curso
					(del {corta(enCurso.start_date)} al {corta(enCurso.end_date)}). Se
					recomienda cambiar el bloque al iniciar un periodo.
				</li>
			)}
			<li>
				Confirma con nómina que el pago acepta fracciones de {nuevo / 60} h.
			</li>
		</Box>
	);
}

/** Admin → Horas extras → Bloque de tiempo: en qué bloque se registran las horas extras. */
export function BloqueTiempo() {
	const qc = useQueryClient();
	const { showSnackbar } = useAvisos();
	const configQ = useQuery({
		queryKey: [...horariosKeys.configHorasExtras, 'admin'],
		queryFn: leerConfigBloqueAdmin,
	});
	const actual = esBloquePermitido(configQ.data?.bloque)
		? configQ.data.bloque
		: BLOQUE_MINUTOS;
	const [elegido, setElegido] = useState<number | null>(null);
	const valor = elegido ?? actual;
	const [confirmando, setConfirmando] = useState(false);

	const guardar = useMutation({
		mutationFn: () => guardarBloqueHorasExtras(valor),
		onSuccess: () => {
			// El registro lee la misma clave: ve el bloque nuevo sin recargar.
			void qc.invalidateQueries({ queryKey: horariosKeys.configHorasExtras });
			setConfirmando(false);
			setElegido(null);
			showSnackbar(`Bloque cambiado a ${textoBloque(valor)}`, 'success');
		},
		onError: (err) =>
			showSnackbar(
				mensajeDeError(err, 'No se pudo guardar el bloque de horas extras'),
				'error',
			),
	});

	if (configQ.isLoading) return <Skeleton variant="rounded" height={180} />;

	const cambio = configQ.data;
	return (
		<Box sx={{ maxWidth: 560 }}>
			{configQ.isError && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{mensajeDeError(
						configQ.error,
						'No se pudo cargar el bloque de horas extras',
					)}
				</Alert>
			)}
			<FormControl>
				<FormLabel id="bloque-label" sx={{ fontWeight: 600, color: '#1e293b' }}>
					Las horas extras se registran en bloques de:
				</FormLabel>
				<RadioGroup
					row
					aria-labelledby="bloque-label"
					value={valor}
					onChange={(e) => setElegido(Number(e.target.value))}
				>
					{BLOQUES_PERMITIDOS.map((b) => (
						<FormControlLabel
							key={b}
							value={b}
							control={<Radio />}
							label={
								<Box sx={{ lineHeight: 1.2 }}>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{b} min
									</Typography>
									<Typography variant="caption" sx={{ color: GRIS }}>
										{b / 60} h
									</Typography>
								</Box>
							}
							sx={{ mr: 3, mt: 1 }}
						/>
					))}
				</RadioGroup>
			</FormControl>
			<Typography variant="body2" sx={{ color: GRIS, mt: 1.5 }}>
				Solo aplica al registrar horas extras nuevas (individual y masivo).
			</Typography>
			{cambio?.cambiadoEl && (
				<Typography variant="body2" sx={{ color: GRIS, mt: 0.5 }}>
					Último cambio: {cambio.cambiadoPor || 'Sin nombre'} ·{' '}
					{dayjs(cambio.cambiadoEl).format('DD/MM/YYYY HH:mm')}
				</Typography>
			)}
			<Button
				variant="contained"
				sx={{ mt: 2 }}
				disabled={valor === actual || configQ.isError}
				onClick={() => setConfirmando(true)}
			>
				Guardar
			</Button>

			<Dialog
				open={confirmando}
				onClose={guardar.isPending ? undefined : () => setConfirmando(false)}
				aria-labelledby="bloque-confirmar-titulo"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="bloque-confirmar-titulo" sx={{ fontWeight: 700 }}>
					¿Cambiar el bloque de {actual} min a {valor} min?
				</DialogTitle>
				<DialogContent>
					{confirmando && <Implicaciones nuevo={valor} />}
				</DialogContent>
				<DialogActions>
					<Button
						autoFocus
						onClick={() => setConfirmando(false)}
						disabled={guardar.isPending}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={() => guardar.mutate()}
						disabled={guardar.isPending}
						startIcon={
							guardar.isPending ? <CircularProgress size={16} /> : undefined
						}
					>
						Cambiar a {valor} min
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
