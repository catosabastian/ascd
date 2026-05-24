'use client';

interface PersonaPanelProps { personas: any[]; comments: any[]; }

export default function PersonaPanel({ personas, comments }: PersonaPanelProps) {
  if (!personas.length) return <div className="p-4 font-mono text-[11px] text-[var(--color-text-dim)]">NO ACTIVE AGENTS</div>;

  const commentCounts: Record<string, number> = {};
  comments.forEach(c => { commentCounts[c.personaId] = (commentCounts[c.personaId] || 0) + 1; });

  const renderMeter = (val: number, colorClass: string) => {
    const filled = Math.floor(val);
    const empty = 10 - filled;
    return (
      <span className="inline-flex">
        <span className={colorClass}>{'█'.repeat(filled)}</span>
        <span className="text-[var(--color-border-main)]">{'█'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <div className="p-2 grid grid-cols-1 lg:grid-cols-2 gap-2 font-mono">
      {personas.map((p, i) => (
        <div key={p.id} className="border border-[var(--color-border-main)] p-2 bg-[var(--color-bg-base)]">
          <div className="flex justify-between items-start border-b border-[var(--color-border-main)] pb-1 mb-2">
            <div>
              <div className="text-[12px] font-bold term-text-cyan">@{p.username}</div>
              <div className="text-[9px] uppercase text-[var(--color-text-dim)]">{p.archetypeLabel} // {p.emotionalBehavior}</div>
            </div>
            <div className="text-[9px] border border-[var(--color-neon-amber)] text-[var(--color-neon-amber)] px-1">
              PKTS: {commentCounts[p.id] || 0}
            </div>
          </div>
          
          <div className="text-[10px] text-[var(--color-text-main)] italic mb-2 leading-tight opacity-80">
            "{p.backstory}"
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] uppercase text-[var(--color-text-dim)]">
            <div className="flex justify-between">
              <span>Grammar</span>
              {renderMeter(p.grammarQuality, 'term-text-cyan')}
            </div>
            <div className="flex justify-between">
              <span>Slang</span>
              {renderMeter(p.slangDensity, 'term-text-amber')}
            </div>
            <div className="flex justify-between">
              <span>Aggro</span>
              {renderMeter(p.aggressionLevel, 'term-text-red')}
            </div>
            <div className="flex justify-between">
              <span>Stability</span>
              {renderMeter(p.emotionalStability, 'term-text-green')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
