export const formatearMoneda = (valor: number): string => {
  // Formatear con es-CO y luego reemplazar puntos por comas
  const formateado = valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
  return formateado.replace(/\./g, ",");
};

export const formatearValor = (valor: any, columna?: string): string => {
  if (valor === null || valor === undefined || valor === "") return "";

  // Función auxiliar para normalizar strings (quitar acentos y a minúsculas)
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const colNorm = columna ? normalizar(columna) : "";

  // No formatear como moneda si la columna es de tipo documento, nombre o identificador
  const keywordsNoMoneda = [
    "documento",
    "cc",
    "nit",
    "cedula",
    "identificaci",
    "idemisor",
    "nro_",
    "id_",
    "almacen",
    "nombre",
    "tienda",
    "cliente",
    "factura",
    "pagare",
    "referencia",
    "codigo",
    "comercio",
  ];

  const esIdentidad = keywordsNoMoneda.some((key) => colNorm.includes(key));

  // Función para intentar parsear y normalizar fechas a YYYY-MM-DD (Formato TRANSFERENCIAS)
  const normalizarFecha = (v: any): string | null => {
    if (v instanceof Date) {
      if (isNaN(v.getTime())) return null;
      return v.toISOString().split("T")[0];
    }
    if (typeof v !== "string") return null;

    const s = v.trim();
    if (s.length < 8) return null;

    // Caso ISO: 2025-12-21T...
    if (s.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const d = new Date(s);
      return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : null;
    }

    // Caso DD/MM/YYYY: 21/12/2025
    const matchDMY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (matchDMY) {
      const [_, d, m, y] = matchDMY;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // Caso YYYY/MM/DD o YYYY-MM-DD sin T
    const matchYMD = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (matchYMD) {
      const [_, y, m, d] = matchYMD;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // Intentar con Date nativo para otros formatos (como el de ADDI si es parseable)
    const d = new Date(s);
    if (
      !isNaN(d.getTime()) &&
      (s.includes("/") || s.includes("-") || s.match(/[a-z]{3}/i))
    ) {
      try {
        return d.toISOString().split("T")[0];
      } catch {
        return null;
      }
    }

    return null;
  };

  // Función para normalizar HORA a HH:mm:ss (Formato TRANSFERENCIAS)
  const normalizarHora = (v: any, col: string): string | null => {
    const c = col.toLowerCase();
    // Solo aplicar si la columna parece ser de hora o si el valor tiene formato de hora
    if (
      !c.includes("hora") &&
      !c.includes("time") &&
      !c.includes("creacion") &&
      !c.includes("cancelacion")
    )
      return null;

    let s = String(v).trim();
    if (!s) return null;

    // Caso AM/PM: "12:10 p. m." o "12:10 PM"
    const matchAMPM = s.match(
      /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*([ap]\.?\s*m\.?|am|pm)/i,
    );
    if (matchAMPM) {
      let [_, h, m, sec, meridiem] = matchAMPM;
      let hours = parseInt(h);
      const minutes = m.padStart(2, "0");
      const seconds = (sec || "00").padStart(2, "0");
      const isPM = meridiem.toLowerCase().includes("p");

      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }

    // Caso ISO o Date: extraer solo la hora
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.toTimeString().split(" ")[0];
    }

    // Caso ya en HH:mm:ss.SSS (como TRANSFERENCIAS)
    const matchHHMMSS = s.match(/^(\d{2}):(\d{2}):(\d{2})(\.\d+)?/);
    if (matchHHMMSS) return s;

    return null;
  };

  const horaNormalizada = normalizarHora(valor, columna || "");
  if (horaNormalizada) return horaNormalizada;

  const fechaNormalizada = normalizarFecha(valor);
  if (fechaNormalizada) return fechaNormalizada;

  if (typeof valor === "number") {
    if (esIdentidad) return String(valor);
    return formatearMoneda(valor);
  }

  // Si el valor contiene letras, devolverlo tal cual (evita formatear "ARMENIA 14" como dinero)
  if (/[a-zA-Z]/.test(String(valor))) return String(valor).trim();

  // Intentar convertir string a número si parece un número y no es una fecha
  const num = Number(String(valor).replace(/[^0-9.-]+/g, ""));
  if (
    !isNaN(num) &&
    String(valor).match(/[0-9]/) &&
    !String(valor).includes("-") &&
    !String(valor).includes("/")
  ) {
    if (esIdentidad) return String(valor).trim();
    return formatearMoneda(num);
  }

  return String(valor);
};
