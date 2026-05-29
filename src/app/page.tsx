'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Database, Activity, GitBranch, RefreshCw, Download, Layers, Users, ChevronUp, ChevronDown, Key } from 'lucide-react';
import ConfigPanel from '@/components/config-panel';
import ThreadViewer from '@/components/thread-viewer';
import PersonaPanel from '@/components/persona-panel';
import AnalyticsPanel from '@/components/analytics-panel';
import HistorySidebar from '@/components/history-sidebar';
import ApiKeyManager from '@/components/api-key-manager';
import ToastContainer, { showToast } from '@/components/toast';
import HowToUseModal from '@/components/how-to-use-modal';
import { Info } from 'lucide-react';

type Tab = 'thread' | 'personas' | 'analytics';

export default function Home() {
  const [tab, setTab] = useState<Tab>('thread');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0=none, 1=personas, 2=llm, 3=db
  const [platform, setPlatform] = useState('youtube');
  const [personas, setPersonas] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const [logsExpanded, setLogsExpanded] = useState(true);
  const [leftWidth, setLeftWidth] = useState(340);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  // Drag to resize left panel
  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 220) newWidth = 220;
      if (newWidth > 600) newWidth = 600;
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      if (data.success) setRuns(data.runs);
    } catch (e) {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleGenerate = async (config: any) => {
    setIsGenerating(true);
    setProgressStep(1); // Building personas
    setPlatform(config.platformStyle);
    try {
      setTimeout(() => setProgressStep(2), 500); // Executing LLM pipeline
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      
      setProgressStep(3); // Saving to DB
      
      if (data.success) {
        setPersonas(data.personas);
        setComments(data.comments);
        setMetrics(data.metrics);
        setActiveRunId(data.runId);
        setTab('thread');
        await loadHistory();
        showToast('success', 'GENERATION SUCCESS', `Synthesized ${data.comments.length} comments seamlessly.`);
      } else {
        throw new Error(data.error || 'Unknown error occurred.');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || String(error);
      if (msg.includes('ACCESS_DENIED')) {
        showToast('error', 'ACCESS DENIED (403)', msg.split('ACCESS_DENIED: ')[1] || 'Your API key was rejected by the provider. Google usually flags fresh accounts.');
      } else if (msg.includes('QUOTA') || msg.includes('429')) {
        showToast('error', 'QUOTA EXCEEDED', 'Active provider key has reached its rate limit. Falling back or requires new key.');
      } else if (msg.includes('NO_API_KEY')) {
        showToast('warning', 'SYSTEM HALTED', 'No API keys configured. Open Key Manager to add a provider.');
      } else {
        showToast('error', 'SYNTHESIS FAILED', msg);
      }
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
    }
  };

  const handleSelectRun = async (id: string) => {
    try {
      const res = await fetch(`/api/threads/${id}`);
      const data = await res.json();
      if (data.success) {
        setPersonas(data.run.personas);
        setComments(data.run.comments);
        setPlatform(data.run.platformStyle);
        setActiveRunId(id);
        setMetrics({
          avgSentiment: data.run.avgSentiment,
          avgToxicity: data.run.avgToxicity,
          engagementScore: data.run.engagementScore,
          controversyIndex: data.run.controversyIndex,
        });
        setTab('thread');
      }
    } catch (e) {
      showToast('error', 'LOAD FAILED', 'Could not load historical thread run from DB.');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all historical logs? This cannot be undone.")) return;
    try {
      await fetch('/api/threads', { method: 'DELETE' });
      setRuns([]); setPersonas([]); setComments([]); setMetrics(null); setActiveRunId(null);
      showToast('info', 'PURGE COMPLETE', 'Historical thread logs deleted permanently.');
    } catch (e) {}
  };

  const handleExport = () => {
    if (!comments.length) return;
    const personaMap = new Map(personas.map(p => [p.id, p]));
    const lines = comments.map(c => `[T+${c.timestampOffset}s] [@${personaMap.get(c.personaId)?.username || 'SYS'}] ${c.content}`);
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sys_intercept_${activeRunId || 'export'}.log`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col p-4 gap-4 bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-sans">
      <ToastContainer />
      <ApiKeyManager isOpen={isKeyManagerOpen} onClose={() => setIsKeyManagerOpen(false)} />
      <HowToUseModal isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} />

      {/* Top Header */}
      <header className="term-panel flex items-center justify-between p-3 px-5 flex-shrink-0 !border-b !border-b-[var(--color-primary)]">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-[var(--color-primary)]" />
          <h1 className="text-[15px] font-bold uppercase tracking-widest text-white">ThreadForge <span className="text-[var(--color-text-dim)] font-normal ml-1">v2.0</span></h1>
          <span className="text-[10px] bg-[rgba(99,102,241,0.2)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold uppercase border border-[rgba(99,102,241,0.3)] shadow-[0_0_10px_rgba(99,102,241,0.2)]">System Active</span>
        </div>
        <div className="flex items-center gap-5 text-[11px] uppercase font-sans text-[var(--color-text-dim)] font-medium">
          <span className="flex items-center gap-1.5"><Database size={14} /> Database Connected</span>
          <span className="flex items-center gap-1.5 text-[var(--color-neon-green)]"><Activity size={14} /> Core online</span>
          <button 
            onClick={() => setIsHowToUseOpen(true)}
            className="btn-term-ghost flex items-center gap-1.5 hover:text-[var(--color-primary)] px-3 py-1.5 border border-[var(--color-border-main)] hover:border-[var(--color-primary)] transition-all bg-[rgba(255,255,255,0.02)]"
            title="How to Use Guide"
          >
            <Info size={12} /> Help
          </button>
          <button 
            onClick={() => setIsKeyManagerOpen(true)}
            className="btn-term-ghost flex items-center gap-1.5 hover:text-[var(--color-neon-amber)] px-3 py-1.5 border border-[var(--color-border-main)] hover:border-[var(--color-neon-amber)] transition-all bg-[rgba(255,255,255,0.02)]"
            title="API Key Manager"
          >
            <Key size={12} /> Keys
          </button>
          {comments.length > 0 && (
            <button onClick={handleExport} className="btn-term-ghost flex items-center gap-1.5 hover:text-[var(--color-neon-cyan)] border border-[var(--color-border-main)] hover:border-[var(--color-neon-cyan)] px-3 py-1.5 transition-all bg-[rgba(255,255,255,0.02)]">
              <Download size={12} /> Export Log
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        
        {/* Left Col: Config & History */}
        <div 
          className="flex flex-col gap-4 flex-shrink-0 h-full"
          style={{ width: `${leftWidth}px` }}
        >
          <div className="term-panel flex-1 flex flex-col overflow-hidden relative shadow-lg">
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[var(--color-primary)] to-transparent opacity-30 pointer-events-none" />
            <div className="term-header"><Layers size={14} className="text-[var(--color-primary)]" /> Parameters</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar"><ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} /></div>
          </div>
          
          <div className={`term-panel flex flex-col overflow-hidden transition-all duration-300 shadow-lg ${logsExpanded ? 'h-1/3' : 'h-[36px]'}`}>
            <div 
              className="term-header justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors !py-2"
              onClick={() => setLogsExpanded(!logsExpanded)}
            >
              <div className="flex items-center gap-2">
                {logsExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <Database size={14} className="text-[var(--color-neon-cyan)]" /> Database Logs
              </div>
              {logsExpanded && (
                <button onClick={(e) => { e.stopPropagation(); handleClearHistory(); }} className="btn-term-ghost px-2 py-0.5 text-[10px] hover:text-[var(--color-neon-red)] border border-transparent hover:border-[var(--color-neon-red)] transition-all">PURGE ALL</button>
              )}
            </div>
            {logsExpanded && (
              <div className="flex-1 overflow-y-auto custom-scrollbar"><HistorySidebar runs={runs} activeRunId={activeRunId} onSelectRun={handleSelectRun} /></div>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        <div 
          className={`drag-handle flex-shrink-0 ${isDragging ? 'bg-[var(--color-primary)]' : ''}`}
          onMouseDown={handleMouseDown}
        />

        {/* Center/Right Col: Output */}
        <div className="flex-1 term-panel flex flex-col min-w-0 shadow-xl relative overflow-hidden">
          <div className="absolute left-0 top-0 right-0 h-[1px] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-neon-cyan)] opacity-50 pointer-events-none" />
          
          <div className="flex items-center border-b border-[var(--color-border-dim)] bg-[rgba(20,22,34,0.5)] px-2 pt-2">
            <button onClick={() => setTab('thread')} className={`tab-btn flex items-center gap-2 ${tab === 'thread' ? 'active' : ''}`}>
              <GitBranch size={14} /> Intercept Feed
            </button>
            <button onClick={() => setTab('personas')} className={`tab-btn flex items-center gap-2 ${tab === 'personas' ? 'active' : ''}`}>
              <Users size={14} /> Active Agents
            </button>
            <button onClick={() => setTab('analytics')} className={`tab-btn flex items-center gap-2 ${tab === 'analytics' ? 'active' : ''}`}>
              <Activity size={14} /> Telemetry
            </button>
            
            {isGenerating ? (
              <span className="ml-auto mr-4 text-[11px] text-[var(--color-neon-amber)] uppercase flex items-center gap-2 font-medium bg-[rgba(245,158,11,0.1)] px-3 py-1 rounded-full">
                <RefreshCw size={12} className="animate-spin" /> 
                {progressStep === 1 && '[1/3] Assembling Personas...'}
                {progressStep === 2 && '[2/3] Executing LLM Pipeline...'}
                {progressStep === 3 && '[3/3] Saving to Database...'}
              </span>
            ) : comments.length > 0 ? (
              <button
                onClick={() => {
                  setComments([]);
                  setPersonas([]);
                  setMetrics(null);
                  setActiveRunId(null);
                }}
                className="btn-term-ghost ml-auto mr-4 px-3 py-1.5 text-[10px] hover:text-[var(--color-neon-red)] border border-[var(--color-border-main)] hover:border-[var(--color-neon-red)] transition-all uppercase rounded-md shadow-sm"
              >
                Clear Current Feed
              </button>
            ) : null}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {tab === 'thread' && <ThreadViewer comments={comments} personas={personas} platform={platform} />}
            {tab === 'personas' && <PersonaPanel personas={personas} comments={comments} />}
            {tab === 'analytics' && <AnalyticsPanel comments={comments} personas={personas} metrics={metrics} />}
          </div>
        </div>

      </div>
    </div>
  );
}
