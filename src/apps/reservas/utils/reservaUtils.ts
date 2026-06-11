export const generateHourOptions = (startHour = 7, endHour = 17) => {
  const options = [];

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

export const calculateMinHour = (startTime: string) => {
  const [h, m] = startTime.split(":").map(Number);
  return `${(h + 1).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};