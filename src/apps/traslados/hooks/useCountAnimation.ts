import { useState, useEffect } from 'react';

export const useCountAnimation = (target: number, duration: number = 600): number => {
  const [count, setCount] = useState<number>(target);

  useEffect(() => {
    let start: number | null = null;
    const initial = count;
    const range = target - initial;

    if (range === 0) return;

    const animate = (timestamp: number): void => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      setCount(Math.round(initial + range * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      
    };
  }, [target, duration]); //correctas

  return count;
};
