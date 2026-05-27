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
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] z-50 bg-[var(--color-bg-panel)] border-l-2 border-l-[var(--color-neon-amber)] flex flex-col animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-main)] bg-[var(--color-bg-header)]">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono">
            <Key size={14} className="term-text-amber" />
            <span className="text-[var(--color-text-main)]">API Key Manager</span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Lock Gate */}
        {!unlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
            <Lock size={32} className="term-text-amber" />
            <div className="text-[11px] uppercase tracking-widest font-mono text-[var(--color-text-dim)]">Enter PIN to Unlock</div>
            <div className="flex gap-2 items-center w-full max-w-[240px]">
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="••••••"
                maxLength={10}
                className={`flex-1 text-center tracking-[0.3em] text-sm ${pinError ? 'border-[var(--color-neon-red)]' : ''}`}
                autoFocus
              />
              <button onClick={handleUnlock} className="btn-term px-3 py-1.5 text-[10px]">
                <Unlock size={12} />
              </button>
            </div>
            {pinError && (
              <div className="text-[10px] font-mono term-text-red uppercase animate-pulse">
                ✗ Invalid PIN
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Active Provider Pill Switcher */}
            <div>
              <div className="text-[9px] uppercase tracking-widest font-mono text-[var(--color-text-dim)] mb-2">Active Provider</div>
              <div className="flex gap-1 p-1 bg-[var(--color-bg-base)] border border-[var(--color-border-main)]">
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
                        flex-1 py-2 px-3 text-[10px] font-mono uppercase tracking-wider transition-all duration-200 border
                        ${isActive 
                          ? 'bg-[var(--color-neon-green)] text-black border-[var(--color-neon-green)] font-bold' 
                          : hasKey 
                            ? 'bg-transparent text-[var(--color-text-dim)] border-transparent hover:border-[var(--color-border-bright)] hover:text-[var(--color-text-main)] cursor-pointer'
                            : 'bg-transparent text-[var(--color-text-dark)] border-transparent cursor-not-allowed opacity-40'
                        }
                      `}
                    >
                      {switchingId && isActive && <RefreshCw size={10} className="inline mr-1 animate-spin" />}
                      {info.label}
                      {!hasKey && <span className="block text-[8px] opacity-60 mt-0.5">No Key</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keys List by Provider */}
            {Object.entries(PROVIDER_INFO).map(([prov, info]) => {
              const provKeys = keys.filter(k => k.provider === prov);
              const isCollapsed = collapsedProviders[prov];
              return (
                <div key={prov} className="border border-[var(--color-border-main)] bg-[var(--color-bg-base)]">
                  <div 
                    className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-dim)] bg-[var(--color-bg-header)] cursor-pointer hover:bg-[var(--color-bg-hover)]"
                    onClick={() => toggleCollapse(prov)}
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight size={12} className="text-[var(--color-text-dim)]" /> : <ChevronDown size={12} className="text-[var(--color-text-dim)]" />}
                      <div className="w-2 h-2 rounded-full" style={{ background: info.color }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: info.color }}>
                        {info.label}
                      </span>
                      <span className="text-[9px] text-[var(--color-text-dark)]">
                        ({provKeys.length} key{provKeys.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCollapsedProviders(prev => ({ ...prev, [prov]: false })); setAddingProvider(prov); setNewKeyValue(''); }}
                      className="btn-term-ghost text-[9px] flex items-center gap-1 hover:term-text-green"
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-[var(--color-border-dim)]">
                    {provKeys.map(k => (
                      <div key={k.id} className={`px-3 py-2.5 transition-colors ${k.isSelected ? 'bg-[#0a1a0a]' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {k.isSelected && (
                              <span className="text-[8px] font-mono bg-[var(--color-neon-green)] text-black px-1.5 py-0.5 uppercase font-bold">
                                Active
                              </span>
                            )}
                            {k.isExhausted && (
                              <span className="text-[8px] font-mono bg-[var(--color-neon-red)] text-white px-1.5 py-0.5 uppercase font-bold flex items-center gap-1">
                                <AlertTriangle size={8} /> Exhausted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {k.isExhausted && (
                              <button onClick={() => handleResetExhaustion(k.id)} className="btn-term-ghost text-[9px] hover:term-text-amber" title="Reset">
                                <RefreshCw size={10} />
                              </button>
                            )}
                            {!k.isSelected && (
                              <button onClick={() => handleSelect(k.id)} className="btn-term-ghost text-[9px] hover:term-text-green" title="Select">
                                <Check size={10} />
                              </button>
                            )}
                            <button
                              onClick={() => { setEditingId(k.id); setEditValue(''); }}
                              className="btn-term-ghost text-[9px] hover:term-text-cyan"
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDelete(k.id)} className="btn-term-ghost text-[9px] hover:term-text-red">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                        {editingId === k.id ? (
                          <div className="flex gap-1 mt-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveEdit(k.id)}
                              placeholder={`Paste new ${prov} key...`}
                              className="flex-1 text-[10px]"
                              autoFocus
                            />
                            <button onClick={() => handleSaveEdit(k.id)} className="btn-term px-2 py-1 text-[9px]" disabled={loading}>
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn-term-ghost text-[9px]">
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="text-[11px] font-mono text-[var(--color-text-dim)] tracking-wider">
                              {k.maskedKey}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-[var(--color-text-dark)] uppercase">Model:</span>
                              <select 
                                value={k.selectedModel || PROVIDERS[prov as keyof typeof PROVIDERS]?.defaultModel}
                                onChange={(e) => handleModelChange(k.id, e.target.value)}
                                className="bg-[var(--color-bg-panel)] border border-[var(--color-border-dim)] text-[9px] text-[var(--color-text-main)] py-0.5 px-1 outline-none"
                              >
                                {PROVIDERS[prov as keyof typeof PROVIDERS]?.models.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {k.lastUsedAt && (
                          <div className="text-[8px] text-[var(--color-text-dark)] mt-2 font-mono">
                            Last used: {new Date(k.lastUsedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new key inline */}
                    {addingProvider === prov && (
                      <div className="px-3 py-2.5 bg-[var(--color-bg-hover)]">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newKeyValue}
                            onChange={e => setNewKeyValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddKey(prov)}
                            placeholder={info.placeholder}
                            className="flex-1 text-[10px]"
                            autoFocus
                          />
                          <button onClick={() => handleAddKey(prov)} className="btn-term px-2 py-1 text-[9px]" disabled={loading}>
                            <Check size={10} />
                          </button>
                          <button onClick={() => setAddingProvider(null)} className="btn-term-ghost text-[9px]">
                            ✗
                          </button>
                        </div>
                      </div>
                    )}

                    {provKeys.length === 0 && addingProvider !== prov && (
                      <div className="px-3 py-3 text-[10px] text-[var(--color-text-dark)] font-mono italic">
                        No keys configured
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}

            {/* Info footer */}
            <div className="text-[9px] text-[var(--color-text-dark)] font-mono leading-relaxed border-t border-[var(--color-border-dim)] pt-3 mt-2">
              <p className="mb-1">⚡ Keys are AES-256 encrypted at rest</p>
              <p className="mb-1">🔄 Auto-fallback on quota exhaustion</p>
              <p>🔑 Click provider pill to switch instantly</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
