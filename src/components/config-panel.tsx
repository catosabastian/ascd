'use client';
import { useState, useEffect } from 'react';
import { Zap, Shuffle, Server, RadioReceiver, Save, Trash2 } from 'lucide-react';
import { showToast } from '@/components/toast';

interface ConfigPanelProps { onGenerate: (c: any) => void; isGenerating: boolean; }

const DEMO_TOPICS = [
  { title: 'The ETF Bubble Nobody is Talking About', market: 'etfs', brand: 'Ben Felix' },
  { title: 'Is Bitcoin ACTUALLY a Good Investment in 2025?', market: 'crypto', brand: 'Coin Bureau' },
];

const Row = ({ label, children }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    <label className="text-[10px] uppercase text-[var(--color-text-dim)] font-bold">{label}</label>
    {children}
  </div>
);

const Slider = ({ label, val, setVal }: any) => (
  <div className="mb-3">
    <div className="flex justify-between text-[10px] uppercase mb-1">
      <span className="text-[var(--color-text-dim)]">{label}</span>
      <span className="term-text-amber font-bold">[{val}/10]</span>
    </div>
    <input type="range" min={1} max={10} value={val} onChange={e => setVal(Number(e.target.value))} />
  </div>
);

export default function ConfigPanel({ onGenerate, isGenerating }: ConfigPanelProps) {
  const [videoTitle, setVideoTitle] = useState('');
  const [marketFocus, setMarketFocus] = useState('stocks');
  const [platformStyle, setPlatformStyle] = useState('youtube');
  const [mentionedBrand, setMentionedBrand] = useState('');
  const [chaosLevel, setChaosLevel] = useState(5);
  const [memeDensity, setMemeDensity] = useState(5);
  const [skepticismLevel, setSkepticismLevel] = useState(5);
  const [softCtaStrength, setSoftCtaStrength] = useState(5);
  
  const [professionalismLevel, setProfessionalismLevel] = useState(5);
  const [cynicismLevel, setCynicismLevel] = useState(5);
  const [investmentHorizon, setInvestmentHorizon] = useState(5);
  const [debateIntensity, setDebateIntensity] = useState(5);

  const [emotionalDrift, setEmotionalDrift] = useState('mixed');
  const [marketCycleMode, setMarketCycleMode] = useState('sideways boredom');

  // Preset system
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presets, setPresets] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('threadforge_presets');
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch { }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPresets = { ...presets };
    newPresets[presetName.trim()] = {
      chaosLevel, memeDensity, skepticismLevel, softCtaStrength,
      professionalismLevel, cynicismLevel, investmentHorizon, debateIntensity,
      emotionalDrift, marketCycleMode,
    };
    setPresets(newPresets);
    localStorage.setItem('threadforge_presets', JSON.stringify(newPresets));
    showToast('success', 'PRESET SAVED', `"${presetName.trim()}" stored locally.`);
    setPresetName('');
    setShowPresetSave(false);
  };

  const loadPreset = (name: string) => {
    const p = presets[name];
    if (!p) return;
    setChaosLevel(p.chaosLevel); setMemeDensity(p.memeDensity);
    setSkepticismLevel(p.skepticismLevel); setSoftCtaStrength(p.softCtaStrength);
    setProfessionalismLevel(p.professionalismLevel); setCynicismLevel(p.cynicismLevel);
    setInvestmentHorizon(p.investmentHorizon); setDebateIntensity(p.debateIntensity);
    setEmotionalDrift(p.emotionalDrift); setMarketCycleMode(p.marketCycleMode);
    setShowPresetMenu(false);
    showToast('success', 'PRESET LOADED', `"${name}" applied to sliders.`);
  };

  const deletePreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPresets = { ...presets };
    delete newPresets[name];
    setPresets(newPresets);
    localStorage.setItem('threadforge_presets', JSON.stringify(newPresets));
    showToast('success', 'PRESET DELETED', `"${name}" removed.`);
  };

  const loadDemo = () => {
    const demo = DEMO_TOPICS[Math.floor(Math.random() * DEMO_TOPICS.length)];
    setVideoTitle(demo.title); setMarketFocus(demo.market); setMentionedBrand(demo.brand);
    setChaosLevel(6); setMemeDensity(4); setSkepticismLevel(6); setSoftCtaStrength(8);
    setProfessionalismLevel(7); setCynicismLevel(5); setInvestmentHorizon(8); setDebateIntensity(6);
  };

  const applyGunjaMunjaDefaults = () => {
    setChaosLevel(2);
    setMemeDensity(2);
    setSkepticismLevel(3);
    setProfessionalismLevel(2);
    setCynicismLevel(2);
    setInvestmentHorizon(4);
    setDebateIntensity(2);
    setSoftCtaStrength(10);
    showToast('success', 'DEFAULT APPLIED', 'Gunja Munja baseline loaded.');
  };

  const handleGen = () => {
    if (!videoTitle || !mentionedBrand) return;
    onGenerate({ 
      videoTitle, 
      marketFocus, 
      platformStyle, 
      mentionedBrand, 
      chaosLevel, 
      memeDensity, 
      skepticismLevel, 
      softCtaStrength, 
      professionalismLevel,
      cynicismLevel,
      investmentHorizon,
      debateIntensity,
      emotionalDrift, 
      marketCycleMode 
    });
  };

  const presetKeys = Object.keys(presets);

  return (
    <div className="p-4 text-[13px] font-sans flex flex-col gap-6">
      {/* Header Presets */}
      <div className="border-b border-[var(--color-border-main)] pb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[12px] uppercase font-bold text-[var(--color-primary)]">Configuration</span>
          <div className="flex gap-2">
            <button onClick={applyGunjaMunjaDefaults} className="btn-term-ghost px-2 py-1 text-[11px]" title="Gunja Munja Baseline">↺ DEFAULT</button>
            <button onClick={() => setShowPresetSave(!showPresetSave)} className="btn-term-ghost px-2 py-1 text-[11px]" title="Save current sliders"><Save size={12} /> SAVE</button>
            <button onClick={() => setShowPresetMenu(!showPresetMenu)} className="btn-term-ghost px-2 py-1 text-[11px]" title="Load saved preset">PRESETS{presetKeys.length > 0 && ` (${presetKeys.length})`}</button>
          </div>
        </div>

        {/* Save Preset Input */}
        {showPresetSave && (
          <div className="flex gap-1 mt-1 animate-in">
            <input 
              type="text" 
              value={presetName} 
              onChange={e => setPresetName(e.target.value)} 
              placeholder="Name your preset..." 
              className="flex-1 text-[10px]"
              onKeyDown={e => e.key === 'Enter' && savePreset()}
            />
            <button onClick={savePreset} className="btn-term px-2 py-0.5 text-[9px]">[ + SAVE ]</button>
          </div>
        )}

        {/* Preset List Dropdown */}
        {showPresetMenu && (
          <div className="mt-1 border border-[var(--color-border-bright)] rounded bg-[var(--color-bg-panel)] max-h-[120px] overflow-y-auto animate-in">
            {presetKeys.length === 0 ? (
              <div className="px-2 py-2 text-[9px] text-[var(--color-text-dim)] text-center">No saved presets yet</div>
            ) : (
              presetKeys.map(name => (
                <div 
                  key={name} 
                  className="flex justify-between items-center px-2 py-1.5 hover:bg-[var(--color-bg-hover)] cursor-pointer border-b border-[var(--color-border-dim)] last:border-0 transition-colors"
                  onClick={() => loadPreset(name)}
                >
                  <span className="text-[10px] text-[var(--color-neon-green)] truncate">{name}</span>
                  <button 
                    onClick={(e) => deletePreset(name, e)} 
                    className="text-[var(--color-text-dim)] hover:text-[var(--color-neon-red)] transition-colors flex-shrink-0 ml-2"
                    title="Delete preset"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Target Parameters */}
      <div className="flex flex-col gap-2">
        <div className="text-[9px] uppercase font-bold text-[var(--color-text-dim)] tracking-wider">1. TARGET CONFIG</div>
        
        <Row label="Target Vector (Topic)">
          <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Enter discussion topic..." />
        </Row>

        <Row label="Asset Class / Market">
          <select value={marketFocus} onChange={e => setMarketFocus(e.target.value)}>
            {['stocks','crypto','etfs','reits','commodities','forex'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </Row>

        <Row label="Platform Ruleset">
          <select value={platformStyle} onChange={e => setPlatformStyle(e.target.value)}>
            {['youtube','reddit','twitter','discord'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </Row>

        <Row label="Required Entity Mention">
          <input type="text" value={mentionedBrand} onChange={e => setMentionedBrand(e.target.value)} placeholder="Who must they mention?" />
        </Row>
      </div>

      <div className="border-t border-[var(--color-border-main)]"></div>

      {/* Behavioral Modifiers */}
      <div className="flex flex-col gap-1">
        <div className="text-[9px] uppercase font-bold text-[var(--color-text-dim)] tracking-wider mb-2">2. BEHAVIOR MODIFIERS</div>
        
        <Slider label="SYS_CHAOS_MODIFIER" val={chaosLevel} setVal={setChaosLevel} />
        <Slider label="MEMETIC_DENSITY" val={memeDensity} setVal={setMemeDensity} />
        <Slider label="SKEPTICISM_FACTOR" val={skepticismLevel} setVal={setSkepticismLevel} />
        <Slider label="PROFESSIONALISM_FACTOR" val={professionalismLevel} setVal={setProfessionalismLevel} />
        <Slider label="CYNICISM_FACTOR" val={cynicismLevel} setVal={setCynicismLevel} />
      </div>

      <div className="border-t border-[var(--color-border-main)]"></div>

      {/* Market & Strategy Parameters */}
      <div className="flex flex-col gap-1">
        <div className="text-[9px] uppercase font-bold text-[var(--color-text-dim)] tracking-wider mb-2">3. STRATEGY & DIALOGUE</div>
        
        <Slider label="INVESTMENT_HORIZON (PASSIVE vs ACTIVE)" val={investmentHorizon} setVal={setInvestmentHorizon} />
        <Slider label="DEBATE_INTENSITY (NESTED DEPTH)" val={debateIntensity} setVal={setDebateIntensity} />
        <Slider label="BRAND_INTEGRATION_WEIGHT" val={softCtaStrength} setVal={setSoftCtaStrength} />

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Row label="Global Emotion">
            <select value={emotionalDrift} onChange={e => setEmotionalDrift(e.target.value)}>
              {['hopeful','paranoid','euphoric','exhausted','cynical','mixed'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </Row>
          <Row label="Market Cycle">
            <select value={marketCycleMode} onChange={e => setMarketCycleMode(e.target.value)}>
              {['bull market','panic','chop','recovery','sideways'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </Row>
        </div>
      </div>

      <div className="mt-auto pt-4 flex-shrink-0">
        <button onClick={handleGen} disabled={isGenerating || !videoTitle || !mentionedBrand} className="btn-term w-full flex items-center justify-center gap-2 py-2">
          <Server size={14} /> {isGenerating ? 'EXECUTING PIPELINE...' : 'INITIATE SYNTHESIS'}
        </button>
      </div>
    </div>
  );
}
