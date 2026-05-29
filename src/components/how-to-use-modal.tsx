'use client';
import { X, Info, Settings, Shield, Zap } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#141622] border border-[#323854] rounded-xl shadow-2xl overflow-hidden animate-slide-in">
        <div className="flex justify-between items-center p-5 border-b border-[#252a41] bg-[#1a1d2d]">
          <h2 className="text-lg font-bold text-[#e2e8f0] flex items-center gap-2">
            <Info size={18} className="text-[#6366f1]" />
            How to Use ThreadForge
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] font-sans text-sm text-[#cbd5e1] space-y-6">
          <section>
            <h3 className="text-[#38bdf8] font-bold text-base mb-2 flex items-center gap-2"><Zap size={16} /> Workflow Overview</h3>
            <p className="leading-relaxed">
              ThreadForge uses advanced LLM simulations to generate realistic comment threads for any topic.
              Simply configure your target topic, select the platform style (e.g., YouTube, Reddit), and adjust the behavioral sliders to control how the simulated users react.
            </p>
          </section>

          <section>
            <h3 className="text-[#10b981] font-bold text-base mb-2 flex items-center gap-2"><Settings size={16} /> Sliders & Modifiers</h3>
            <ul className="space-y-3 list-disc pl-5">
              <li><strong className="text-white">Chaos Modifier:</strong> Controls how erratic and unhinged the commenters behave. High values lead to arguments and trolling.</li>
              <li><strong className="text-white">Memetic Density:</strong> How often users use platform-specific slang, memes, and inside jokes.</li>
              <li><strong className="text-white">Skepticism Factor:</strong> High skepticism means users will doubt the video's claims and demand proof.</li>
              <li><strong className="text-white">Professionalism:</strong> Keeps the language clean and focused on actual analysis rather than emotion.</li>
              <li><strong className="text-white">Brand Integration (Soft CTA):</strong> How strongly the simulated users will organically mention and recommend the target brand/entity.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#f59e0b] font-bold text-base mb-2 flex items-center gap-2"><Shield size={16} /> API Keys & Fallbacks</h3>
            <p className="leading-relaxed">
              ThreadForge supports Gemini, OpenAI, Groq, OpenRouter, and GitHub Models.
              Go to the <strong>Keys</strong> menu to add your API keys. If your primary key runs out of quota (429 Rate Limit), the system will automatically fall back to the next active key!
            </p>
          </section>

          <section>
            <h3 className="text-[#d946ef] font-bold text-base mb-2">Saving Presets & Logs</h3>
            <p className="leading-relaxed">
              You can save your exact slider configuration as a <strong>Preset</strong> to load it later. 
              Once a thread is generated, it is automatically saved to the Database, and you can revisit past threads from the <strong>Logs</strong> panel on the left.
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-[#252a41] flex justify-end bg-[#1a1d2d]">
          <button onClick={onClose} className="btn-term !bg-[#323854] hover:!bg-[#444c70]">
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
