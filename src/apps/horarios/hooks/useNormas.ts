import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/hooks/useAuth';
import { getNormasActivas, Normas } from '../api/directus/rules';

export function useNormas() {
  const { user } = useAuth();
  const [manualOpen, setManualOpen] = useState(false);
  const [aceptadoLocal, setAceptadoLocal] = useState<boolean | null>(null);
  const [aceptando, setAceptando] = useState(false);

  const userId = (user?.id as string | undefined) ?? null;

  const { data: normas = null } = useQuery<Normas | null>({
    queryKey: ['normasActivas'],
    queryFn: getNormasActivas,
    staleTime: 10 * 60 * 1000,
  });

  const version = normas?.version ?? null;

  // Clave de localStorage para guardar la aceptación por usuario y versión de normas
  const storageKey = userId && version != null ? `kancan_rules_accepted_${userId}_v${version}` : null;

  // Cargar estado de aceptación desde localStorage
  useEffect(() => {
    if (storageKey) {
      const valor = localStorage.getItem(storageKey);
      setAceptadoLocal(valor === 'true');
    } else {
      setAceptadoLocal(null);
    }
  }, [storageKey]);

  // ⚠️ MODO PRUEBAS: el aviso de normas se muestra SIEMPRE al entrar si está en true.
  // 👉 Para PRODUCCIÓN (que salga solo UNA vez por usuario/dispositivo), cambiar a: false
  const SIEMPRE_MOSTRAR_NORMAS = false;

  const yaAceptoVigente = aceptadoLocal === true;
  // Debe aceptar si hay normas vigentes, hay usuario y (modo pruebas) o aún no las aceptó.
  const debeAceptar = !!normas && !!userId && (SIEMPRE_MOSTRAR_NORMAS || !yaAceptoVigente);

  const aceptar = async () => {
    if (!storageKey) return;
    setAceptando(true);
    try {
      // Guardar en localStorage
      localStorage.setItem(storageKey, 'true');
      setAceptadoLocal(true);
    } catch (error) {
      console.error("❌ Error guardando aceptación de normas localmente:", error);
    } finally {
      setAceptando(false);
    }
  };

  return {
    normas,
    debeAceptar,
    manualOpen,
    setManualOpen,
    aceptar,
    aceptando,
  };
}

export default useNormas;
