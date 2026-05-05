import { useState } from "react";
import dayjs from "dayjs";
import { obtenerPresupuestosEmpleados, obtenerPresupuestosDiarios } from "../api/directus/read";

export const useBudgetCalendar = (tiendaSeleccionada: number | "", fecha: string) => {
  const [diasSinPresupuesto, setDiasSinPresupuesto] = useState<string[]>([]);
  const [diasConPresupuestoCero, setDiasConPresupuestoCero] = useState<string[]>([]);
  const [diasConAsignacion, setDiasConAsignacion] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const loadDiasSinPresupuesto = async () => {
    if (!tiendaSeleccionada || !fecha) {
      setDiasSinPresupuesto([]);
      setDiasConPresupuestoCero([]);
      return;
    }

    try {
      const fechaObj = dayjs(fecha);
      const mesSeleccionado = fechaObj.format("MMM YYYY");
      const startOfMonth = fechaObj.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = fechaObj.endOf("month").format("YYYY-MM-DD");

      const [presupuestosMes, presupuestosCasa] = await Promise.all([
        obtenerPresupuestosEmpleados(tiendaSeleccionada as number, undefined, mesSeleccionado),
        obtenerPresupuestosDiarios(tiendaSeleccionada as number, startOfMonth, endOfMonth)
      ]);

      const diasDelMes = [];
      const diasEnMes = fechaObj.daysInMonth();
      for (let i = 1; i <= diasEnMes; i++) {
        diasDelMes.push(fechaObj.date(i).format("YYYY-MM-DD"));
      }

      const diasConMetaValida = new Set(
        presupuestosCasa.filter((p: any) => (p.presupuesto || 0) > 0).map((p: any) => p.fecha)
      );

      const restrictedDays = diasDelMes.filter((dia: string) => !diasConMetaValida.has(dia));
      setDiasConPresupuestoCero(restrictedDays);

      const diasConAsignacionSet = new Set(presupuestosMes.map((p: any) => p.fecha));
      setDiasConAsignacion(Array.from(diasConAsignacionSet));

      const diasSinPresupuestoCalculado = diasDelMes.filter(
        (dia) => !diasConAsignacionSet.has(dia) && dia <= dayjs().format("YYYY-MM-DD") && diasConMetaValida.has(dia)
      );

      setDiasSinPresupuesto(diasSinPresupuestoCalculado);
    } catch (err) {
      console.error("Error al cargar días sin presupuesto:", err);
    }
  };

  return {
    diasSinPresupuesto,
    diasConPresupuestoCero,
    diasConAsignacion,
    selectedDays,
    setSelectedDays,
    loadDiasSinPresupuesto,
  };
};