'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalyticsPanelProps { comments: any[]; personas: any[]; metrics: any; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-bg-base)] border border-[var(--color-neon-cyan)] p-2 text-[10px] font-mono text-[var(--color-text-main)]">
      <p className="text-[var(--color-text-dim)] mb-1">[{label}]</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPanel({ comments, personas, metrics }: AnalyticsPanelProps) {
  if (!comments.length || !metrics) return <div className="p-4 font-mono text-[11px] text-[var(--color-text-dim)]">NO TELEMETRY DATA</div>;

  const sentimentData = comments.map(c => ({
    name: `T+${c.timestampOffset}`,
    sentiment: c.sentiment,
    toxicity: c.toxicity,
  }));

  const engagementData = comments.slice(0, 10).map(c => {
    const p = personas.find((pp:any) => pp.id === c.personaId);
    return { name: p ? p.username.slice(0, 6) : 'SYS', likes: c.likes, dislikes: c.dislikes };
  });

  return (
    <div className="p-3 flex flex-col gap-3 font-mono">
      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="border border-[var(--color-border-main)] p-2">
          <div className="text-[9px] uppercase text-[var(--color-text-dim)]">Avg Sentiment</div>
          <div className={`text-lg font-bold ${metrics.avgSentiment > 0 ? 'term-text-green' : 'term-text-red'}`}>{metrics.avgSentiment}</div>
        </div>
        <div className="border border-[var(--color-border-main)] p-2">
          <div className="text-[9px] uppercase text-[var(--color-text-dim)]">Avg Toxicity</div>
          <div className={`text-lg font-bold ${metrics.avgToxicity > 0.5 ? 'term-text-amber' : 'term-text-cyan'}`}>{metrics.avgToxicity}</div>
        </div>
        <div className="border border-[var(--color-border-main)] p-2">
          <div className="text-[9px] uppercase text-[var(--color-text-dim)]">Engagement Base</div>
          <div className="text-lg font-bold term-text-cyan">{metrics.engagementScore}</div>
        </div>
        <div className="border border-[var(--color-border-main)] p-2">
          <div className="text-[9px] uppercase text-[var(--color-text-dim)]">Controversy Index</div>
          <div className="text-lg font-bold term-text-magenta">{metrics.controversyIndex}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="border border-[var(--color-border-main)] p-2 h-[200px] flex flex-col">
        <div className="text-[10px] uppercase text-[var(--color-text-dim)] mb-2">Sentiment/Toxicity Timeline</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sentimentData}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} domain={[-1, 1]} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="stepAfter" dataKey="sentiment" stroke="#00ff41" strokeWidth={1} dot={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="toxicity" stroke="#ffb000" strokeWidth={1} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-[var(--color-border-main)] p-2 h-[200px] flex flex-col">
        <div className="text-[10px] uppercase text-[var(--color-text-dim)] mb-2">Engagement Distribution (Top 10 Nodes)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="likes" fill="#00ffff" isAnimationActive={false} />
            <Bar dataKey="dislikes" fill="#ff003c" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
