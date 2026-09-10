import { useState, useCallback, useRef } from 'react';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';

export const useRuleta = (
  segments: ISegment[],
  documentos?: string,
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
      if (!documentos || !documentos.trim()) {
        setError('No hay factura válida para girar.');
        return;
      }

      setIsSpinning(true);
      setError(null);

      try {
        // 1. El backend decide el premio según el monto de la factura
        const response = await fetch('/api/ruleta/girar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentos: documentos.trim(), storeId }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'No se pudo girar la ruleta');
        }

        const data: IPremioResponse = await response.json();

        // 2. Ubicar el gajo ganador que devolvió el backend
        const numSegments = segments.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const targetIndex = segments.findIndex((seg) => seg.label === data.prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        // 3. Animación hasta ese gajo (rotación normalizada para no acumular)
        const rotationNorm = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const centroSector = finalIndex * arcSize + arcSize / 2;
        const extraSpins = 5 + Math.floor(Math.random() * 6);
        const targetAngle = -Math.PI / 2 - centroSector + extraSpins * 2 * Math.PI;

        let delta = targetAngle - rotationNorm;
        while (delta < 0) delta += 2 * Math.PI;

        const finalRotation = rotationNorm + delta;
        const startRotation = rotationNorm;
        const totalDelta = finalRotation - startRotation;
        setRotation(rotationNorm);

        const duration = 3000 + Math.random() * 1500;
        const startTime = performance.now();

        const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
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
        setError(err.message);
        throw err;
      }
    },
    [isSpinning, rotation, segments, documentos, storeId]
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