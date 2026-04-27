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
  MessageSquareQuote,
  MonitorPlay // Replaced Youtube with MonitorPlay
} from 'lucide-react';
import { NarrationScript } from '../services/narration';
import VideoPreview from './VideoPreview';
import { ThumbnailPreview } from './ThumbnailPreview'; // Import the new ThumbnailPreview

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
    
    const interval = setInterval(() => {
      if (project?.status !== 'READY' && project?.status !== 'FAILED') {
        fetchProject();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [projectId, project?.status]);

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
            <Share2 className="w-3.5 h-3.5" /> Export All
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
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Master Short (9:16)</span>
                 <span className="text-[9px] font-mono text-cyber-red italic">Click 'Export Video' to render MP4/WebM to disk</span>
              </div>
              <VideoPreview cveId={project.cveId} title={script?.title || 'Telemonitoring...'} slides={project.assetsJson?.slides || script?.slides || []} />
            </div>

            {/* Thumbnail Preview */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">YouTube Thumbnail (16:9)</span>
                  <span className="text-[9px] font-mono text-cyber-red italic">Hover & Click to download PNG overlay</span>
              </div>
              {script?.thumbnailText ? (
                 <ThumbnailPreview cveId={project.cveId} headline={script.thumbnailText} />
              ) : (
                  <div className="aspect-video w-full border border-cyber-border bg-black relative">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-cyber-red animate-pulse uppercase">Rendering AI Thumbnail...</span>
                     </div>
                  </div>
              )}
            </div>
          </div>
          
          {project.status === 'READY' && script && (
            <div className="mt-12 border border-cyber-border bg-black p-6">
              <h3 className="text-cyber-red font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <MonitorPlay className="w-5 h-5"/> Auto-Publish Toolkit
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">YouTube Title</label>
                    <input 
                      readOnly 
                      value={script.title} 
                      className="w-full bg-zinc-900 border border-cyber-border p-3 text-white font-mono text-xs focus:outline-none" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">YouTube Description</label>
                    <textarea 
                      readOnly 
                      rows={8} 
                      value={`${script.hook}\n\nWhat happened?\n${script.explanation}\n\nImpact:\n${script.impact}\n\nFix it:\n${script.remediation}\n\n#CyberSecurity #CVE #${project.cveId.replace('-', '')} #InfoSec #CyberShorts`} 
                      className="w-full bg-zinc-900 border border-cyber-border p-3 text-white font-mono text-xs focus:outline-none resize-none" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col justify-center border border-dashed border-cyber-border p-6 bg-cyber-red/5">
                  <div className="text-sm font-mono text-zinc-300 space-y-4 text-center">
                    <h4 className="text-white font-bold uppercase border-b border-cyber-border pb-2 inline-block">Publishing Workflow</h4>
                    <ul className="space-y-3 text-xs text-left inline-block mt-4 font-mono w-full">
                      <li className="flex items-center gap-2 w-full"><div className="bg-cyber-red w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold">1</div> Download Thumbnail PNG</li>
                      <li className="flex items-center gap-2 w-full"><div className="bg-cyber-red w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold">2</div> Export full video to MP4/WebM</li>
                      <li className="flex items-center gap-2 w-full"><div className="bg-cyber-red w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold">3</div> Copy metadata to clipboard</li>
                      <li className="flex items-center gap-2 w-full"><div className="bg-cyber-red w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold">4</div> Upload & Publish!</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => window.open('https://studio.youtube.com/', '_blank')} 
                    className="mt-8 bg-cyber-red hover:bg-cyber-red text-white py-4 px-6 font-mono font-bold uppercase tracking-widest hover:bg-red-600 transition-colors w-full flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                  >
                    <MonitorPlay className="w-5 h-5"/> Launch YouTube Studio
                  </button>
                </div>
              </div>
            </div>
          )}
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
              <div className="text-[10px] font-mono border border-cyber-border p-2 bg-black text-cyber-red line-clamp-1">
                FORGE_V1 + CANV_REC
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">Voice Profile</span>
              <div className="text-[10px] font-mono border border-cyber-border p-2 bg-black text-cyber-red">
                SYNTH_TTS_GOOGLE_API
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
