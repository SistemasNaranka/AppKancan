// Hook que arma las filas del DataGrid a partir de la hoja actual e inserta la fila de totales.

import { useMemo } from "react";

export function useDashboardRows(datosActuales: any | null) {
  return useMemo(() => {
    if (!datosActuales) return [];
    const isMatriz = "curvas" in datosActuales;
    const itemsKey = isMatriz ? "curvas" : "tallas";
    const baseRows = datosActuales.filas.map((fila: any) => {
      const row: any = { id: fila.id, tienda: fila.tienda, total: fila.total };
      const items = fila[itemsKey] || {};
      Object.entries(items).forEach(([k, v]: any) => {
        row[`val_${k}`] = v.valor;
      });
      return row;
    });
    const totalRow: any = {
      id: "row-total-final",
      tienda: { nombre: "TOTAL GENERAL" },
      total: baseRows.reduce(
        (sum: number, r: any) => sum + (r.total || 0),
        0,
      ),
    };
    const columns = isMatriz
      ? (datosActuales as any).curvas
      : (datosActuales as any).tallas;
    columns.forEach((c: string) => {
      totalRow[`val_${c}`] = baseRows.reduce(
        (sum: number, r: any) => sum + (r[`val_${c}`] || 0),
        0,
      );
    });
    return [...baseRows, totalRow];
  }, [datosActuales]);
}
