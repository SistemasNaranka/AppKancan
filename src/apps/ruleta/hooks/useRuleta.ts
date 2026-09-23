import { useState, useCallback, useRef } from 'react';
import { ISegment, IPremioResponse, IPremioResponseRaw } from '../interfaces/ruleta.interface';
import { FacturaValida } from '../page/RuletaHome';
import { createGiroRecord } from '../api/directus/write';

// Traduce errores crudos de Directus a mensajes amigables en español.
const getFriendlyErrorMessage = (error: any): string => {
  const rawMessage =
    error?.errors?.[0]?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    '';

  if (rawMessage.includes('invoice_key') && rawMessage.toLowerCase().includes('unique')) {
    return 'Esta factura ya fue utilizada. Solo se puede girar una vez por factura.';
  }

  return 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.';
};

// Normaliza la respuesta del backend a la forma canónica IPremioResponse,
// sin importar si `prize` llegó como string o como objeto anidado
// { prize, probabilidad }.
const normalizePremio = (raw: FacturaValida): IPremioResponse => {
  
  return {
    prize: raw.prize,
    couponCode: "123",
    probabilidad: raw.probabilidad,
    expiresAt: '2026'
  }
};

export const useRuleta = (
  segments: ISegment[],
  factura: FacturaValida | null,
  storeId?: number | null
) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [premio, setPremio] = useState<IPremioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const girar = useCallback(
    async (onComplete: (data: IPremioResponse) => void) => {
      if (isSpinning) return;
      if (!factura) return;

      setIsSpinning(true);
      setError(null);

      try {

        const res = await createGiroRecord(factura);

        // crear registro en directus del giro

        const data: IPremioResponse = normalizePremio(factura);

        // 2. Ubicar el gajo ganador en la ruleta visual
        const numSegments = segments.length;
        const arcSize = 360 / numSegments; // en GRADOS ahora (SVG usa grados)
        const targetIndex = segments.findIndex((seg) => seg.label === data.prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        // Normalizar rotación actual a [0, 360) para no acumular vueltas
        const rotationNorm = ((rotation % 360) + 360) % 360;

        // Ángulo del centro del gajo ganador desde arriba (indicador está arriba)
        const centroSector = finalIndex * arcSize + arcSize / 2;
        const extraSpins = 5 + Math.floor(Math.random() * 6); // 5-10 vueltas extra

        // La rueda debe rotar en sentido contrario al ángulo del gajo para que caiga arriba
        const targetAngle = -centroSector + extraSpins * 360;

        let delta = targetAngle - rotationNorm;
        while (delta < 0) delta += 360;

        const finalRotation = rotationNorm + delta;
        const startRotation = rotationNorm;
        const totalDelta = finalRotation - startRotation;
        setRotation(rotationNorm);

        const duration = 3500 + Math.random() * 1500;
        const startTime = performance.now();

        const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
          setRotation(startRotation + totalDelta * eased);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setRotation(finalRotation);
            setIsSpinning(false);
            setPremio(data);
            onComplete(data);
          }
        };
        animationRef.current = requestAnimationFrame(animate);
      } catch (err: any) {
        setIsSpinning(false);
        const friendlyMessage = getFriendlyErrorMessage(err);
        setError(friendlyMessage);
        throw new Error(friendlyMessage);
      }
    },
    [isSpinning, rotation, segments, factura, storeId]
  );

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsSpinning(false);
    setError(null);
  }, []);

  return { rotation, isSpinning, premio, error, girar, reset };
};