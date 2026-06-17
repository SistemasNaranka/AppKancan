import { useState, useEffect, useMemo } from "react";
import {
  DirectusStaff,
  DirectusPosition,
  EmpleadoAsignado,
  ROLES_EXCLUSIVOS,
} from "../types/modal";
import { obtenerAsesores, obtenerCargos } from "../api/directus/read";

interface UseEmployeeDataReturn {
  asesoresDisponibles: DirectusStaff[];
  cargosDisponibles: DirectusPosition[];
  cargosFiltrados: DirectusPosition[];
  loading: boolean;
  error: string | null;
  empleadoEncontrado: DirectusStaff | null;

  loadAsesoresDisponibles: () => Promise<void>;
  setCargoSeleccionado: (value: string) => void;
  buscarEmpleadoPorCodigo: (codigo: string) => void;

  getCurrentMessage: () => {
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null;
}

export const useEmployeeData = (
  empleadosAsignados: EmpleadoAsignado[],
  tiendaUsuario?: { id: number } | null,
): UseEmployeeDataReturn => {
  const [asesoresDisponibles, setAsesoresDisponibles] = useState<
    DirectusStaff[]
  >([]);
  const [cargosDisponibles, setCargosDisponibles] = useState<DirectusPosition[]>(
    [],
  );
  const [cargosFiltrados, setCargosFiltrados] = useState<DirectusPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empleadoEncontrado, setEmpleadoEncontrado] =
    useState<DirectusStaff | null>(null);

  const tiendaId = useMemo(() => {
    return tiendaUsuario?.id;
  }, [tiendaUsuario?.id]);

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

  useEffect(() => {
    const rolesAsignados = empleadosAsignadosMemo.map((e) =>
      e.cargoAsignado.toLowerCase(),
    );
    const cargosExclusivosUsados = rolesAsignados.filter((role) =>
      ROLES_EXCLUSIVOS.includes(role as any),
    );

    let cargosFiltrados = cargosDisponibles;

    if (cargosExclusivosUsados.length > 0) {
      cargosFiltrados = cargosFiltrados.filter((cargo) => {
        const cargoLower = cargo.name.toLowerCase();
        return !cargosExclusivosUsados.includes(cargoLower);
      });
    }

    const tiendaIdNum = tiendaId ? Number(tiendaId) : null;

    if (tiendaIdNum && tiendaIdNum !== 5) {
      cargosFiltrados = cargosFiltrados.filter((cargo) => {
        const cargoLower = cargo.name.toLowerCase();
        const isGerenteOnline =
          cargoLower.includes("gerente") && cargoLower.includes("online");
        return !isGerenteOnline;
      });
    } else if (tiendaIdNum === 5) {
    }

    setCargosFiltrados(cargosFiltrados);
  }, [empleadosAsignadosMemo, cargosDisponibles, tiendaId]);

  useEffect(() => {
    if (cargosFiltrados.length > 0) {
      const asesorCargo = cargosFiltrados.find(
        (c) => c.name.toLowerCase() === "asesor",
      );
      if (asesorCargo) {
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
      (a) => String(a.id) === String(codigo.trim())
    );
    setEmpleadoEncontrado(empleado || null);

    if (codigo.trim().length === 4 && !empleado) {
      setError(`⚠️ El código ${codigo.trim()} no existe en la base de datos.`);
    } else if (error && error.includes("no existe")) {
      setError(null);
    }
  };

  const getCurrentMessage = () => {
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
    setCargoSeleccionado: () => {},
    buscarEmpleadoPorCodigo,
    getCurrentMessage,
  };
};
