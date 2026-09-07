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
        // ⚠️ SIMULACIÓN TEMPORAL — borrar cuando exista el backend.
        // El premio real DEBE venir del backend (nunca decidirse en el front).
        await new Promise((r) => setTimeout(r, 300));
        const premioSimulado = segments[Math.floor(Math.random() * segments.length)];
        const data: IPremioResponse = { prize: premioSimulado.label } as IPremioResponse;

        // --- BACKEND REAL (descomentar cuando esté listo y borrar la simulación de arriba) ---
        // const response = await fetch(`${API_URL}/api/promociones/ruleta/girar`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ userEmail: userEmail || 'anonimo' }),
        // });
        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.message || 'Error al girar la ruleta');
        // }
        // const data: IPremioResponse = await response.json();

        const numSegments = segments.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const targetIndex = segments.findIndex((seg) => seg.label === data.prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        const fullTurn = 2 * Math.PI;
        const startRotation = ((rotation % fullTurn) + fullTurn) % fullTurn;

        const targetAngle = ((-(finalIndex * arcSize + arcSize / 2)) % fullTurn + fullTurn) % fullTurn;
        const extraSpins = 5 + Math.floor(Math.random() * 3);
        let delta = targetAngle - startRotation;
        if (delta < 0) delta += fullTurn;
        const totalDelta = delta + extraSpins * fullTurn;
        const finalRotation = startRotation + totalDelta;

        const duration = 4500 + Math.random() * 1500;
        const startTime = performance.now();

        const animate = (time: number) => {
          const progress = Math.min((time - startTime) / duration, 1);
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