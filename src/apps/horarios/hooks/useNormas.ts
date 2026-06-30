import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/hooks/useAuth';
import { getNormasActivas, yaAceptoNormas, registrarAceptacionNormas, Normas } from '../api/directus/rules';

export function useNormas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [manualOpen, setManualOpen] = useState(false);

  const userId = (user?.id as string | undefined) ?? null;

  const { data: normas = null } = useQuery<Normas | null>({
    queryKey: ['normasActivas'],
    queryFn: getNormasActivas,
    staleTime: 10 * 60 * 1000,
  });

  const version = normas?.version ?? null;

  const { data: yaAcepto = true, isLoading: verificando } = useQuery<boolean>({
    queryKey: ['normasAceptacion', userId, version],
    queryFn: () => yaAceptoNormas(userId as string, version as number),
    enabled: !!userId && version != null,
    staleTime: 5 * 60 * 1000,
  });

  // ⚠️ MODO PRUEBAS: el aviso de normas se muestra SIEMPRE al entrar.
  // 👉 Para PRODUCCIÓN (que salga solo UNA vez por usuario/tienda),
  //    cambiar esta constante a:  false
  const SIEMPRE_MOSTRAR_NORMAS = true;

  const yaAceptoVigente = !verificando && yaAcepto;
  // Debe aceptar si hay normas vigentes, hay usuario y (modo pruebas) o aún no las aceptó.
  const debeAceptar = !!normas && !!userId && (SIEMPRE_MOSTRAR_NORMAS || !yaAceptoVigente);

  const aceptarMut = useMutation({
    mutationFn: () => registrarAceptacionNormas(userId as string, version as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normasAceptacion', userId, version] });
    },
  });

  return {
    normas,
    debeAceptar,
    manualOpen,
    setManualOpen,
    aceptar: () => aceptarMut.mutateAsync(),
    aceptando: aceptarMut.isPending,
  };
}

export default useNormas;
