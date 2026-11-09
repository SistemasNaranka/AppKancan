import { Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import ReporteMotivosTab from '../ReporteMotivosTab';
import GerenciaPorTienda from './GerenciaPorTienda';
import GerenciaPorZona from './GerenciaPorZona';
import GerenciaTendencia from './GerenciaTendencia';
import GerenciaTiempoReal from './GerenciaTiempoReal';

type Pestana = 'tiempo-real' | 'zona' | 'tienda' | 'tendencia' | 'motivo';

/**
 * Reportes → Horas extras para gerencia: Tiempo real, Por zona, Por tienda, Tendencia y
 * Por motivo, sin personas ni descargas. En teléfono, las pestañas se deslizan.
 */
export default function ReporteGerencia() {
	const telefono = useMediaQuery(useTheme().breakpoints.down('sm'));
	const [pestana, setPestana] = useState<Pestana>('tiempo-real');
	return (
		<>
			<Tabs
				value={pestana}
				onChange={(_, v: Pestana) => setPestana(v)}
				variant={telefono ? 'scrollable' : 'standard'}
				allowScrollButtonsMobile
				aria-label="Reporte de horas extras"
				sx={{ mb: 2 }}
			>
				<Tab value="tiempo-real" label="Tiempo real" />
				<Tab value="zona" label="Por zona" />
				<Tab value="tienda" label="Por tienda" />
				<Tab value="tendencia" label="Tendencia" />
				<Tab value="motivo" label="Por motivo" />
			</Tabs>
			{pestana === 'tiempo-real' ? (
				<GerenciaTiempoReal />
			) : pestana === 'zona' ? (
				<GerenciaPorZona />
			) : pestana === 'tienda' ? (
				<GerenciaPorTienda />
			) : pestana === 'tendencia' ? (
				<GerenciaTendencia />
			) : (
				<ReporteMotivosTab perfil="gerencia" />
			)}
		</>
	);
}
