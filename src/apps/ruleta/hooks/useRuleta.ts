import { useState, useCallback, useRef } from 'react';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';

const API_URL = 'http://localhost:3001';

export const useRuleta = (segments: ISegment[], userEmail?: string) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [premio, setPremio] = useState<IPremioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const girar = useCallback(
    async (onComplete: (data: IPremioResponse) => void) => {
      if (isSpinning) return;

      setIsSpinning(true);
      setError(null);

      try {
        // Llamada al backend
        const response = await fetch(`${API_URL}/api/promociones/ruleta/girar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userEmail || 'anonimo' }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al girar la ruleta');
        }

        const data: IPremioResponse = await response.json();

        // Buscar el índice del premio para la animación
        const numSegments = segments.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const targetIndex = segments.findIndex((seg) => seg.label === data.prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        // Calcular ángulo para que caiga en el centro del sector
        let rawTarget = -(finalIndex * arcSize + arcSize / 2);
        let normalizedTarget =
          ((rawTarget % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const extraSpins = 5 + Math.floor(Math.random() * 6);
        let finalRotation = normalizedTarget + extraSpins * 2 * Math.PI;

        let delta = finalRotation - rotation;
        while (delta < 0) delta += 2 * Math.PI;
        finalRotation = rotation + delta;

        const startRotation = rotation;
        const totalDelta = finalRotation - startRotation;
        const duration = 4500 + Math.random() * 1500;
        const startTime = performance.now();

        const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          const currentAngle = startRotation + totalDelta * eased;
          setRotation(currentAngle);

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
    [isSpinning, rotation, segments, userEmail]
  );

  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsSpinning(false);
    setError(null);
  }, []);

  return { rotation, isSpinning, premio, error, girar, reset, setError };
};