'use client';

import React from 'react';
import { Comment, Persona } from '@/lib/types';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid, Legend, Cell 
} from 'recharts';
import { 
  ShieldAlert, TrendingUp, AlertOctagon, Heart, User, Sparkles, 
  CornerDownRight, RefreshCw, MessageSquare, AlertTriangle
} from 'lucide-react';

function getAvatarGradient(seed: string) {
  const colors = [
    'linear-gradient(135deg, #f87171, #f43f5e)',
    'linear-gradient(135deg, #fb923c, #ea580c)',
    'linear-gradient(135deg, #fbbf24, #d97706)',
    'linear-gradient(135deg, #34d399, #059669)',
    'linear-gradient(135deg, #22d3ee, #0891b2)',
    'linear-gradient(135deg, #60a5fa, #2563eb)',
    'linear-gradient(135deg, #818cf8, #4f46e5)',
    'linear-gradient(135deg, #a78bfa, #7c3aed)',
    'linear-gradient(135deg, #f472b6, #db2777)',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface AnalyticsDashboardProps {
  comments: Comment[];
  personas: Persona[];
  metrics: {
    viralityProbability: number;
    collapseRisk: number;
    misinfoSpread: number;
    influentialCommentId: string | null;
  };
}

export function AnalyticsDashboard({ comments, personas, metrics }: AnalyticsDashboardProps) {
  // 1. Calculate Sentiment counts
  const sentimentCounts = comments.reduce((acc, c) => {
    acc[c.sentiment] = (acc[c.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = [
    { name: 'Positive', count: sentimentCounts['POSITIVE'] || 0, color: '#34d399' },
    { name: 'Neutral', count: sentimentCounts['NEUTRAL'] || 0, color: '#94a3b8' },
    { name: 'Negative', count: sentimentCounts['NEGATIVE'] || 0, color: '#f87171' },
    { name: 'Sarcastic', count: sentimentCounts['SARCASTIC'] || 0, color: '#a78bfa' },
    { name: 'Angry', count: sentimentCounts['ANGRY'] || 0, color: '#ef4444' }
  ];

  // 2. Timeline Toxicity data
  // Sort comments by their relative arrival order (temp ID or timestamp)
  const timelineData = [...comments]
    .map((c, idx) => ({
      index: idx + 1,
      name: c.persona?.name.split(' ')[0] || `User ${idx + 1}`,
      toxicity: parseFloat((c.toxicity * 100).toFixed(1)),
      likes: c.likes
    }));

  // 3. Opinion Shifts
  const shiftedComments = comments.filter(c => c.opinionShifted);

  // 4. Most Influential Comment
  const influentialComment = comments.find(c => c.id === metrics.influentialCommentId) || 
    [...comments].sort((a, b) => b.likes - a.likes)[0];

  // Circular gauge component
  const CircularGauge = ({ value, title, icon: Icon, colorClass, desc }: { 
    value: number; 
    title: string; 
    icon: React.ComponentType<any>; 
    colorClass: string;
    desc: string;
  }) => {
    const percentage = Math.round(value * 100);
    const strokeDashoffset = 251.2 - (251.2 * percentage) / 100;

    return (
      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-zinc-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className={colorClass}
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-lg font-bold text-white">{percentage}%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold mb-1">
            <Icon size={16} className="text-zinc-400" />
            <span>{title}</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 3 Circular & Radial Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CircularGauge
          value={metrics.viralityProbability}
          title="Virality Probability"
          icon={TrendingUp}
          colorClass="text-emerald-400"
          desc="Odds of this comment section driving extreme engagement levels on general recommenders."
        />

        <CircularGauge
          value={metrics.collapseRisk}
          title="Thread Collapse Risk"
          icon={AlertOctagon}
          colorClass="text-red-500"
          desc="Likelihood of the conversation degenerating into personal attacks requiring mod intervention."
        />

        {/* Custom Misinfo Meter */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <ShieldAlert size={16} className="text-amber-500" />
              <span>Misinformation Spread</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {Math.round(metrics.misinfoSpread * 100)}%
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-3">
            Velocity and volume of unverified claims or fake news propagated by conspiracy personas.
          </p>
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-850">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.misinfoSpread * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recharts Analytics: Line & Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Toxicity Heatmap Line Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            Chronological Toxicity Heatmap
          </h3>
          <div className="h-64 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">No simulation data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="index" stroke="#52525b" fontSize={10} />
                  <YAxis stroke="#52525b" domain={[0, 100]} fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                    itemStyle={{ color: '#ef4444', fontSize: '12px' }}
                    formatter={(value: any, name: any, props: any) => [`${value}%`, 'Toxicity', `User: ${props.payload.name}`]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="toxicity" 
                    stroke="#ef4444" 
                    strokeWidth={2.5}
                    dot={{ fill: '#ef4444', strokeWidth: 1 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sentiment Distribution Bar Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            Sentiment Volume Distribution
          </h3>
          <div className="h-64 w-full">
            {comments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">No simulation data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                  <YAxis stroke="#52525b" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    cursor={{ fill: '#18181b', opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Opinion Shift Tracking & Most Influential */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2/3: Opinion Shift Tracker */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <RefreshCw size={15} className="text-emerald-400 animate-spin-slow" />
            Opinion Evolution & Shift Tracker
          </h3>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {shiftedComments.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-850 rounded-lg flex flex-col items-center justify-center text-center text-zinc-500">
                <AlertTriangle size={28} className="text-zinc-600 mb-2 opacity-50" />
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Highly Polarized Thread</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                  No personas yielded or shifted their opinions. Everyone double-down on their starting beliefs.
                </p>
              </div>
            ) : (
              shiftedComments.map((c, i) => {
                const avatar = getAvatarGradient(c.persona?.name || 'Anonymous');
                return (
                  <div key={i} className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg flex gap-3 flex-col sm:flex-row items-start">
                    <div className="flex gap-2 items-center flex-shrink-0">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow flex-shrink-0"
                        style={{ background: avatar }}
                      >
                        {c.persona?.name.split(' ').map(x => x[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{c.persona?.name}</h4>
                        <p className="text-[10px] text-zinc-500">{c.persona?.occupation}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full border-t sm:border-t-0 sm:border-l border-zinc-850 sm:pl-3 pt-2 sm:pt-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase">
                        <span>Original:</span>
                        <span className="text-zinc-400 normal-case font-normal italic">
                          "{c.opinionBefore || 'No state recorded'}"
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <CornerDownRight size={13} className="text-emerald-400 flex-shrink-0" />
                        <div className="text-[11px] font-medium text-emerald-400">
                          Shifted: <span className="text-zinc-200 font-normal">"{c.opinionAfter || 'Opened up to nuance'}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1/3: Most Influential Comment */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Heart size={15} fill="#f87171" className="text-red-400" />
              Most Influential Comment
            </h3>

            {influentialComment ? (
              <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-lg space-y-3">
                {/* Persona head */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                    style={{ background: getAvatarGradient(influentialComment.persona?.name || 'Anonymous') }}
                  >
                    {influentialComment.persona?.name.split(' ').map(x => x[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{influentialComment.persona?.name}</h4>
                    <p className="text-[10px] text-zinc-500">{influentialComment.persona?.occupation}</p>
                  </div>
                </div>

                <p className="text-[12px] text-zinc-350 italic leading-relaxed line-clamp-4 select-text">
                  "{influentialComment.content}"
                </p>

                {/* Score */}
                <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 pt-1 border-t border-zinc-900">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-zinc-500" /> {influentialComment.likes} Likes</span>
                  <span>Sentiment: <span className="text-emerald-400">{influentialComment.sentiment}</span></span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600 text-xs">No influence recorded</div>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 italic mt-3 text-center border-t border-zinc-850/60 pt-3">
            Engagement computed dynamically based on platform algorithm simulations.
          </div>
        </div>
      </div>
    </div>
  );
}
