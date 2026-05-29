'use client';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Users } from 'lucide-react';

interface HistorySidebarProps { runs: any[]; activeRunId: string | null; onSelectRun: (id: string) => void; }

function fmtTime(d: string) {
  const date = new Date(d);
  return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
}

export default function HistorySidebar({ runs, activeRunId, onSelectRun }: HistorySidebarProps) {
  return (
    <div className="flex flex-col gap-2 p-3 font-sans">
      {runs.length === 0 && <div className="text-[var(--color-text-dim)] p-4 text-center text-[12px] italic">No logs found in database.</div>}
      
      {runs.map((run, i) => {
        const isActive = run.id === activeRunId;
        return (
          <button key={run.id} onClick={() => onSelectRun(run.id)}
            className={`text-left p-3 border rounded-lg transition-all shadow-sm ${
              isActive 
                ? 'bg-[rgba(99,102,241,0.1)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                : 'border-[var(--color-border-main)] text-[var(--color-text-dim)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--color-primary)] hover:text-white'
            }`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-mono"><Clock size={10} /> {fmtTime(run.createdAt)}</span>
              <span className="uppercase text-[9px] font-bold bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded text-white">{run.platformStyle}</span>
            </div>
            <div className={`font-bold text-[13px] truncate ${isActive ? 'text-white' : 'text-[var(--color-text-main)]'}`}>{run.videoTitle}</div>
            <div className="flex gap-4 mt-2 text-[10px] font-medium opacity-80">
              <span className="flex items-center gap-1.5"><Users size={12} /> {run.personaCount}</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {run.commentCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
