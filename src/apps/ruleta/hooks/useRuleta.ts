import { useState, useCallback, useRef } from 'react';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';

// ⚠️ TEMPORAL: sorteo en frontend. Reemplazar por respuesta del backend.
const seleccionarPremioMock = (segments: ISegment[]): string => {
  if (segments.length === 0) return '';
  const idx = Math.floor(Math.random() * segments.length);
  return segments[idx].label;
};

const generarCupon = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'KAN-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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
        // Simulación de respuesta del backend (mock)
        const prize = seleccionarPremioMock(segments);
        const couponCode = generarCupon();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const data: IPremioResponse = {
          prize,
          couponCode,
          expiresAt: expiresAt.toISOString(),
          message: `🎉 ¡Felicidades! Has ganado ${prize}.`,
        };

        // ========== CALCULAR ÁNGULO FINAL ==========
        const numSegments = segments.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const targetIndex = segments.findIndex((seg) => seg.label === prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        // Centro del sector ganador
        const centroSector = finalIndex * arcSize + arcSize / 2;

        // ========== VELOCIDAD ANGULAR CONSTANTE ==========
        const velocidadAngular = 6 * Math.PI; // 3 vueltas por segundo (rápido)

        // Calcular el ángulo objetivo (con 5 vueltas extras iniciales)
        const vueltasExtrasIniciales = 5;
        let targetAngle = -Math.PI / 2 - centroSector + vueltasExtrasIniciales * 2 * Math.PI;

        // Asegurar que gire hacia adelante (delta positivo)
        let delta = targetAngle - rotation;
        while (delta < 0) delta += 2 * Math.PI;

        // ========== GARANTIZAR DURACIÓN MÍNIMA DE 3 SEGUNDOS ==========
        const duracionMinima = 3000; // 3 segundos
        let duracion = (delta / velocidadAngular) * 1000; // en ms

        // Si la duración es menor a la mínima, añadir vueltas completas
        while (duracion < duracionMinima) {
          delta += 2 * Math.PI; // añadir una vuelta completa
          duracion = (delta / velocidadAngular) * 1000;
        }

        const finalRotation = rotation + delta;

        // ========== ANIMACIÓN ==========
        const startRotation = rotation;
        const totalDelta = delta;
        const startTime = performance.now();

        const animate = (time: number) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duracion, 1);
          // Ease Out Quart (frenado suave)
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

        // ======== CUANDO TENGAS BACKEND REAL, REEMPLAZA ESTO ========
        /*
        const response = await fetch('http://localhost:3001/api/promociones/ruleta/girar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userEmail || 'anonimo' }),
        });
        const data = await response.json();
        // Luego la animación
        */
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

  return { rotation, isSpinning, premio, error, girar, reset };
};