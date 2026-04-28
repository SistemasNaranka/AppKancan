import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactosApi } from '../api/contactosApi';
import { Contactos } from '../types/types';

export const useContactos = () => {
  const queryClient = useQueryClient();
  const QUERY_KEY = ['contactos'];

  const { data: contactos = [], isLoading, isError, error } = useQuery<Contactos[], Error>({
    queryKey: QUERY_KEY,
    queryFn: contactosApi.getContactos,
  });

  const createMutation = useMutation({
    mutationFn: contactosApi.createContacto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: contactosApi.updateContacto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contactosApi.deleteContacto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    contactos,
    isLoading,
    isError,
    error,
    createContacto: createMutation.mutateAsync,
    updateContacto: updateMutation.mutateAsync,
    deleteContacto: deleteMutation.mutateAsync,
  };
};
