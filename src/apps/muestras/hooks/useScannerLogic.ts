import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserBodegas } from "@/services/directus/apps";

export const useScannerLogic = () => {
  const queryClient = useQueryClient();
  const [codigoInput, setCodigoInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [ultimoAgregado, setUltimoAgregado] = useState<string | null>(null);
  const [alertCounter, setAlertCounter] = useState(0);

  // Referencias para los timers
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query para bodegas del usuario
  const { data: bodegas = [] } = useQuery({
    queryKey: ["user-bodegas"],
    queryFn: getUserBodegas,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para bodega seleccionada
  const { data: bodega = "" } = useQuery({
    queryKey: ["scanner-bodega"],
    queryFn: () => "",
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Query para codigos
  const { data: codigosMap = new Map() } = useQuery({
    queryKey: ["scanner-codigos"],
    queryFn: () => new Map(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Query para observaciones
  const { data: observaciones = "" } = useQuery({
    queryKey: ["scanner-observaciones"],
    queryFn: () => "",
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Establecer bodega por defecto cuando se cargan las bodegas
  useEffect(() => {
    if (bodegas.length > 0 && !bodega) {
      const sorted = [...bodegas].sort(
        (a, b) => parseInt(a.codigo) - parseInt(b.codigo)
      );
      queryClient.setQueryData(["scanner-bodega"], sorted[0].codigo);
    }
  }, [bodegas, bodega, queryClient]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        clearTimeout(alertTimerRef.current);
      }
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  // === CAMBIAR BODEGA ===
  const handleBodegaChange = (value: string) => {
    queryClient.setQueryData(["scanner-bodega"], value);
  };

  // === SET OBSERVACIONES ===
  const setObservaciones = (value: string) => {
    queryClient.setQueryData(["scanner-observaciones"], value);
  };

  // === PROCESAR CÓDIGO ===
  const procesarCodigo = (input: string): string => {
    // Limpiar y quitar ceros a la izquierda
    const limpio = input.trim().replace(/^0+/, "");
    if (!limpio) return "";

    // Nueva condición: si el número empieza con 44, tomar todo el código
    let resultado: string;
    if (limpio.startsWith("44")) {
      // Si empieza con 44, tomar todo el código
      resultado = limpio;
    } else {
      // Si no empieza con 44, tomar solo los primeros 6 dígitos (lógica original)
      resultado = limpio.slice(0, 6);
    }

    // Validar que solo sean números
    if (!/^\d+$/.test(resultado)) {
      return "";
    }
    return resultado;
  };

  // === AGREGAR CÓDIGO ===
  const agregarCodigo = (codigo: string) => {
    const procesado = procesarCodigo(codigo);
    if (!procesado) return;

    const nuevo = new Map(codigosMap);
    const existente = nuevo.get(procesado);
    nuevo.set(procesado, {
      cantidad: (existente?.cantidad || 0) + 1,
      timestamp: existente ? existente.timestamp : Date.now(),
    });
    queryClient.setQueryData(["scanner-codigos"], nuevo);

    // CANCELAR TIMER ANTERIOR SI EXISTE
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }

    // Ocultar alerta actual inmediatamente
    setUltimoAgregado(null);

    // Incrementar contador para forzar re-render con nueva key
    setAlertCounter((prev) => prev + 1);

    // Mostrar nueva alerta después de un pequeño delay
    setTimeout(() => {
      setUltimoAgregado(procesado);

      // Configurar nuevo timer para ocultar
      alertTimerRef.current = setTimeout(() => {
        setUltimoAgregado(null);
        alertTimerRef.current = null;
      }, 2000);
    }, 10);

    // Limpiar input y animación de scanning
    setCodigoInput("");
    setIsScanning(true);

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }

    scanTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      scanTimerRef.current = null;
    }, 300);
  };

  // === ELIMINAR CÓDIGO ===
  const eliminarCodigo = (codigo: string) => {
    const nuevo = new Map(codigosMap);
    nuevo.delete(codigo);
    queryClient.setQueryData(["scanner-codigos"], nuevo);
  };

  // === REDUCIR CANTIDAD ===
  const reducirCantidad = (codigo: string) => {
    const nuevo = new Map(codigosMap);
    const data = nuevo.get(codigo);
    if (data && data.cantidad > 1) {
      nuevo.set(codigo, { ...data, cantidad: data.cantidad - 1 });
    } else {
      nuevo.delete(codigo);
    }
    queryClient.setQueryData(["scanner-codigos"], nuevo);
  };

  // === LIMPIAR TODO ===
  const limpiarTodo = () => {
    queryClient.setQueryData(["scanner-codigos"], new Map());
    setCodigoInput("");
    queryClient.setQueryData(["scanner-observaciones"], "");

    // Limpiar timers al limpiar todo
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
    setUltimoAgregado(null);
  };

  // === OBTENER CÓDIGOS ORDENADOS POR TIMESTAMP (MÁS RECIENTES PRIMERO) ===
  const getCodigos = (): { codigo: string; cantidad: number }[] => {
    return Array.from(codigosMap.entries())
      .map(([codigo, data]) => ({
        codigo,
        cantidad: data.cantidad,
        timestamp: data.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp) // Más recientes primero
      .map(({ codigo, cantidad }) => ({ codigo, cantidad }));
  };

  // === TOTAL ITEMS ===
  const getTotalItems = () => {
    return Array.from(codigosMap.values()).reduce(
      (acc, data) => acc + data.cantidad,
      0
    );
  };

  return {
    bodega,
    bodegas,
    codigoInput,
    setCodigoInput,
    codigos: getCodigos(),
    totalItems: getTotalItems(),
    isScanning,
    ultimoAgregado,
    alertCounter,
    observaciones,
    handleBodegaChange,
    agregarCodigo,
    eliminarCodigo,
    reducirCantidad,
    limpiarTodo,
    setObservaciones,
  };
};
