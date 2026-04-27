import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Terminal, 
  Video, 
  Play, 
  RefreshCw, 
  Cpu, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Cve {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: number;
  publishedAt: string;
}

interface Project {
  id: string;
  cveId: string;
  status: string;
  title: string;
  errorReason?: string;
  cve: Cve;
}

interface DashboardProps {
  onSelectProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const [cves, setCves] = useState<Cve[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const [autopilot, setAutopilot] = useState(false);

  const fetchData = async () => {
    try {
      const [cveRes, projectRes] = await Promise.all([
        fetch('/api/cve'),
        fetch('/api/projects')
      ]);

      if (!cveRes.ok || !projectRes.ok) {
        throw new Error("Failed to fetch data endpoints");
      }

      const cvesData = await cveRes.json();
      const projectsData = await projectRes.json();
      
      setCves(cvesData);
      setProjects(projectsData);

      // Autopilot Logic: If any critical CVE exists without a project, produce it
      if (autopilot) {
        const unproduced = cvesData.filter((cve: any) => 
          cve.severity >= 9 && !projectsData.some((p: any) => p.cveId === cve.cveId)
        );
        if (unproduced.length > 0) {
          console.log(`[Autopilot] Triggering production for ${unproduced[0].cveId}`);
          handleProduce(unproduced[0].cveId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh interval for autopilot
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [autopilot]);

  const handlePoll = async () => {
    setPolling(true);
    await fetch('/api/autonomous/poll', { method: 'POST' });
    await fetchData();
    setPolling(false);
  };

  const handleProduce = async (cveId: string) => {
    await fetch('/api/autonomous/produce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cveId })
    });
    fetchData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-cyber-border pb-8">
        <div>
          <div className="flex items-center gap-3 text-cyber-red mb-2">
            <ShieldAlert className="w-8 h-8 glow-red" />
            <h1 className="text-4xl font-display font-bold tracking-tighter uppercase italic">CVE EXPLAINED STUDIO</h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Autonomous Version // Alpha 0.1</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-zinc-900 border border-cyber-border px-4 py-2">
            <span className={cn("text-[10px] font-mono tracking-widest uppercase", autopilot ? "text-cyber-red" : "text-zinc-600")}>
              {autopilot ? 'Autopilot Active' : 'Autopilot Offline'}
            </span>
            <button 
              onClick={() => setAutopilot(!autopilot)}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                autopilot ? "bg-cyber-red" : "bg-zinc-800"
              )}
            >
              <div className={cn(
                "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all",
                autopilot ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>

          <button 
            onClick={handlePoll}
            disabled={polling}
            className="flex items-center gap-2 bg-cyber-red/10 border border-cyber-red/30 px-6 py-3 rounded-none text-cyber-red hover:bg-cyber-red hover:text-white transition-all font-mono uppercase tracking-widest text-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", polling && "animate-spin")} />
            {polling ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Sentinel Insights */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyber-red" />
              SENTINEL INSIGHTS
            </h2>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Exploits Discovered</span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4"
          >
            {cves.length === 0 ? (
              <div className="border border-cyber-border p-12 text-center text-zinc-600 italic">
                No telemetry data available. Initialize scan.
              </div>
            ) : (
              cves.map((cve, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={cve.id} 
                  className="group border border-cyber-border bg-cyber-gray/50 p-5 hover:border-cyber-red/50 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyber-red opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-cyber-red font-bold text-lg">{cve.cveId}</span>
                    <span className={cn(
                      "text-[10px] px-2 py-1 border font-mono tracking-widest uppercase",
                      cve.severity >= 9 ? "border-cyber-red text-cyber-red bg-cyber-red/10" : "border-zinc-500 text-zinc-500"
                    )}>
                      Criticality: {cve.severity || 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 group-hover:text-cyber-red transition-colors">{cve.title}</h3>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-4 font-normal leading-relaxed">
                    {cve.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Published: {new Date(cve.publishedAt).toLocaleDateString()}</span>
                    <button 
                      onClick={() => handleProduce(cve.cveId)}
                      className="p-2 border border-cyber-border hover:border-cyber-red hover:bg-cyber-red group/btn transition-all"
                    >
                      <Video className="w-4 h-4 text-zinc-400 group-hover/btn:text-white" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Right Column: Production Queue */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyber-red" />
            THE FORGE
          </h2>

          <div className="space-y-4">
            {projects.length === 0 ? (
               <div className="border border-cyber-border border-dashed p-8 text-center text-zinc-600 text-xs uppercase tracking-widest">
                Forge Idle
              </div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="border border-cyber-border p-4 space-y-3 bg-cyber-gray/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-cyber-red bg-cyber-red/10 px-2 py-0.5 border border-cyber-red/20">{project.cveId}</span>
                    <div className="flex items-center gap-1.5" title={project.errorReason || undefined}>
                      {project.status === 'READY' ? <CheckCircle2 className="w-3.4 h-3.4 text-green-500" /> : 
                       project.status === 'FAILED' ? <AlertCircle className="w-3.4 h-3.4 text-cyber-red" /> :
                       <Clock className="w-3.4 h-3.4 text-yellow-500 animate-pulse" />}
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{project.status}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold uppercase truncate">{project.title}</h4>
                  {project.status === 'FAILED' && project.errorReason && (
                    <div className="text-[9px] font-mono text-cyber-red/80 line-clamp-2 bg-black/50 p-1 border border-cyber-red/20">
                      ERR: {project.errorReason}
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <button 
                      onClick={() => onSelectProject(project.id)}
                      className="flex-1 border border-cyber-border hover:bg-cyber-red/20 hover:border-cyber-red text-[10px] py-1.5 font-mono uppercase tracking-widest transition-all"
                    >
                      Studio
                    </button>
                    <button 
                      className="aspect-square border border-cyber-border hover:bg-cyber-red hover:border-cyber-red flex items-center justify-center transition-all p-1.5"
                    >
                      <Play className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] bg-matrix" />
      <div className="scanline" />
    </div>
  );
};

export default Dashboard;
