import { useState, useEffect } from "react";

export const useResponsiveItems = () => {
  const calcularItems = (): number => {
    const alturaVentana = window.innerHeight;
    const anchuraVentana = window.innerWidth;

    if (anchuraVentana < 480) {
      return 4;
    }

    if (anchuraVentana < 768) {
      return 5;
    }

    if (anchuraVentana < 900) {
      return 6;
    }

    if (anchuraVentana < 1024) {
      return 8;
    }

    if (anchuraVentana < 1280) {
      return 10;
    }

    const espacioReservado = 300;
    const alturaDisponible = alturaVentana - espacioReservado;
    const alturaFila = 53;

    const items = Math.floor(alturaDisponible / alturaFila);

    return Math.max(4, Math.min(items, 20));
  };

  const [itemsPorPagina, setItemsPorPagina] = useState<number>(calcularItems);

  useEffect(() => {
    const handleResize = () => {
      setItemsPorPagina(calcularItems());
    };

    handleResize();

    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedHandleResize);

    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return itemsPorPagina;
};
