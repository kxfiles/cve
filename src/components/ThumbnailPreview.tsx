import React, { useRef, useEffect } from 'react';
import { CveRenderer } from '../lib/cve-renderer';

interface ThumbnailPreviewProps {
  cveId: string;
  headline: string;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ cveId, headline }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new CveRenderer(canvasRef.current);
    renderer.drawThumbnail(cveId, headline);
  }, [cveId, headline]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${cveId}-thumbnail.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative group cursor-pointer border-4 border-cyber-border bg-black overflow-hidden shadow-2xl" onClick={download}>
      <canvas ref={canvasRef} width={1280} height={720} className="w-full object-contain aspect-video" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
        <span className="bg-cyber-red text-white px-6 py-3 font-mono text-sm uppercase font-bold tracking-widest border border-white/20">
          Download Thumbnail (PNG)
        </span>
      </div>
    </div>
  );
};
