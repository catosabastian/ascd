'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalyticsPanelProps { comments: any[]; personas: any[]; metrics: any; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(20,22,34,0.95)] backdrop-blur-md border border-[var(--color-border-main)] rounded-lg p-3 text-[11px] font-sans shadow-xl">
      <p className="text-[var(--color-text-dim)] font-bold mb-2">[{label}]</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span className="font-medium uppercase">{p.name}</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPanel({ comments, personas, metrics }: AnalyticsPanelProps) {
  if (!comments.length || !metrics) return <div className="p-8 text-center text-[13px] text-[var(--color-text-dim)] animate-pulse">Awaiting telemetry data...</div>;

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
    <div className="p-6 flex flex-col gap-6 font-sans">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)] shadow-sm hover:border-[var(--color-primary)] transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-1">Avg Sentiment</div>
          <div className={`text-2xl font-black ${metrics.avgSentiment > 0 ? 'text-[var(--color-neon-green)] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-[var(--color-neon-red)] drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>{metrics.avgSentiment}</div>
        </div>
        <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)] shadow-sm hover:border-[var(--color-primary)] transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-1">Avg Toxicity</div>
          <div className={`text-2xl font-black ${metrics.avgToxicity > 0.5 ? 'text-[var(--color-neon-amber)] drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-[var(--color-neon-cyan)] drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]'}`}>{metrics.avgToxicity}</div>
        </div>
        <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)] shadow-sm hover:border-[var(--color-primary)] transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-1">Engagement Base</div>
          <div className="text-2xl font-black text-[var(--color-neon-cyan)] drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">{metrics.engagementScore}</div>
        </div>
        <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)] shadow-sm hover:border-[var(--color-primary)] transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)] mb-1">Controversy Index</div>
          <div className="text-2xl font-black text-[var(--color-neon-magenta)] drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">{metrics.controversyIndex}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.01)] h-[250px] flex flex-col shadow-sm">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-main)] mb-4">Sentiment & Toxicity Timeline</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sentimentData}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} domain={[-1, 1]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="sentiment" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="toxicity" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-[var(--color-border-main)] rounded-xl p-4 bg-[rgba(255,255,255,0.01)] h-[250px] flex flex-col shadow-sm">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-main)] mb-4">Engagement Distribution (Top 10 Nodes)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={engagementData}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'sans-serif' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="likes" fill="#38bdf8" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="dislikes" fill="#ef4444" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
