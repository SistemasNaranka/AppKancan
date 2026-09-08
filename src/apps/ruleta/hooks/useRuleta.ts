import { useState, useCallback, useRef } from 'react';
import { ISegment, IPremioResponse } from '../interfaces/ruleta.interface';

// ============================================================
// 🎡 MOCK DE PREMIOS (reemplázalo con tu backend cuando esté listo)
// ============================================================
const PREMIOS_MOCK = [
  { label: 'Jean de línea', weight: 10 },
  { label: 'Jean básico', weight: 10 },
  { label: 'Bonos $100k', weight: 10 },
  { label: 'Bonos $50k', weight: 10 },
  { label: 'Bonos $30k', weight: 10 },
  { label: 'Blusas básicas', weight: 10 },
  { label: 'Tote bag denim', weight: 10 },
  { label: 'Tops', weight: 10 },
  { label: 'Pañoletas', weight: 10 },
  { label: 'Bambas', weight: 10 },
];

const seleccionarPremio = (): string => {
  const total = PREMIOS_MOCK.reduce((s, p) => s + p.weight, 0);
  let random = Math.random() * total;
  for (const premio of PREMIOS_MOCK) {
    random -= premio.weight;
    if (random <= 0) return premio.label;
  }
  return PREMIOS_MOCK[0].label;
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
        // ============================================================
        // 🎲 SELECCIONAR PREMIO (MOCK)
        // ============================================================
        const prize = seleccionarPremio();
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

        const centroSector = finalIndex * arcSize + arcSize / 2;
        const extraSpins = 5 + Math.floor(Math.random() * 6);
        const targetAngle = -Math.PI / 2 - centroSector + extraSpins * 2 * Math.PI;

        let delta = targetAngle - rotation;
        while (delta < 0) delta += 2 * Math.PI;
        const finalRotation = rotation + delta;

        const startRotation = rotation;
        const totalDelta = finalRotation - startRotation;
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