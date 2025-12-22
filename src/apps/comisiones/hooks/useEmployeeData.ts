import { useState, useEffect, useMemo } from "react";
import {
  DirectusAsesor,
  DirectusCargo,
  EmpleadoAsignado,
  ROLES_EXCLUSIVOS,
} from "../types/modal";
import { obtenerAsesores, obtenerCargos } from "../api/directus/read";

interface UseEmployeeDataReturn {
  // Estados
  asesoresDisponibles: DirectusAsesor[];
  cargosDisponibles: DirectusCargo[];
  cargosFiltrados: DirectusCargo[];
  loading: boolean;
  error: string | null;
  empleadoEncontrado: DirectusAsesor | null;

  // Handlers
  loadAsesoresDisponibles: () => Promise<void>;
  setCargoSeleccionado: (value: string) => void;
  buscarEmpleadoPorCodigo: (codigo: string) => void;

  // Getters
  getCurrentMessage: () => {
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null;
}

export const useEmployeeData = (
  empleadosAsignados: EmpleadoAsignado[],
  tiendaUsuario?: { id: number } | null
): UseEmployeeDataReturn => {
  const [asesoresDisponibles, setAsesoresDisponibles] = useState<
    DirectusAsesor[]
  >([]);
  const [cargosDisponibles, setCargosDisponibles] = useState<DirectusCargo[]>(
    []
  );
  const [cargosFiltrados, setCargosFiltrados] = useState<DirectusCargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empleadoEncontrado, setEmpleadoEncontrado] =
    useState<DirectusAsesor | null>(null);

  // ✅ FIX: Memoizar el ID de la tienda para evitar bucles infinitos
  const tiendaId = useMemo(() => {
    return tiendaUsuario?.id;
  }, [tiendaUsuario?.id]);

  // ✅ FIX: Memoizar empleadosAsignados para evitar bucles infinitos
  const empleadosAsignadosMemo = useMemo(() => {
    return empleadosAsignados;
  }, [
    empleadosAsignados.length,
    empleadosAsignados
      .map((e) => `${e.asesor.id}-${e.cargoAsignado}`)
      .join(","),
  ]);

  const loadAsesoresDisponibles = async () => {
    try {
      setLoading(true);
      setError(null);

      const [asesores, cargos] = await Promise.all([
        obtenerAsesores(),
        obtenerCargos(),
      ]);

      // Verificar que el cargo "Gerente Online" existe
      const gerenteOnlineExists = cargos.some(
        (cargo) =>
          cargo.nombre.toLowerCase().includes("gerente") &&
          cargo.nombre.toLowerCase().includes("online")
      );

      setAsesoresDisponibles(asesores);
      setCargosDisponibles(cargos);
    } catch (err) {
      console.error("Error al cargar empleados y cargos:", err);
      setError("Error al cargar empleados y cargos");
      setAsesoresDisponibles([]);
      setCargosDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cargos basados en empleados asignados (ocultar roles exclusivos ya seleccionados) y tienda
  useEffect(() => {
    const rolesAsignados = empleadosAsignadosMemo.map((e) =>
      e.cargoAsignado.toLowerCase()
    );
    const cargosExclusivosUsados = rolesAsignados.filter((role) =>
      ROLES_EXCLUSIVOS.includes(role as any)
    );

    let cargosFiltrados = cargosDisponibles;

    // Filtrar roles exclusivos ya asignados
    if (cargosExclusivosUsados.length > 0) {
      cargosFiltrados = cargosFiltrados.filter((cargo) => {
        const cargoLower = cargo.nombre.toLowerCase();
        return !cargosExclusivosUsados.includes(cargoLower);
      });
    }

    // Filtrar gerente_online SOLO si la tienda NO es 5 (tienda online)
    // ✅ FIX: Convertir a número para comparación correcta
    const tiendaIdNum = tiendaId ? Number(tiendaId) : null;

    if (tiendaIdNum && tiendaIdNum !== 5) {
      cargosFiltrados = cargosFiltrados.filter((cargo) => {
        const cargoLower = cargo.nombre.toLowerCase();
        const isGerenteOnline =
          cargoLower.includes("gerente") && cargoLower.includes("online");
        return !isGerenteOnline;
      });
    } else if (tiendaIdNum === 5) {
      // Para tienda 5, verificar que gerente_online esté incluido
      const hasGerenteOnline = cargosFiltrados.some(
        (cargo) =>
          cargo.nombre.toLowerCase().includes("gerente") &&
          cargo.nombre.toLowerCase().includes("online")
      );
    }

    setCargosFiltrados(cargosFiltrados);
  }, [empleadosAsignadosMemo, cargosDisponibles, tiendaId]); // ✅ FIX: Usar empleadosAsignadosMemo para evitar bucles

  // Establecer valor por defecto cuando se cargan los cargos
  useEffect(() => {
    if (cargosFiltrados.length > 0) {
      const asesorCargo = cargosFiltrados.find(
        (c) => c.nombre.toLowerCase() === "asesor"
      );
      if (asesorCargo) {
        // Solo establecer si no hay cargo seleccionado o si está vacío
        if (!empleadoEncontrado) {
          setEmpleadoEncontrado(null);
        }
      }
    }
  }, [cargosFiltrados]);

  const buscarEmpleadoPorCodigo = (codigo: string) => {
    if (!codigo.trim()) {
      setEmpleadoEncontrado(null);
      return;
    }

    const codigoNum = parseInt(codigo.trim());
    if (isNaN(codigoNum)) {
      setEmpleadoEncontrado(null);
      return;
    }

    const empleado = asesoresDisponibles.find(
      (a) => a.id === codigoNum || a.id.toString() === codigo.trim()
    );
    setEmpleadoEncontrado(empleado || null);
  };

  const getCurrentMessage = () => {
    // Esta función puede ser expandida para devolver mensajes específicos
    // basados en el estado actual de los datos
    return null;
  };

  return {
    asesoresDisponibles,
    cargosDisponibles,
    cargosFiltrados,
    loading,
    error,
    empleadoEncontrado,
    loadAsesoresDisponibles,
    setCargoSeleccionado: () => {}, // Esta función se maneja en el hook principal
    buscarEmpleadoPorCodigo,
    getCurrentMessage,
  };
};
