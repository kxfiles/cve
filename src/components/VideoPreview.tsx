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

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);

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

  useEffect(() => {
      if (!isPlaying && isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
      }
  }, [isPlaying, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    chunksRef.current = [];
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const stream = (canvas as any).captureStream(30);

    // Initialize Web Audio if needed to capture element audio into stream
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (!destRef.current) {
      destRef.current = audioCtxRef.current.createMediaStreamDestination();
    }
    
    if (!audioSourceRef.current && audio) {
      try {
        audioSourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
        audioSourceRef.current.connect(destRef.current);
        audioSourceRef.current.connect(audioCtxRef.current.destination);
      } catch (e) {
        console.warn("Audio Context error - recording audio might fail. Audio tags can only be connected once.", e);
      }
    }

    const tracks = stream.getVideoTracks();
    if (destRef.current) {
       tracks.push(...destRef.current.stream.getAudioTracks());
    }

    const combinedStream = new MediaStream(tracks);
    try {
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }
        const recorder = new MediaRecorder(combinedStream, options);
        
        recorder.ondataavailable = e => {
           if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${cveId}-shorts-ready.webm`;
          a.click();
          URL.revokeObjectURL(url);
          setIsRecording(false);
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start();
    } catch (e) {
        console.error("Failed to start MediaRecorder", e);
        setIsRecording(false);
        alert("Recording failed. Check browser support.");
        return;
    }

    setCurrentSlideIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="relative aspect-[9/16] w-full max-w-sm mx-auto border-4 border-cyber-border bg-black shadow-2xl overflow-hidden group">
      <canvas 
        ref={canvasRef} 
        width={1080} 
        height={1920} 
        className="w-full h-full object-contain"
      />
      <audio ref={audioRef} crossOrigin="anonymous" className="hidden" />
      
      <div className="absolute top-4 left-4 font-mono text-[10px] text-zinc-400 bg-black/60 px-2 py-1 flex items-center gap-2 z-10 border border-cyber-border">
         {isRecording && <div className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />}
         {isRecording ? 'RECORDING V_OUT' : isPlaying ? 'PLAYING BACK' : 'READY'} // 1080x1920 HD
      </div>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
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
            className="flex items-center justify-center w-48 gap-2 bg-zinc-900 border border-cyber-border hover:bg-zinc-800 text-white font-mono text-sm px-6 py-3 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,0,0,0.2)]"
          >
              {isPlaying ? 'Stop Preview' : 'Play Sequence'}
          </button>

          <button 
            onClick={startRecording}
            disabled={isPlaying || isRecording}
            className="flex items-center justify-center w-48 gap-2 bg-cyber-red/10 border border-cyber-red hover:bg-cyber-red hover:text-white text-cyber-red font-mono text-sm px-6 py-3 uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,0,0.2)]"
          >
              {isRecording ? 'Exporting...' : 'Export Video'}
          </button>
      </div>
    </div>
  );
};

export default VideoPreview;

