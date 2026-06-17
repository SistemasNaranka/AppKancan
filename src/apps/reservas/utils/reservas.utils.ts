import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d 'de' MMMM yyyy", { locale: es });
  } catch {
    return String(date);
  }
}

export function formatShortDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy");
  } catch {
    return String(date);
  }
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}

export function hourToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToHour(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const startMin = hourToMinutes(startTime);
  const endMin = hourToMinutes(endTime);
  return endMin - startMin;
}

export function validateSchedule(
  time: string,
  startTime: string,
  endTime: string
): boolean {
  const minutes = hourToMinutes(time);
  const startMin = hourToMinutes(startTime);
  const endMin = hourToMinutes(endTime);
  return minutes >= startMin && minutes <= endMin;
}

export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj > today;
}

export function meetingHasStarted(date: string, startTime: string): boolean {
  const now = new Date();
  const meetingDate = new Date(`${date}T${startTime}`);
  return meetingDate <= now;
}

export function meetingHasEnded(date: string, endTime: string): boolean {
  const now = new Date();
  const meetingDate = new Date(`${date}T${endTime}`);
  return meetingDate <= now;
}

export function getCurrentDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getCurrentTime(): string {
  return format(new Date(), "HH:mm");
}

export function generateHourRange(
  start: string,
  end: string,
  intervalMinutes: number = 30
): string[] {
  const hours: string[] = [];
  let currentHour = hourToMinutes(start);
  const finalHour = hourToMinutes(end);

  while (currentHour <= finalHour) {
    hours.push(minutesToHour(currentHour));
    currentHour += intervalMinutes;
  }

  return hours;
}

export function rangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const min1Start = hourToMinutes(start1);
  const min1End = hourToMinutes(end1);
  const min2Start = hourToMinutes(start2);
  const min2End = hourToMinutes(end2);

  if (min2Start >= min1Start && min2Start < min1End) return true;

  if (min2End > min1Start && min2End <= min1End) return true;

  if (min2Start <= min1Start && min2End >= min1End) return true;

  return false;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  return `${hours} ${hours === 1 ? "hora" : "horas"} ${mins} minutos`;
}

export function getDayOfWeek(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "EEEE", { locale: es });
}

export function isWeekend(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = dateObj.getDay();
  return day === 0 || day === 6;
}