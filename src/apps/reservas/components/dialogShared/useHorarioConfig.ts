// Hook que carga la configuración global de horarios al abrir un diálogo de reserva.

import { useEffect, useState } from "react";
import { START_HOUR, END_HOUR } from "../../types/reservas.types";
import { getReservationConfig } from "../../services/reservas";

export interface HorarioConfig {
  horaApertura: string;
  horaCierre: string;
}

export function useHorarioConfig(open: boolean) {
  const [configCargando, setConfigCargando] = useState(true);
  const [horarioConfig, setHorarioConfig] = useState<HorarioConfig>({
    horaApertura: START_HOUR,
    horaCierre: END_HOUR,
  });

  useEffect(() => {
    if (!open) return;
    const cargarConfiguracion = async () => {
      setConfigCargando(true);
      try {
        const config = await getReservationConfig();
        if (config) {
          const horaApertura = config.opening_time?.substring(0, 5) || START_HOUR;
          const horaCierre = config.closing_time?.substring(0, 5) || END_HOUR;
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
