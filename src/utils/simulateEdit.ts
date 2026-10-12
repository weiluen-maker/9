/**
 * Canvas Image Simulation Renderer
 * Applies styled filters and lighting directly onto uploaded image
 * Used for instant preview and testing when API quota is exhausted
 */

export async function simulateImageEdit(
  sourceImage: string,
  presetId: string | null,
  prompt: string,
  ratio: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let targetW = img.naturalWidth || 800;
      let targetH = img.naturalHeight || 800;

      // Adjust dimensions according to aspect ratio
      if (ratio === '1:1') {
        const size = Math.min(targetW, targetH);
        targetW = size;
        targetH = size;
      } else if (ratio === '16:9') {
        targetH = Math.round((targetW * 9) / 16);
      } else if (ratio === '9:16') {
        targetW = Math.round((targetH * 9) / 16);
      } else if (ratio === '4:3') {
        targetH = Math.round((targetW * 3) / 4);
      } else if (ratio === '3:4') {
        targetW = Math.round((targetH * 3) / 4);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceImage);
        return;
      }

      // 1. Draw base cropped image
      const srcAspect = (img.naturalWidth || 800) / (img.naturalHeight || 800);
      const targetAspect = targetW / targetH;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (srcAspect > targetAspect) {
        sw = img.naturalHeight * targetAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / targetAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // 2. Apply artistic preset color grading overlay
      if (presetId === 'cyberpunk-neon' || prompt.includes('霓虹') || prompt.includes('賽博')) {
        // Cyberpunk dual-tone gradient
        const grad = ctx.createLinearGradient(0, 0, targetW, targetH);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)'); // Cyan
        grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)'); // Violet
        grad.addColorStop(1, 'rgba(236, 72, 153, 0.35)'); // Magenta
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetW, targetH);

        // Vignette
        const rad = ctx.createRadialGradient(targetW / 2, targetH / 2, targetW * 0.2, targetW / 2, targetH / 2, targetW * 0.7);
        rad.addColorStop(0, 'rgba(0,0,0,0)');
        rad.addColorStop(1, 'rgba(11, 15, 30, 0.6)');
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (presetId === 'cinematic-teal-orange' || prompt.includes('電影') || prompt.includes('Teal')) {
        // Teal & Orange Hollywood cinema
        ctx.globalCompositeOperation = 'color-burn';
        ctx.fillStyle = 'rgba(14, 116, 144, 0.3)'; // Teal shadows
        ctx.fillRect(0, 0, targetW, targetH);

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)'; // Orange highlights
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (presetId === 'anime-makoto' || prompt.includes('動漫') || prompt.includes('新海誠')) {
        // Bright watercolor anime air
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(0, 0, targetW, targetH);

        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (presetId === 'fuji-film' || prompt.includes('膠片') || prompt.includes('富士')) {
        // Vintage Fuji Warm Film
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = 'rgba(180, 83, 9, 0.25)';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (presetId === 'studio-clean' || prompt.includes('棚拍') || prompt.includes('白底')) {
        // Studio Softbox lighting
        const softbox = ctx.createRadialGradient(targetW / 2, targetH * 0.2, 50, targetW / 2, targetH * 0.5, targetW * 0.8);
        softbox.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        softbox.addColorStop(1, 'rgba(15, 23, 42, 0.4)');
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = softbox;
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        // General AI enhancement boost
        ctx.globalCompositeOperation = 'soft-light';
        const generalGrad = ctx.createLinearGradient(0, 0, targetW, targetH);
        generalGrad.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
        generalGrad.addColorStop(1, 'rgba(6, 182, 212, 0.25)');
        ctx.fillStyle = generalGrad;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.globalCompositeOperation = 'source-over';
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = (e) => reject(e);
    img.src = sourceImage;
  });
}
