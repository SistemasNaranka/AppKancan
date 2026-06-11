// Hook con la búsqueda debounced de usuarios y el estado temporal del nuevo participante.

import { useRef, useState } from "react";
import { buscarUsuarios } from "../../services/reservas";

export function useParticipantesAutocomplete() {
  const [usuariosSugeridos, setUsuariosSugeridos] = useState<any[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [tempNombre, setTempNombre] = useState("");
  const [tempCorreo, setTempCorreo] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleBuscarUsuarios = (valor: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (valor.length < 3) {
      setUsuariosSugeridos([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setBuscandoUsuarios(true);
      const resultados = await buscarUsuarios(valor);
      setUsuariosSugeridos(resultados as any[]);
      setBuscandoUsuarios(false);
    }, 500);
  };

  return {
    usuariosSugeridos,
    buscandoUsuarios,
    tempNombre,
    setTempNombre,
    tempCorreo,
    setTempCorreo,
    handleBuscarUsuarios,
  };
}
