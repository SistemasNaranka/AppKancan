import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { EmpleadoAsistencia, Novedad } from "../interfaces/horarios.interface";
import { getEmpleados, getNovedades } from "../api/directus/read";
import { createNovedad } from "../api/directus/create";

const EMPLEADOS_INICIALES: EmpleadoAsistencia[] = [
  { id: "1", nombre: "Empleado Prueba 1", estadoActual: "entrada_pendiente", registros: { observaciones: {} } },
  { id: "2", nombre: "Empleado Prueba 2", estadoActual: "entrada_pendiente", registros: { observaciones: {} } },
  { id: "3", nombre: "Empleado Prueba 3", estadoActual: "entrada_pendiente", registros: { observaciones: {} } },
];

export const useHorarios = () => {
  const queryClient = useQueryClient();
  const [empleados, setEmpleados] = useState<EmpleadoAsistencia[]>(EMPLEADOS_INICIALES);
  const [error, setError] = useState<string | null>(null);

  // Empleados reales
  const { data: empleadosDB } = useQuery({
    queryKey: ["horarios-empleados"],
    queryFn: getEmpleados,
    staleTime: 5 * 60 * 1000,
  });

  // Novedades (se refresca automáticamente)
  const { data: novedades = [], isLoading: loadingNovedades, refetch } = useQuery({
    queryKey: ["horarios-novedades"],
    queryFn: getNovedades,
    staleTime: 0,
  });

  // Sincronizar nombres y documentos de empleados
  useEffect(() => {
    if (empleadosDB && empleadosDB.length > 0) {
      setEmpleados(
        EMPLEADOS_INICIALES.map((emp) => {
          const real = empleadosDB.find((e) => e.id === emp.id);
          return real ? { ...emp, nombre: real.nombre, documento: real.documento } : emp;
        })
      );
    }
  }, [empleadosDB]);

  const createMutation = useMutation({
    mutationFn: createNovedad,
    onSuccess: () => {
      refetch(); // recargar novedades después de guardar
    },
    onError: (err) => {
      console.error("❌ Error guardando novedad:", err);
      setError("No se pudo guardar en la base de datos.");
    },
  });

  const registrarEvento = (id: string, evento: string) => {
    const now = dayjs().format("hh:mm A");
    setEmpleados((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        let newState = emp.estadoActual;
        const newRegs = { ...emp.registros };
        if (evento === "Comenzar Jornada" && emp.estadoActual === "entrada_pendiente") {
          newState = "jornada_iniciada";
          newRegs.inicioJornada = now;
        } else if (evento === "Iniciar Almuerzo" && emp.estadoActual === "jornada_iniciada") {
          newState = "en_almuerzo";
          newRegs.inicioAlmuerzo = now;
        } else if (evento === "Finalizar Almuerzo" && emp.estadoActual === "en_almuerzo") {
          newState = "regreso_almuerzo";
          newRegs.finAlmuerzo = now;
        } else if (evento === "Terminar Jornada" && emp.estadoActual === "regreso_almuerzo") {
          newState = "jornada_finalizada";
          newRegs.finJornada = now;
        }
        return { ...emp, estadoActual: newState, registros: newRegs };
      })
    );
  };

  const resetHorarios = () => {
    setEmpleados(EMPLEADOS_INICIALES);
    refetch();
  };

  const eliminarEmpleado = (id: string) => {
    setEmpleados((prev) => prev.filter((e) => e.id !== id));
  };

  const guardarObservacion = (id: string, evento: string, texto: string) => {
    setEmpleados((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;
        const obs = emp.registros.observaciones || {};
        let key = "";
        if (evento === "Comenzar Jornada") key = "inicioJornada";
        else if (evento === "Iniciar Almuerzo") key = "inicioAlmuerzo";
        else if (evento === "Finalizar Almuerzo") key = "finAlmuerzo";
        else if (evento === "Terminar Jornada") key = "finJornada";
        return { ...emp, registros: { ...emp.registros, observaciones: { ...obs, [key]: texto } } };
      })
    );
  };

  const agregarNovedad = async (novedad: Omit<Novedad, "id">) => {
    await createMutation.mutateAsync({
      employee_id: Number(novedad.empleadoId),
      newness_id: novedad.tipo,
      report_date: novedad.fecha,
      description: novedad.description || "",
      notes: novedad.notes || "",
    });
  };

  return {
    empleados,
    novedades,
    loading: loadingNovedades,
    error,
    registrarEvento,
    resetHorarios,
    eliminarEmpleado,
    guardarObservacion,
    agregarNovedad,
  };
};