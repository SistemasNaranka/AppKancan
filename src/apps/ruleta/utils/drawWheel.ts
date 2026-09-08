import { ISegment } from '../interfaces/ruleta.interface';


const COLORS = [
  '#FB7185', '#38BDF8', '#34D399', '#A78BFA', '#FBBF24',
  '#F472B6', '#22D3EE', '#FB923C', '#A3E635', '#C084FC',
];
const DARK = [
  '#E11D48', '#0284C7', '#059669', '#7C3AED', '#D97706',
  '#DB2777', '#0891B2', '#EA580C', '#65A30D', '#9333EA',
];


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
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) * 0.92;
  const s = canvas.width;


  ctx.clearRect(0, 0, canvas.width, canvas.height);


  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);


  for (let i = 0; i < numSegments; i++) {
    const start = i * arcSize;
    const end = start + arcSize;
    const mid = start + arcSize / 2;
    const base = segments[i].color || COLORS[i % COLORS.length];
    const dark = segments[i].colorDark || DARK[i % DARK.length];


    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();


    const bx = Math.cos(mid) * radius * 0.62;
    const by = Math.sin(mid) * radius * 0.62;
    const bubbleR = radius * 0.11;


    ctx.beginPath();
    ctx.arc(bx, by, bubbleR, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();


    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-rotation);
    ctx.fillStyle = dark;
    ctx.font = `800 ${radius * 0.11}px 'Poppins', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, radius * 0.008);
    ctx.restore();


    const dx = Math.cos(mid) * (radius - radius * 0.08);
    const dy = Math.sin(mid) * (radius - radius * 0.08);
    ctx.beginPath();
    ctx.arc(dx, dy, radius * 0.022, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }


  ctx.restore();


  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.stroke();


  const hubR = radius * 0.2;
  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#1976D2';
  ctx.lineWidth = 3;
  ctx.stroke();


  ctx.fillStyle = '#1976D2';
  ctx.font = `800 ${s * 0.036}px 'Poppins', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GIRA', cx, cy - s * 0.018);
  ctx.fillStyle = '#0D47A1';
  ctx.font = `600 ${s * 0.022}px 'Poppins', sans-serif`;
  ctx.fillText('y GANA', cx, cy + s * 0.02);
};

