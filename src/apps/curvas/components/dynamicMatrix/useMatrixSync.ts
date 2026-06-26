import { useEffect, useRef } from "react";
import type { MatrixRowData, MatrixVariant } from "./matrix.types";
import { getRowTotal } from "./matrixCalculations";

interface Params {
  rows: MatrixRowData[];
  columns: string[];
  referencia: string;
  color: string;
  grandTotal: number;
  type: MatrixVariant;
  onChange?: (data: any) => void;
}

export function useMatrixSync({
  rows,
  columns,
  referencia,
  color,
  grandTotal,
  type,
  onChange,
}: Params) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<string>("");

  useEffect(() => {
    if (!onChange) return;
    const validRows = rows
      .filter((r) => r.name && r.name.trim() !== "" && getRowTotal(r.values) > 0)
      .map((r) => ({
        tienda: r.tiendaData || { id: r.id, nombre: r.name },
        id: r.id,
        [type === "general" ? "curvas" : "tallas"]: r.values,
        total: getRowTotal(r.values),
      }));

    onChange({
      filas: validRows,
      totalGeneral: grandTotal,
      referencia: referencia,
      referenciaBase: referencia,
      nombreHoja: referencia,
      color: color,
      [type === "general" ? "curvas" : "tallas"]: columns,
      id: "NUEVA",
    });
  }, [rows, columns, referencia, color, grandTotal, type, onChange]);

  useEffect(() => {
    if (!onChange) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const isGeneral = type === "general";
      const dataKey = isGeneral ? "curvas" : "tallas";
      const totalsKey = isGeneral ? "totalesPorCurva" : "totalesPorTalla";

      const payload = {
        id: `sheet-${referencia || "NUEVA"}`,
        nombreHoja: referencia || "",
        filas: rows
          .filter((r) => {
            const rowTotal = Object.values(r.values).reduce(
              (sum: number, v) => sum + (Number(v) || 0),
              0 as number,
            );
            return rowTotal > 0 && r.name && r.name.trim() !== "";
          })
          .map((r) => ({
            id: r.tiendaData?.id || r.id,
            tienda: {
              id: r.tiendaData?.id || r.id,
              nombre: r.name || "Sin Nombre",
              codigo: r.tiendaData?.codigo || r.id,
              zona: r.tiendaData?.region || "Principal",
            },
            [dataKey]: Object.entries(r.values).reduce(
              (acc, [k, v]) => ({
                ...acc,
                [k]: {
                  valor: Number(v) || 0,
                  esCero: (Number(v) || 0) === 0,
                  esMayorQueCero: (Number(v) || 0) > 0,
                },
              }),
              {},
            ),
            total: Object.values(r.values).reduce(
              (sum: number, v: any) => sum + (Number(v) || 0),
              0,
            ),
          })),
        [isGeneral ? "curvas" : "tallas"]: columns,
        [totalsKey]: columns.reduce(
          (acc, c) => ({
            ...acc,
            [c]: rows.reduce((sum, r) => sum + (Number(r.values[c]) || 0), 0),
          }),
          {},
        ),
        totalGeneral: grandTotal,
        estado: "borrador",
        referencia: referencia,
        referenciaBase: referencia,
        ...(!isGeneral
          ? {
              metadatos: {
                referencia: referencia || "",
                color: color || "UNICO",
                imagen: "",
                proveedor: "MANUAL",
                precio: 0,
                linea: type === "producto_a" ? "BOLSOS" : "ZAPATOS",
              },
            }
          : {}),
      };

      const currentPayloadStr = JSON.stringify({
        rows: rows.map((r) => ({ id: r.id, values: r.values, name: r.name })),
        columns,
        referencia,
        color,
        grandTotal,
        type,
      });

      if (lastPayloadRef.current !== currentPayloadStr) {
        lastPayloadRef.current = currentPayloadStr;
        onChange(payload);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [rows, columns, referencia, color, grandTotal, onChange, type]);
}
