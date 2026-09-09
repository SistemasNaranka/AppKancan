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

// ============================================================
// 🎡 HOOK PRINCIPAL (ahora acepta storeId)
// ============================================================
export const useRuleta = (
  segments: ISegment[],
  userEmail?: string,
  storeId?: number | null // 👈 NUEVO PARÁMETRO
) => {
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

        // ============================================================
        // 🔄 ANIMACIÓN DE LA RULETA
        // ============================================================
        const numSegments = segments.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const targetIndex = segments.findIndex((seg) => seg.label === prize);
        const finalIndex = targetIndex !== -1 ? targetIndex : 0;

        // 🔧 Normalizar rotación a [0, 2π) para no acumular vueltas entre giros
        const rotationNorm = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        const centroSector = finalIndex * arcSize + arcSize / 2;
        const extraSpins = 5 + Math.floor(Math.random() * 6);
        const targetAngle = -Math.PI / 2 - centroSector + extraSpins * 2 * Math.PI;

        let delta = targetAngle - rotationNorm;
        while (delta < 0) delta += 2 * Math.PI;
        const finalRotation = rotationNorm + delta;

        const startRotation = rotationNorm;
        const totalDelta = finalRotation - startRotation;
        setRotation(rotationNorm); // reset del state antes de arrancar la animación
        const duration = 3000 + Math.random() * 1500;
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

        // ============================================================
        // 🔥 CUANDO TENGAS BACKEND, REEMPLAZA ESTO
        // ============================================================
        /*
        const response = await fetch('http://localhost:3001/api/promociones/ruleta/girar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userEmail || 'anonimo', storeId }),
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
    [isSpinning, rotation, segments, userEmail, storeId] // 👈 storeId añadido a dependencias
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