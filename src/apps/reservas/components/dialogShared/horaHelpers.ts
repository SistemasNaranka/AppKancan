// Utilidades para generar y formatear opciones de hora en los diálogos de reserva.

export function generarOpcionesHora(horaInicio: number = 7, horaFin: number = 17) {
  const opciones: { value: string; label: string }[] = [];
  for (let h = horaInicio; h <= horaFin; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hora12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
      opciones.push({ value: hora24, label });
    }
  }
  return opciones;
}

export function formatearHoraLegible(hora24: string): string {
  const [h, m] = hora24.split(":").map(Number);
  const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function calcularHoraMinima(horaInicio: string): string {
  const [h, m] = horaInicio.split(":").map(Number);
  let horaMinima = h;
  let minutoMinimo = m + 30;
  if (minutoMinimo >= 60) {
    horaMinima += 1;
    minutoMinimo -= 60;
  }
  if (horaMinima >= 24) horaMinima = 23;
  return `${horaMinima.toString().padStart(2, "0")}:${minutoMinimo.toString().padStart(2, "0")}`;
}
