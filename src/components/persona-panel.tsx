'use client';

interface PersonaPanelProps { personas: any[]; comments: any[]; }

export default function PersonaPanel({ personas, comments }: PersonaPanelProps) {
  if (!personas.length) return <div className="p-8 text-center text-[13px] text-[var(--color-text-dim)] animate-pulse">Waiting for agents to spawn...</div>;

  const commentCounts: Record<string, number> = {};
  comments.forEach(c => { commentCounts[c.personaId] = (commentCounts[c.personaId] || 0) + 1; });

  const renderMeter = (val: number, colorVar: string) => {
    return (
      <div className="h-1.5 w-full bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(val / 10) * 100}%`, backgroundColor: `var(${colorVar})` }} />
      </div>
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 font-sans">
      {personas.map((p, i) => (
        <div key={p.id} className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all">
          <div className="flex justify-between items-start border-b border-[var(--color-border-dim)] pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="term-avatar shrink-0 mt-0 !w-8 !h-8 text-[12px] bg-[rgba(99,102,241,0.1)] text-[var(--color-primary)] border-[var(--color-primary)]">
                {p.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[14px] font-bold text-white">@{p.username}</div>
                <div className="text-[10px] uppercase text-[var(--color-text-dim)] font-medium tracking-wide">{p.archetypeLabel}</div>
              </div>
            </div>
            <div className="text-[10px] font-bold bg-[rgba(99,102,241,0.1)] text-[var(--color-primary)] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
              {commentCounts[p.id] || 0} MSGS
            </div>
          </div>
          
          <div className="text-[12px] text-[var(--color-text-dim)] italic mb-4 leading-relaxed h-[36px] line-clamp-2">
            "{p.backstory}"
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[10px] uppercase text-[var(--color-text-dark)] font-bold tracking-wider">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between"><span>Grammar</span> <span>{p.grammarQuality}/10</span></div>
              {renderMeter(p.grammarQuality, '--color-neon-cyan')}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between"><span>Slang</span> <span>{p.slangDensity}/10</span></div>
              {renderMeter(p.slangDensity, '--color-neon-amber')}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between"><span>Aggro</span> <span>{p.aggressionLevel}/10</span></div>
              {renderMeter(p.aggressionLevel, '--color-neon-red')}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between"><span>Stability</span> <span>{p.emotionalStability}/10</span></div>
              {renderMeter(p.emotionalStability, '--color-neon-green')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
