import { useState } from 'react';
import dayjs from 'dayjs';
import { EmpleadoAsistencia, EstadoAsistencia } from '../interfaces/horarios.interface';

const EMPLEADOS_INICIALES: EmpleadoAsistencia[] = [
  { id: '1', nombre: 'Ander Martinez', estadoActual: 'entrada_pendiente', registros: {} },
  { id: '2', nombre: 'Empleado Pruebas 2', estadoActual: 'entrada_pendiente', registros: {} },
  { id: '3', nombre: 'Empleado Pruebas 3', estadoActual: 'entrada_pendiente', registros: {} },
];

export const useHorarios = () => {
  const [empleados, setEmpleados] = useState<EmpleadoAsistencia[]>(EMPLEADOS_INICIALES);

  const registrarEvento = (idEmpleado: string, tipoEvento: string) => {
    const horaActual = dayjs().format('hh:mm A');

    setEmpleados((prev) =>
      prev.map((emp) => {
        if (emp.id !== idEmpleado) return emp;

        let nuevoEstado: EstadoAsistencia = emp.estadoActual;
        const nuevosRegistros = { ...emp.registros };

        switch (tipoEvento) {
          case 'Comenzar Jornada':
            if (emp.estadoActual === 'entrada_pendiente') {
              nuevoEstado = 'jornada_iniciada';
              nuevosRegistros.inicioJornada = horaActual;
            }
            break;
          case 'Iniciar Almuerzo':
            if (emp.estadoActual === 'jornada_iniciada') {
              nuevoEstado = 'en_almuerzo';
              nuevosRegistros.inicioAlmuerzo = horaActual;
            }
            break;
          case 'Finalizar Almuerzo':
            if (emp.estadoActual === 'en_almuerzo') {
              nuevoEstado = 'regreso_almuerzo';
              nuevosRegistros.finAlmuerzo = horaActual;
            }
            break;
          case 'Terminar Jornada':
            if (emp.estadoActual === 'regreso_almuerzo') {
              nuevoEstado = 'jornada_finalizada';
              nuevosRegistros.finJornada = horaActual;
            }
            break;
        }

        return { ...emp, estadoActual: nuevoEstado, registros: nuevosRegistros };
      })
    );
  };

  const resetHorarios = () => {
    setEmpleados(EMPLEADOS_INICIALES);
  };

  return { empleados, registrarEvento, resetHorarios };
};