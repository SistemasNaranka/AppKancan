import { ISegment } from '../interfaces/ruleta.interface';

export const drawWheel = (
  canvas: HTMLCanvasElement | null,
  segments: ISegment[],
  rotation: number
) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const numSegments = segments.length;
  const arcSize = (2 * Math.PI) / numSegments;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) * 0.88;

  // Fondo blanco
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  for (let i = 0; i < numSegments; i++) {
    const start = i * arcSize;
    const end = start + arcSize;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = segments[i].color;
    ctx.fill();

    // Borde dorado
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // (Opcional) Puedes descomentar la siguiente línea si quieres mostrar el nombre del premio durante la animación
    // Pero como hemos acordado, no mostramos texto en la ruleta.
  }

  ctx.restore();

  // Círculo central con la "K"
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.14, 0, 2 * Math.PI);
  const gradient = ctx.createRadialGradient(
    centerX - 8,
    centerY - 8,
    5,
    centerX,
    centerY,
    radius * 0.16
  );
  gradient.addColorStop(0, '#004680');
  gradient.addColorStop(1, '#003366');
  ctx.fillStyle = gradient;
  ctx.shadowColor = 'rgba(0, 70, 128, 0.5)';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${radius * 0.12}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText('K', centerX, centerY + 1);
};