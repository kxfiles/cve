import React, { useRef, useEffect } from 'react';
import { CveRenderer } from '../lib/cve-renderer';

interface VideoPreviewProps {
  title: string;
  subtitle: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ title, subtitle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new CveRenderer(ctx, { width: canvas.width, height: canvas.height, theme: 'CYBER' });

    let animationId: number;
    const render = () => {
      renderer.drawAlertSlide(title, subtitle);
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [title, subtitle]);

  return (
    <div className="relative aspect-[9/16] w-full max-w-sm mx-auto border-4 border-cyber-border bg-black shadow-2xl overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={1080} 
        height={1920} 
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 font-mono text-[8px] text-cyber-red animate-pulse">
        REC // 60FPS // 1080p
      </div>
    </div>
  );
};

export default VideoPreview;
