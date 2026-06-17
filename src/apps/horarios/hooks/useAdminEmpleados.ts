import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStores, getCargos, buscarEmpleadoPorDocumento } from '../api/directus/read';
import { crearEmpleado, actualizarEmpleado } from '../api/directus/create';
import { Tienda, Cargo, EmpleadoAdmin } from '../interfaces/horarios.interface';
import { useGlobalSnackbar } from '@/shared/components/SnackbarsPosition/SnackbarContext';

// Tipos de documento: hoy una sola opción (campo lista desplegable de adm_employees).
// Extensible: agregar más valores aquí cuando el negocio los habilite.
export const TIPOS_DOCUMENTO: string[] = ['Cédula de Ciudadanía'];

export const useAdminEmpleados = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useGlobalSnackbar();

  const { data: tiendas = [], isLoading: loadingTiendas } = useQuery<Tienda[]>({
    queryKey: ['adminTiendas'],
    queryFn: getStores,
    staleTime: 30 * 60 * 1000,
  });

  const { data: cargos = [], isLoading: loadingCargos } = useQuery<Cargo[]>({
    queryKey: ['adminCargos'],
    queryFn: getCargos,
    staleTime: 30 * 60 * 1000,
  });

  // Resultado de la búsqueda por documento
  const [empleado, setEmpleado] = useState<EmpleadoAdmin | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [sinResultado, setSinResultado] = useState(false);

  const buscarEmpleado = async (documento: string) => {
    const doc = documento.trim();
    if (!doc) return;
    setBuscando(true);
    setSinResultado(false);
    setEmpleado(null);
    try {
      const result = await buscarEmpleadoPorDocumento(doc);
      if (result) {
        setEmpleado(result);
      } else {
        setSinResultado(true);
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Error al buscar el empleado', 'error');
    } finally {
      setBuscando(false);
    }
  };

  const limpiarBusqueda = () => {
    setEmpleado(null);
    setSinResultado(false);
  };

  const invalidarEmpleados = () => {
    queryClient.invalidateQueries({ queryKey: ['empleados'] });
  };

  const crearMutation = useMutation({
    mutationFn: crearEmpleado,
    onSuccess: () => {
      invalidarEmpleados();
      showSnackbar('Empleado creado con éxito', 'success');
    },
    onError: (err: any) => {
      showSnackbar(err?.message || 'Error al crear el empleado', 'error');
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof actualizarEmpleado>[1] }) =>
      actualizarEmpleado(id, data),
    onSuccess: (_res, variables) => {
      invalidarEmpleados();
      // Refleja los cambios en la tarjeta visible
      setEmpleado((prev) => (prev ? { ...prev, ...variables.data } as EmpleadoAdmin : prev));
      showSnackbar('Empleado actualizado correctamente', 'success');
    },
    onError: (err: any) => {
      showSnackbar(err?.message || 'Error al actualizar el empleado', 'error');
    },
  });

  return {
    tiendas,
    cargos,
    tiposDocumento: TIPOS_DOCUMENTO,
    loadingCatalogos: loadingTiendas || loadingCargos,

    empleado,
    buscando,
    sinResultado,
    buscarEmpleado,
    limpiarBusqueda,

    crearEmpleado: crearMutation.mutateAsync,
    creando: crearMutation.isPending,
    actualizarEmpleado: actualizarMutation.mutateAsync,
    actualizando: actualizarMutation.isPending,
  };
};

export default useAdminEmpleados;
