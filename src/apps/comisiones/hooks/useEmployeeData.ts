import { useState, useEffect } from "react";
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
  empleadosAsignados: EmpleadoAsignado[]
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

  const loadAsesoresDisponibles = async () => {
    try {
      setLoading(true);
      setError(null);

      const [asesores, cargos] = await Promise.all([
        obtenerAsesores(),
        obtenerCargos(),
      ]);

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

  // Filtrar cargos basados en empleados asignados (ocultar roles exclusivos ya seleccionados)
  useEffect(() => {
    const rolesAsignados = empleadosAsignados.map((e) =>
      e.cargoAsignado.toLowerCase()
    );
    const cargosExclusivosUsados = rolesAsignados.filter((role) =>
      ROLES_EXCLUSIVOS.includes(role as any)
    );

    if (cargosExclusivosUsados.length > 0) {
      const cargosFiltrados = cargosDisponibles.filter((cargo) => {
        const cargoLower = cargo.nombre.toLowerCase();
        return !cargosExclusivosUsados.includes(cargoLower);
      });
      setCargosFiltrados(cargosFiltrados);
    } else {
      setCargosFiltrados(cargosDisponibles);
    }
  }, [empleadosAsignados, cargosDisponibles]);

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
