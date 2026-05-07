export const generarOpcionesHora = (
  horaInicio: number = 7,
  horaFin: number = 17,
) => {
  const opciones: { value: string; label: string }[] = [];

  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";

      opciones.push({
        value: hora24,
        label: `${hora12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`,
      });
    }
  }

  return opciones;
};

export const formatearHoraLegible = (hora24: string): string => {
  const [h, m] = hora24.split(":").map(Number);
  const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";

  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export const calcularHoraMinima = (horaInicio: string): string => {
  const [h, m] = horaInicio.split(":").map(Number);

  let horaMinima = h + 1;
  if (horaMinima >= 24) horaMinima = 23;

  return `${horaMinima.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};