import { useEffect, useState } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { getCurrentUser, getEmployees, getRegisters } from '../api/directus';
import RegCard from '../components/RegCard';
import Loading from '../components/Loading';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface Empleado {
  id: string | number;
  nombre: string;
  tienda: string;
}

interface Registro {
  id: string | number;
  empleado: { id: string | number; nombre: string };
  evento: string;
  fecha: string;
  hora: string;
  observaciones?: string;
}

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [registers, setRegisters] = useState<Registro[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      const empleados = await getEmployees(user.tienda);
      setEmployees(empleados);
      const today = dayjs().format('YYYY-MM-DD');
      const regs = await getRegisters(today);
      setRegisters(regs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Registro de Asistencia
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
        </Typography>
      </Box>
      {/* Grid manual con CSS Grid (evita problemas de tipos de MUI) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',           // móvil: 1 columna
            sm: 'repeat(2, 1fr)',// tablet: 2 columnas
            md: 'repeat(3, 1fr)',// escritorio pequeño: 3
            lg: 'repeat(4, 1fr)',// escritorio grande: 4
          },
          gap: 3,
        }}
      >
        {employees.map((emp) => (
          <Box key={emp.id}>
            <RegCard
              employee={emp}
              registersToday={registers.filter((r) => r.empleado.id === emp.id)}
              onRefresh={loadData}
            />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Home;