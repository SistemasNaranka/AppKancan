export const generateHourOptions = (
  startHour: number = 7,
  endHour: number = 17,
) => {
  const options: { value: string; label: string }[] = [];

  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";

      options.push({
        value: hour24,
        label: `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`,
      });
    }
  }

  return options;
};

export const formatReadableHour = (hour24: string): string => {
  const [h, m] = hour24.split(":").map(Number);
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";

  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export const calculateMinHour = (startTime: string): string => {
  const [h, m] = startTime.split(":").map(Number);

  let minHour = h + 1;
  if (minHour >= 24) minHour = 23;

  return `${minHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};