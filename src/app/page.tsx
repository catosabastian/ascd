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
    <div className="h-screen flex flex-col p-2 pl-4 gap-2 bg-[var(--color-bg-base)]">
      <ToastContainer />
      <ApiKeyManager isOpen={isKeyManagerOpen} onClose={() => setIsKeyManagerOpen(false)} />

      {/* Top Header */}
      <header className="term-panel flex items-center justify-between p-2 flex-shrink-0 border-b-2 border-b-[var(--color-neon-cyan)]">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="term-text-cyan" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-main)]">ThreadForge <span className="term-text-dim">v2.0</span></h1>
          <span className="text-[10px] bg-[var(--color-neon-cyan)] text-black px-2 py-0.5 font-bold uppercase">System Active</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase font-mono text-[var(--color-text-dim)]">
          <span className="flex items-center gap-1"><Database size={12} /> SQLite connected</span>
          <span className="flex items-center gap-1 term-text-green"><Activity size={12} /> Core online</span>
          <button 
            onClick={() => setIsKeyManagerOpen(true)}
            className="btn-term-ghost flex items-center gap-1 hover:term-text-amber px-2 border border-[var(--color-border-main)] hover:border-[var(--color-neon-amber)]"
            title="API Key Manager"
          >
            <Key size={10} /> Keys
          </button>
          {comments.length > 0 && (
            <button onClick={handleExport} className="btn-term-ghost flex items-center gap-1 hover:term-text-cyan border border-[var(--color-border-main)] hover:border-[var(--color-neon-cyan)] px-2">
              <Download size={10} /> Dump Log
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex gap-1 min-h-0 relative">
        
        {/* Left Col: Config & History */}
        <div 
          className="flex flex-col gap-1 flex-shrink-0 border-r-2 border-r-[var(--color-border-bright)]"
          style={{ width: `${leftWidth}px` }}
        >
          <div className="term-panel flex-1 flex flex-col overflow-hidden border-l-2 border-l-[var(--color-neon-amber)] relative">
            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-[var(--color-neon-amber)] opacity-50 shadow-[0_0_8px_var(--color-neon-amber)] pointer-events-none" />
            <div className="term-header"><Layers size={12} /> Parameters</div>
            <div className="flex-1 overflow-y-auto"><ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} /></div>
          </div>
          
          <div className={`term-panel flex flex-col overflow-hidden border-l-2 border-l-[var(--color-border-main)] transition-all duration-300 ${logsExpanded ? 'h-1/3' : 'h-[28px]'}`}>
            <div 
              className="term-header justify-between cursor-pointer hover:bg-[var(--color-bg-hover)]"
              onClick={() => setLogsExpanded(!logsExpanded)}
            >
              <div className="flex items-center gap-1.5">
                {logsExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                <Database size={12} /> Logs
              </div>
              {logsExpanded && (
                <button onClick={(e) => { e.stopPropagation(); handleClearHistory(); }} className="btn-term-ghost px-1 py-0 text-[9px] hover:term-text-red">PURGE</button>
              )}
            </div>
            {logsExpanded && (
              <div className="flex-1 overflow-y-auto"><HistorySidebar runs={runs} activeRunId={activeRunId} onSelectRun={handleSelectRun} /></div>
            )}
          </div>
        </div>

        {/* Drag Handle */}
        <div 
          className={`drag-handle flex-shrink-0 ${isDragging ? 'bg-[var(--color-neon-cyan)]' : ''}`}
          onMouseDown={handleMouseDown}
        />

        {/* Center/Right Col: Output */}
        <div className="flex-1 term-panel flex flex-col min-w-0 border-r-2 border-r-[var(--color-neon-green)] relative">
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--color-neon-green)] opacity-50 shadow-[0_0_8px_var(--color-neon-green)] pointer-events-none" />
          <div className="flex items-center border-b border-[var(--color-border-main)] bg-[var(--color-bg-panel)]">
            <button onClick={() => setTab('thread')} className={`tab-btn flex items-center gap-2 ${tab === 'thread' ? 'active' : ''}`}>
              <GitBranch size={12} /> Intercept Feed
            </button>
            <button onClick={() => setTab('personas')} className={`tab-btn flex items-center gap-2 ${tab === 'personas' ? 'active' : ''}`}>
              <Users size={12} /> Active Agents
            </button>
            <button onClick={() => setTab('analytics')} className={`tab-btn flex items-center gap-2 ${tab === 'analytics' ? 'active' : ''}`}>
              <Activity size={12} /> Telemetry
            </button>
            
            {isGenerating ? (
              <span className="ml-auto mr-4 text-[10px] term-text-amber uppercase flex items-center gap-2">
                <RefreshCw size={10} className="animate-spin" /> 
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
                className="btn-term-ghost ml-auto mr-4 px-2 py-0.5 text-[9px] hover:term-text-red border border-[var(--color-border-main)] hover:border-[var(--color-neon-red)] transition-colors uppercase"
              >
                Clear Current Feed
              </button>
            ) : null}
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
            {tab === 'thread' && <ThreadViewer comments={comments} personas={personas} platform={platform} />}
            {tab === 'personas' && <PersonaPanel personas={personas} comments={comments} />}
            {tab === 'analytics' && <AnalyticsPanel comments={comments} personas={personas} metrics={metrics} />}
          </div>
        </div>

      </div>
    </div>
  );
}
