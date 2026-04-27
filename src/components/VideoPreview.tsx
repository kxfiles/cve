import React, { useRef, useEffect, useState } from 'react';
import { CveRenderer } from '../lib/cve-renderer';

interface Slide {
  type: string;
  title: string;
  description: string;
  audioPath?: string;
}

interface VideoPreviewProps {
  cveId: string;
  title: string;
  slides: Slide[];
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ cveId, title, slides = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new CveRenderer(ctx, { width: canvas.width, height: canvas.height, theme: 'CYBER' });

    let animationId: number;
    const render = () => {
      if (slides.length > 0 && currentSlideIndex < slides.length) {
         const slide = slides[currentSlideIndex];
         renderer.drawShortSlide(slide.type, slide.title, cveId);
      } else {
         renderer.drawAlertSlide(cveId, title);
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [cveId, title, slides, currentSlideIndex]);

  useEffect(() => {
      if (isPlaying && slides.length > 0 && currentSlideIndex < slides.length) {
          const slide = slides[currentSlideIndex];
          if (slide.audioPath && audioRef.current) {
              audioRef.current.src = slide.audioPath;
              audioRef.current.play().catch(console.error);
              
              audioRef.current.onended = () => {
                  if (currentSlideIndex < slides.length - 1) {
                      setCurrentSlideIndex(prev => prev + 1);
                  } else {
                      setIsPlaying(false);
                      setCurrentSlideIndex(0);
                  }
              };
          } else {
              // Mock advancing if no audio (fallback)
              const timer = setTimeout(() => {
                  if (currentSlideIndex < slides.length - 1) {
                      setCurrentSlideIndex(prev => prev + 1);
                  } else {
                      setIsPlaying(false);
                      setCurrentSlideIndex(0);
                  }
              }, 3000);
              return () => clearTimeout(timer);
          }
      }
  }, [isPlaying, currentSlideIndex, slides]);

  return (
    <div className="relative aspect-[9/16] w-full max-w-sm mx-auto border-4 border-cyber-border bg-black shadow-2xl overflow-hidden group">
      <canvas 
        ref={canvasRef} 
        width={1080} 
        height={1920} 
        className="w-full h-full object-contain"
      />
      <audio ref={audioRef} className="hidden" />
      
      <div className="absolute top-4 left-4 font-mono text-[8px] text-cyber-red animate-pulse">
        {isPlaying ? '▶ PLAYING' : 'READY'} // 1080x1920
      </div>

      <button 
        onClick={() => {
            if (!isPlaying) {
                setCurrentSlideIndex(0);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
                if (audioRef.current) audioRef.current.pause();
            }
        }}
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
          <div className="bg-cyber-red text-white font-mono text-xs px-6 py-2 uppercase font-bold">
              {isPlaying ? 'Stop' : 'Play Sequence'}
          </div>
      </button>
    </div>
  );
};

export default VideoPreview;

