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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.rotate(start + arcSize / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    const fontSize = Math.min(radius / 7, 22);
    ctx.font = `bold ${fontSize}px 'Segoe UI', 'Poppins', sans-serif`;
    ctx.fillText(segments[i].label, radius * 0.65, 0);
    ctx.restore();
  }

  ctx.restore();

  // Círculo central (logo K)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.13, 0, 2 * Math.PI);
  const gradient = ctx.createRadialGradient(
    centerX - 10,
    centerY - 10,
    5,
    centerX,
    centerY,
    radius * 0.15
  );
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(1, '#B8860B');
  ctx.fillStyle = gradient;
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0a0a0f';
  ctx.font = `bold ${radius * 0.12}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText('K', centerX, centerY + 2);
};