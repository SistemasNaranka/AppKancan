// Hook que carga la configuración global de horarios al abrir un diálogo de reserva.

import { useEffect, useState } from "react";
import { HORARIO_INICIO, HORARIO_FIN } from "../../types/reservas.types";
import { getConfiguracionReserva } from "../../services/reservas";

export interface HorarioConfig {
  horaApertura: string;
  horaCierre: string;
}

export function useHorarioConfig(open: boolean) {
  const [configCargando, setConfigCargando] = useState(true);
  const [horarioConfig, setHorarioConfig] = useState<HorarioConfig>({
    horaApertura: HORARIO_INICIO,
    horaCierre: HORARIO_FIN,
  });

  useEffect(() => {
    if (!open) return;
    const cargarConfiguracion = async () => {
      setConfigCargando(true);
      try {
        const config = await getConfiguracionReserva();
        if (config) {
          const horaApertura = config.opening_time?.substring(0, 5) || HORARIO_INICIO;
          const horaCierre = config.closing_time?.substring(0, 5) || HORARIO_FIN;
          setHorarioConfig({ horaApertura, horaCierre });
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
      } finally {
        setConfigCargando(false);
      }
    };
    cargarConfiguracion();
  }, [open]);

  return { horarioConfig, configCargando };
}
