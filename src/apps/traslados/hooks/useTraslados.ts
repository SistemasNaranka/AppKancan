import { useState } from 'react';
import type { Traslado } from '../components/TrasladoCard';

export function useTraslados(initialPendientes: Traslado[]) {
  const [pendientes, setPendientes] = useState<Traslado[]>(initialPendientes);
  const [seleccionados, setSeleccionados] = useState<Traslado[]>([]);
  const [checkedPendientes, setCheckedPendientes] = useState<number[]>([]);
  const [checkedSeleccionados, setCheckedSeleccionados] = useState<number[]>([]);

  // Lógica de mover, seleccionar, aprobar, etc.
  const aprobarSeleccionados = () => {
    setSeleccionados([
      ...seleccionados,
      ...pendientes.filter((t) => checkedPendientes.includes(t.id)),
    ]);
    setPendientes(pendientes.filter((t) => !checkedPendientes.includes(t.id)));
    setCheckedPendientes([]);
  };

  const aprobarTodosSeleccionados = () => {
    setSeleccionados([]);
    // Aquí iría la lógica de aprobación final (API, etc.)
  };

  return {
    pendientes,
    setPendientes,
    seleccionados,
    setSeleccionados,
    checkedPendientes,
    setCheckedPendientes,
    checkedSeleccionados,
    setCheckedSeleccionados,
    aprobarSeleccionados,
    aprobarTodosSeleccionados,
  };
}
