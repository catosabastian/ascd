'use client';
import { showToast } from '@/components/toast';
import { Copy } from 'lucide-react';

interface ThreadViewerProps { comments: any[]; personas: any[]; platform: string; }

function fmtTime(offset: number) { 
  const m = Math.floor(offset / 60); const s = offset % 60;
  return `T+${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export default function ThreadViewer({ comments, personas, platform }: ThreadViewerProps) {
  if (!comments.length) {
    return <div className="p-8 text-center text-[13px] text-[var(--color-text-dim)] animate-pulse">Waiting for data feed...</div>;
  }

  const personaMap = new Map(personas.map(p => [p.id, p]));
  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  const replyMap = new Map<string, any[]>();
  replies.forEach(r => { const arr = replyMap.get(r.parentId!) || []; arr.push(r); replyMap.set(r.parentId!, arr); });

  const handleCopyAll = () => {
    let fullText = `=== THREAD EXPORT (${platform.toUpperCase()}) ===\n\n`;
    
    const buildText = (c: any, depth: number) => {
      const p = personaMap.get(c.personaId);
      if (!p) return;
      const indent = '  '.repeat(depth);
      fullText += `${indent}[${fmtTime(c.timestampOffset)}] @${p.username}: ${c.content}\n\n`;
      const childReplies = replyMap.get(c.id) || [];
      childReplies.forEach(r => buildText(r, depth + 1));
    };

    topLevel.forEach(c => buildText(c, 0));
    navigator.clipboard.writeText(fullText);
    showToast('success', 'THREAD COPIED', 'Complete thread history copied to clipboard.');
  };

  const renderComment = (c: any, depth: number = 0) => {
    const p = personaMap.get(c.personaId);
    if (!p) return null;
    const childReplies = replyMap.get(c.id) || [];
    
    let sentColor = 'var(--color-text-main)';
    if (c.sentiment > 0.3) sentColor = 'var(--color-neon-green)';
    if (c.sentiment < -0.3) sentColor = 'var(--color-neon-red)';
    if (c.toxicity > 0.6) sentColor = 'var(--color-neon-amber)';

    return (
      <div key={c.id} className="mb-2">
        <div className="flex gap-4" style={{ paddingLeft: `${Math.min(depth, 5) * 20}px` }}>
          <div className="term-avatar mt-1">
            {p.username.substring(0, 2).toUpperCase()}
          </div>
          <div 
            className="flex-1 min-w-0 term-comment !p-4 !border-none !rounded-xl cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)' }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(c.content);
              showToast('success', 'COPIED TO CLIPBOARD', 'Comment text copied for pasting.');
            }}
            title="Click to copy comment text"
          >
            <div className="term-meta">
              <span className="term-username" style={{ color: sentColor }}>@{p.username}</span>
              <span className="term-timestamp">{fmtTime(c.timestampOffset)}</span>
              <span className="ml-2 text-[10px] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded text-[var(--color-text-dim)]">L:{c.likes} • D:{c.dislikes}</span>
              {c.toxicity > 0.5 && (
                <span className="ml-2 text-[10px] text-[var(--color-neon-amber)] font-medium bg-[rgba(245,158,11,0.1)] px-2 py-0.5 rounded">Tox: {c.toxicity.toFixed(2)}</span>
              )}
            </div>
            <div className="term-content mt-2">
              {c.content}
            </div>
          </div>
        </div>
        <div className="mt-2">
          {childReplies.map(r => renderComment(r, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 pb-4 border-b border-[var(--color-border-dim)] flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Intercept Feed</span>
          <span className="text-[11px] text-[var(--color-text-dim)]">Source: {platform} • Packets: {comments.length}</span>
        </div>
        <button onClick={handleCopyAll} className="btn-term flex items-center gap-2 shadow-md hover:shadow-lg">
          <Copy size={14} /> COPY ALL
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {topLevel.map(c => renderComment(c))}
      </div>
    </div>
  );
}
