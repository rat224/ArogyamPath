/**
 * ArogyamPath - PWA Icon Generator
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

// Icon sizes required for PWA
const SIZES = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
];

/**
 * Draws the ArogyamPath branded icon on a canvas
 */
function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const R = size / 2;      // Center X/Y
  const radius = size * 0.12; // Corner radius

  // --- Background: Rounded Rectangle with Green Gradient ---
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#059669');   // Emerald-600
  grad.addColorStop(1, '#065f46');   // Emerald-900
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Skip detail drawing for tiny icons (favicon)
  if (size <= 32) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.65}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', R, R + size * 0.03);
    return canvas;
  }

  // --- Medical Cross (White) in top-right area ---
  const crossSize = size * 0.18;
  const crossThickness = crossSize * 0.34;
  const crossX = size * 0.66;
  const crossY = size * 0.24;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  // Horizontal bar
  ctx.fillRect(crossX - crossSize / 2, crossY - crossThickness / 2, crossSize, crossThickness);
  // Vertical bar
  ctx.fillRect(crossX - crossThickness / 2, crossY - crossSize / 2, crossThickness, crossSize);

  // --- Letter "A" (Main Logo Mark) ---
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${size * 0.48}px Arial Black, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', R * 0.92, R * 1.12);

  // --- Subtitle "arogyapath" (small text, below A) ---
  if (size >= 192) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `bold ${size * 0.075}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('AROGYAMPATH', R, size * 0.85);
  }

  // --- Subtle bottom highlight arc ---
  const arcGrad = ctx.createLinearGradient(0, size * 0.8, 0, size);
  arcGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
  arcGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = arcGrad;
  ctx.beginPath();
  ctx.arc(R, size * 1.1, size * 0.8, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

// --- Generate and Save All Icons ---
console.log('\n ArogyamPath PWA Icon Generator\n');

SIZES.forEach(({ name, size }) => {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(publicDir, name);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Generated: ${name} (${size}x${size}px)`);
});

console.log('\n All icons generated successfully in /public folder!\n');
