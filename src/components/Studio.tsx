import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Terminal, 
  FileText, 
  Layers, 
  Share2, 
  Download,
  AlertTriangle,
  Code,
  Eye,
  MessageSquareQuote
} from 'lucide-react';
import { NarrationScript } from '../services/narration';
import VideoPreview from './VideoPreview';

interface StudioProps {
  projectId: string;
  onBack: () => void;
}

const Studio: React.FC<StudioProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        const found = data.find((p: any) => p.id === projectId);
        if (found) {
          found.scriptJson = found.script ? JSON.parse(found.script) : null;
          found.assetsJson = found.assets ? JSON.parse(found.assets) : null;
          setProject(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  if (loading) return <div className="p-20 text-center font-mono animate-pulse">Initializing Studio Metadata...</div>;
  if (!project) return <div className="p-20 text-center font-mono">Project not found.</div>;

  const script: NarrationScript = project.scriptJson;

  return (
    <div className="flex flex-col h-screen bg-cyber-black">
      {/* Top Bar */}
      <div className="border-b border-cyber-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-cyber-gray rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight uppercase italic">{project.title}</h1>
            <span className="text-[10px] font-mono text-cyber-red tracking-widest uppercase">{project.cveId} // STUDIO MODE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-cyber-border text-xs font-mono uppercase hover:bg-zinc-800 transition-all">
            <Share2 className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-cyber-red text-xs font-mono uppercase hover:bg-red-700 transition-all">
            <Download className="w-3.5 h-3.5" /> Render MP4
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script Editor */}
        <div className="w-1/3 border-r border-cyber-border overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-cyber-red">
              <MessageSquareQuote className="w-4 h-4" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Global Narration Script</h2>
            </div>
            
            {script ? (
              <div className="space-y-6">
                <div className="p-4 bg-cyber-gray/30 border-l-2 border-cyber-red">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Hook (First 5s)</span>
                  <p className="text-sm font-medium italic">"{script.hook}"</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Technical Breakdown</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{script.explanation}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Impact Analysis</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{script.impact}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Remediation</span>
                  <p className="text-sm text-green-500 font-mono leading-relaxed">{script.remediation}</p>
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 italic text-sm">Waiting for AI generation...</div>
            )}
          </section>
        </div>

        {/* Center: Canvas Preview Layer */}
        <div className="flex-1 bg-black/50 p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-red" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Autonomous Assets</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Short Preview */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Master Short (9:16)</span>
              <VideoPreview cveId={project.cveId} title={script?.title || 'Telemonitoring...'} slides={project.assetsJson?.slides || script?.slides || []} />
            </div>

            {/* Thumbnail Preview */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">YouTube Thumbnail (16:9)</span>
              <div className="aspect-video w-full border border-cyber-border bg-black relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-cyber-red animate-pulse uppercase">Rendering AI Thumbnail...</span>
                 </div>
                 {/* This would be another canvas component in a full impl */}
                 <div className="absolute bottom-4 right-4 bg-cyber-red text-white text-[10px] px-2 py-1 uppercase font-bold">
                    Generated: {script?.thumbnailText}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-auto">
            {script?.slides.map((slide, idx) => (
              <div key={idx} className="border border-cyber-border p-2 bg-cyber-gray/20 text-[10px] space-y-1">
                <span className="text-cyber-red font-bold">SLIDE {idx + 1}</span>
                <p className="truncate text-zinc-500 uppercase">{slide.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Inspector */}
        <div className="w-72 border-l border-cyber-border bg-cyber-black p-4 space-y-6">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyber-red" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Asset Metadata</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">Production Engine</span>
              <div className="text-[10px] font-mono border border-cyber-border p-2 bg-black">
                PUPPETEER_FORGE_V1
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">Voice Profile</span>
              <div className="text-[10px] font-mono border border-cyber-border p-2 bg-black">
                SYNTH_INTENSE_MALE_04
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">BPM / Rhythm Sync</span>
              <div className="text-[10px] font-mono border border-cyber-border p-2 bg-black">
                128 BPM // AGGRESSIVE
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-cyber-border">
             <button className="w-full text-center border border-cyber-red/50 text-cyber-red py-2 font-mono text-[10px] uppercase hover:bg-cyber-red hover:text-white transition-all">
                Regenerate AI Analysis
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
