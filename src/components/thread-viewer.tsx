'use client';
import { showToast } from '@/components/toast';

interface ThreadViewerProps { comments: any[]; personas: any[]; platform: string; }

function fmtTime(offset: number) { 
  const m = Math.floor(offset / 60); const s = offset % 60;
  return `T+${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export default function ThreadViewer({ comments, personas, platform }: ThreadViewerProps) {
  if (!comments.length) {
    return <div className="p-4 font-mono text-[11px] text-[var(--color-text-dim)]">WAITING FOR DATA FEED...</div>;
  }

  const personaMap = new Map(personas.map(p => [p.id, p]));
  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  const replyMap = new Map<string, any[]>();
  replies.forEach(r => { const arr = replyMap.get(r.parentId!) || []; arr.push(r); replyMap.set(r.parentId!, arr); });

  // For terminal view, we render it as a flat-ish tree, but group replies physically under their parents
  const renderComment = (c: any, depth: number = 0) => {
    const p = personaMap.get(c.personaId);
    if (!p) return null;
    const childReplies = replyMap.get(c.id) || [];
    
    // Determine sentiment color
    let sentColor = 'term-text-cyan';
    if (c.sentiment > 0.3) sentColor = 'term-text-green';
    if (c.sentiment < -0.3) sentColor = 'term-text-red';
    if (c.toxicity > 0.6) sentColor = 'term-text-amber';

    return (
      <div key={c.id} className="font-mono text-[11px] mb-2">
        <div className="flex gap-2" style={{ paddingLeft: `${Math.min(depth, 5) * 16}px` }}>
          <div className="text-[var(--color-border-bright)] select-none">
            {depth === 0 ? '▶' : '↳'}
          </div>
          <div 
            className="flex-1 min-w-0 pb-2 border-b border-[var(--color-border-dim)] cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors p-1 -m-1 rounded"
            onClick={() => {
              navigator.clipboard.writeText(c.content);
              showToast('success', 'COPIED TO CLIPBOARD', 'Comment text copied for pasting.');
            }}
            title="Click to copy comment text"
          >
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <span className={`font-bold ${sentColor}`}>@{p.username}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">[{fmtTime(c.timestampOffset)}]</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">L:{c.likes} D:{c.dislikes}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">TOX:{c.toxicity.toFixed(2)}</span>
            </div>
            <div className="text-[13px] font-sans text-[var(--color-text-main)] leading-relaxed">
              {c.content}
            </div>
          </div>
        </div>
        {childReplies.map(r => renderComment(r, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-3">
      <div className="mb-4 pb-2 border-b border-[var(--color-border-main)] font-mono text-[10px] text-[var(--color-neon-amber)] uppercase flex justify-between">
        <span>Intercept Source: {platform}</span>
        <span>Packets: {comments.length}</span>
      </div>
      {topLevel.map(c => renderComment(c))}
    </div>
  );
}
