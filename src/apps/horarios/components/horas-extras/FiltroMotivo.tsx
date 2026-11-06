import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
	type FiltroMotivo as Filtro,
	SIN_MOTIVO,
	TIPO_MOTIVO,
} from '../../domain/horasExtras';
import { useMotivos } from '../../hooks/useMotivos';

export function FiltroMotivo({
	value,
	onChange,
}: {
	value: Filtro;
	onChange: (filtro: Filtro) => void;
}) {
	const { delTipo } = useMotivos(TIPO_MOTIVO.solicitud);
	return (
		<FormControl size="small" sx={{ minWidth: 200 }}>
			<InputLabel id="filtro-motivo">Motivo</InputLabel>
			<Select
				labelId="filtro-motivo"
				label="Motivo"
				value={value}
				onChange={(e) => {
					const v = e.target.value;
					onChange(v === 'todos' || v === 'sin' ? v : Number(v));
				}}
			>
				<MenuItem value="todos">Todos los motivos</MenuItem>
				{delTipo.map((m) => (
					<MenuItem key={m.id} value={m.id}>
						{m.nombre}
					</MenuItem>
				))}
				<MenuItem value="sin">{SIN_MOTIVO}</MenuItem>
			</Select>
		</FormControl>
	);
}
