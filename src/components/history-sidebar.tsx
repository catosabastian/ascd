'use client';
import { motion } from 'framer-motion';

interface HistorySidebarProps { runs: any[]; activeRunId: string | null; onSelectRun: (id: string) => void; }

function fmtTime(d: string) {
  const date = new Date(d);
  return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
}

export default function HistorySidebar({ runs, activeRunId, onSelectRun }: HistorySidebarProps) {
  return (
    <div className="flex flex-col gap-1 p-2 font-mono text-[10px]">
      {runs.length === 0 && <div className="text-[var(--color-text-dim)] p-2">NO LOGS FOUND.</div>}
      
      {runs.map((run, i) => {
        const isActive = run.id === activeRunId;
        return (
          <button key={run.id} onClick={() => onSelectRun(run.id)}
            className={`text-left p-2 border transition-all ${
              isActive 
                ? 'bg-[var(--color-bg-hover)] border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]' 
                : 'border-[var(--color-border-main)] text-[var(--color-text-dim)] hover:border-[var(--color-border-bright)] hover:text-[var(--color-text-main)]'
            }`}>
            <div className="flex justify-between mb-1">
              <span>[{fmtTime(run.createdAt)}]</span>
              <span className="uppercase text-[9px]">{run.platformStyle}</span>
            </div>
            <div className="font-sans font-bold text-[11px] truncate uppercase">{run.videoTitle}</div>
            <div className="flex gap-3 mt-1 text-[9px] opacity-70">
              <span>USR:{run.personaCount}</span>
              <span>MSG:{run.commentCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
