export const generarOpcionesHora = (horaInicio = 7, horaFin = 17) => {
  const opciones = [];

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

export const calcularHoraMinima = (horaInicio: string) => {
  const [h, m] = horaInicio.split(":").map(Number);
  return `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};