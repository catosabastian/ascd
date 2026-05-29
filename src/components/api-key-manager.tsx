'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Key, Lock, Unlock, AlertTriangle, Check, Trash2, Plus, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { PROVIDERS } from '@/lib/provider';

const PIN = '123456';

const PROVIDER_INFO: Record<string, { label: string; color: string; placeholder: string }> = {
  gemini: { label: 'GEMINI', color: 'var(--color-neon-amber)', placeholder: 'AIzaSy...' },
  openai: { label: 'OPENAI', color: 'var(--color-neon-green)', placeholder: 'sk-proj-...' },
  groq:   { label: 'GROQ',   color: 'var(--color-neon-cyan)',  placeholder: 'gsk_...' },
  openrouter: { label: 'OPENROUTER', color: 'var(--color-neon-magenta)', placeholder: 'sk-or-v1-...' },
  github: { label: 'GITHUB', color: '#8b5cf6', placeholder: 'ghp_...' },
};

interface ApiKeyData {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  selectedModel?: string;
  isActive: boolean;
  isSelected: boolean;
  isExhausted: boolean;
  lastUsedAt: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyManager({ isOpen, onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [collapsedProviders, setCollapsedProviders] = useState<Record<string, boolean>>({
    gemini: false,
    openai: true,
    groq: true,
    openrouter: true,
    github: false,
  });

  const toggleCollapse = (prov: string) => {
    setCollapsedProviders(prev => ({ ...prev, [prov]: !prev[prov] }));
  };

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) fetchKeys();
  }, [isOpen, fetchKeys]);

  const handleUnlock = () => {
    if (pin === PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1500);
    }
    setPin('');
  };

  const handleSelect = async (id: string) => {
    setSwitchingId(id);
    try {
      await fetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isSelected: true }),
      });
      await fetchKeys();
    } catch {}
    setTimeout(() => setSwitchingId(null), 300);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) { setEditingId(null); return; }
    setLoading(true);
    try {
      await fetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, keyValue: editValue }),
      });
      await fetchKeys();
    } catch {}
    setEditingId(null);
    setEditValue('');
    setLoading(false);
  };

  const handleAddKey = async (provider: string) => {
    if (!newKeyValue.trim()) { setAddingProvider(null); return; }
    setLoading(true);
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, keyValue: newKeyValue, label: `${provider} key` }),
      });
      await fetchKeys();
    } catch {}
    setAddingProvider(null);
    setNewKeyValue('');
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchKeys();
    } catch {}
    setLoading(false);
  };

  const handleResetExhaustion = async (id: string) => {
    try {
      await fetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resetExhaustion: true }),
      });
      await fetchKeys();
    } catch {}
  };

  const handleModelChange = async (id: string, selectedModel: string) => {
    try {
      // Optimistic update
      setKeys(keys => keys.map(k => k.id === id ? { ...k, selectedModel } : k));
      await fetch('/api/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, selectedModel }),
      });
      await fetchKeys();
    } catch {}
  };

  if (!isOpen) return null;

  const selectedKey = keys.find(k => k.isSelected);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] max-w-[100vw] z-50 bg-[var(--color-bg-panel)] shadow-2xl flex flex-col animate-slide-in border-l border-[var(--color-border-main)] box-border">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-main)] bg-[var(--color-bg-header)]">
          <div className="flex items-center gap-3 text-[14px] uppercase tracking-wider font-sans font-bold">
            <Key size={18} className="text-[var(--color-primary)]" />
            <span className="text-white">API Key Manager</span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-white transition-colors bg-[rgba(255,255,255,0.05)] p-1 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            
            {/* Active Provider Pill Switcher */}
            <div>
              <div className="text-[11px] uppercase tracking-wider font-sans font-bold text-[var(--color-text-dim)] mb-3">Active Provider</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROVIDER_INFO).map(([prov, info]) => {
                  const provKeys = keys.filter(k => k.provider === prov && k.isActive);
                  const isActive = selectedKey?.provider === prov;
                  const hasKey = provKeys.length > 0;
                  return (
                    <button
                      key={prov}
                      onClick={() => {
                        const key = provKeys.find(k => !k.isExhausted) || provKeys[0];
                        if (key) handleSelect(key.id);
                      }}
                      disabled={!hasKey}
                      className={`
                        relative flex-1 min-w-[30%] py-2.5 px-2 text-[10px] font-sans uppercase tracking-wider rounded-lg transition-all duration-200 border
                        ${isActive 
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold' 
                          : hasKey 
                            ? 'bg-[rgba(255,255,255,0.03)] text-[var(--color-text-dim)] border-[var(--color-border-main)] hover:border-[var(--color-primary)] hover:text-white cursor-pointer'
                            : 'bg-transparent text-[var(--color-border-bright)] border-[var(--color-border-dim)] cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      {switchingId && isActive && <RefreshCw size={12} className="inline mr-1 animate-spin" />}
                      <span className="truncate">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keys List by Provider */}
            <div className="space-y-3">
              {Object.entries(PROVIDER_INFO).map(([prov, info]) => {
                const provKeys = keys.filter(k => k.provider === prov);
                const isCollapsed = collapsedProviders[prov];
                return (
                  <div key={prov} className="border border-[var(--color-border-main)] bg-[rgba(0,0,0,0.2)] rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between px-4 py-3 bg-[rgba(255,255,255,0.02)] cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                      onClick={() => toggleCollapse(prov)}
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? <ChevronRight size={14} className="text-[var(--color-text-dim)]" /> : <ChevronDown size={14} className="text-[var(--color-text-dim)]" />}
                        <div className="w-2.5 h-2.5 rounded-full shadow-md" style={{ background: info.color }} />
                        <span className="text-[12px] font-sans font-bold uppercase tracking-wider text-white">
                          {info.label}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-dark)] font-medium">
                          ({provKeys.length})
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCollapsedProviders(prev => ({ ...prev, [prov]: false })); setAddingProvider(prov); setNewKeyValue(''); }}
                        className="btn-term-ghost !px-2 !py-1 text-[10px] flex items-center gap-1 text-[var(--color-primary)] hover:bg-[rgba(99,102,241,0.1)]"
                      >
                        <Plus size={12} /> ADD
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-[var(--color-border-dim)]">
                      {provKeys.map(k => (
                        <div key={k.id} className={`px-4 py-3 transition-colors ${k.isSelected ? 'bg-[rgba(99,102,241,0.05)]' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {k.isSelected && (
                                <span className="text-[9px] font-sans bg-[var(--color-primary)] text-white px-2 py-0.5 rounded uppercase font-bold shadow-sm">
                                  Active
                                </span>
                              )}
                              {k.isExhausted && (
                                <span className="text-[9px] font-sans bg-[var(--color-neon-red)] text-white px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1 shadow-sm">
                                  <AlertTriangle size={10} /> Exhausted
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {k.isExhausted && (
                                <button onClick={() => handleResetExhaustion(k.id)} className="btn-term-ghost !p-1 text-[10px] hover:text-[var(--color-neon-amber)]" title="Reset">
                                  <RefreshCw size={12} />
                                </button>
                              )}
                              {!k.isSelected && (
                                <button onClick={() => handleSelect(k.id)} className="btn-term-ghost !p-1 text-[10px] hover:text-[var(--color-neon-green)]" title="Select">
                                  <Check size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingId(k.id); setEditValue(''); }}
                                className="btn-term-ghost !px-2 !py-1 text-[10px] hover:text-[var(--color-neon-cyan)]"
                              >
                                Edit
                              </button>
                              <button onClick={() => handleDelete(k.id)} className="btn-term-ghost !p-1 text-[10px] hover:text-[var(--color-neon-red)]">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {editingId === k.id ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(k.id)}
                                placeholder={`Paste new ${prov} key...`}
                                className="flex-1 text-[11px]"
                                autoFocus
                              />
                              <button onClick={() => handleSaveEdit(k.id)} className="btn-term !px-3" disabled={loading}>
                                Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="btn-term-ghost !px-2">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="text-[12px] font-mono text-[var(--color-text-dim)] tracking-wider bg-[rgba(0,0,0,0.3)] p-2 rounded border border-[var(--color-border-dim)]">
                                {k.maskedKey}
                              </div>
                              <div className="flex items-center gap-3 mt-1 bg-[rgba(255,255,255,0.02)] p-2 rounded">
                                <span className="text-[10px] text-[var(--color-text-dim)] font-bold uppercase">Model:</span>
                                <select 
                                  value={k.selectedModel || PROVIDERS[prov as keyof typeof PROVIDERS]?.defaultModel}
                                  onChange={(e) => handleModelChange(k.id, e.target.value)}
                                  className="flex-1 bg-transparent border-none text-[11px] text-white p-0 focus:ring-0 cursor-pointer"
                                  style={{ backgroundImage: 'none' }}
                                >
                                  {PROVIDERS[prov as keyof typeof PROVIDERS]?.models.map(m => (
                                    <option key={m} value={m} className="bg-[var(--color-bg-panel)]">{m}</option>
                                  ))}
                                </select>
                                <ChevronDown size={12} className="text-[var(--color-text-dim)] pointer-events-none" />
                              </div>
                            </div>
                          )}

                          {k.lastUsedAt && (
                            <div className="text-[10px] text-[var(--color-text-dark)] mt-3 font-sans italic">
                              Last used: {new Date(k.lastUsedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add new key inline */}
                      {addingProvider === prov && (
                        <div className="px-4 py-3 bg-[rgba(99,102,241,0.05)] border-t border-[var(--color-border-dim)]">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newKeyValue}
                              onChange={e => setNewKeyValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddKey(prov)}
                              placeholder={info.placeholder}
                              className="flex-1 text-[11px]"
                              autoFocus
                            />
                            <button onClick={() => handleAddKey(prov)} className="btn-term !px-3" disabled={loading}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => setAddingProvider(null)} className="btn-term-ghost !px-2">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {provKeys.length === 0 && addingProvider !== prov && (
                        <div className="px-4 py-4 text-[11px] text-[var(--color-text-dark)] font-sans italic text-center">
                          No keys configured
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info footer */}
            <div className="text-[11px] text-[var(--color-text-dim)] font-sans leading-relaxed border-t border-[var(--color-border-dim)] pt-4 mt-4 space-y-1">
              <p className="flex items-center gap-2"><Lock size={12} className="text-[#10b981]" /> Keys are AES-256 encrypted at rest</p>
              <p className="flex items-center gap-2"><RefreshCw size={12} className="text-[#38bdf8]" /> Auto-fallback on quota exhaustion</p>
              <p className="flex items-center gap-2"><Check size={12} className="text-[#f59e0b]" /> Click provider pill to switch instantly</p>
            </div>
          </div>
      </div>
    </>
  );
}
