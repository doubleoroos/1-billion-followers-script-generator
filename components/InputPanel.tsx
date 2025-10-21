import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import type { EmotionalArcIntensity, VisualStyle, NarrativeTone } from '../types';

interface InputPanelProps {
  onGenerate: () => void;
  isLoading: boolean;
  emotionalArc: EmotionalArcIntensity;
  setEmotionalArc: (intensity: EmotionalArcIntensity) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (style: VisualStyle) => void;
  narrativeTone: NarrativeTone;
  setNarrativeTone: (tone: NarrativeTone) => void;
}

const OptionButton = <T extends string>({
  value,
  current,
  onClick,
  children,
  tooltip,
}: {
  value: T;
  current: T;
  onClick: (value: T) => void;
  children: React.ReactNode;
  tooltip: string;
}) => {
  const isActive = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      title={tooltip}
      aria-pressed={isActive}
      className={`relative flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 overflow-hidden border border-transparent ${
        isActive
          ? 'text-white shadow-md'
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:border-cyan-500/50'
      }`}
    >
      {isActive && <span className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600"></span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const InputPanel: React.FC<InputPanelProps> = ({ 
  onGenerate, 
  isLoading, 
  emotionalArc, 
  setEmotionalArc,
  visualStyle,
  setVisualStyle,
  narrativeTone,
  setNarrativeTone
}) => {
  return (
    <div className="bg-black/20 backdrop-blur-lg p-6 rounded-2xl border border-white/10 h-full flex flex-col space-y-6 shadow-2xl shadow-black/30">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Creative Controls</h2>
        <p className="text-gray-400">Set the compass for your cinematic vision.</p>
      </div>
      
      <div className="space-y-5">
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Narrative Tone</h3>
          <div className="grid grid-cols-2 gap-2">
              <OptionButton value="poetic" current={narrativeTone} onClick={setNarrativeTone} tooltip="Speak in metaphor. Weave rich imagery to capture the heart of the idea.">Poetic</OptionButton>
              <OptionButton value="philosophical" current={narrativeTone} onClick={setNarrativeTone} tooltip="Ponder the great questions. Explore the depths of meaning and existence.">Philosophical</OptionButton>
              <OptionButton value="hopeful" current={narrativeTone} onClick={setNarrativeTone} tooltip="Paint a vision of tomorrow. Inspire with a story of optimism and unity.">Hopeful</OptionButton>
              <OptionButton value="intimate" current={narrativeTone} onClick={setNarrativeTone} tooltip="Share a quiet secret. Draw the viewer close with a personal, reflective voice.">Intimate</OptionButton>
          </div>
        </div>
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Visual Style</h3>
          <div className="grid grid-cols-2 gap-2">
              <OptionButton value="cinematic" current={visualStyle} onClick={setVisualStyle} tooltip="Craft a world of breathtaking realism. Use grand scale and dramatic light to stir the soul.">Cinematic</OptionButton>
              <OptionButton value="solarpunk" current={visualStyle} onClick={setVisualStyle} tooltip="Envision a world in bloom. Weave sunlight, technology, and nature into a hopeful tomorrow.">Solarpunk</OptionButton>
              <OptionButton value="minimalist" current={visualStyle} onClick={setVisualStyle} tooltip="Find power in simplicity. Use clean forms and open space to convey profound ideas.">Minimalist</OptionButton>
              <OptionButton value="biomorphic" current={visualStyle} onClick={setVisualStyle} tooltip="Draw from nature's blueprint. Create a flowing, interconnected world of organic shapes.">Biomorphic</OptionButton>
          </div>
        </div>
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Emotional Arc Intensity</h3>
          <div className="flex justify-between items-center gap-2">
            <OptionButton value="subtle" current={emotionalArc} onClick={setEmotionalArc} tooltip="A gentle current. Build feeling through quiet, contemplative moments.">Subtle</OptionButton>
            <OptionButton value="moderate" current={emotionalArc} onClick={setEmotionalArc} tooltip="Chart the heart's journey. Craft moments of tension and release that resonate deeply.">Moderate</OptionButton>
            <OptionButton value="intense" current={emotionalArc} onClick={setEmotionalArc} tooltip="A storm of emotion. Forge a powerful, dramatic arc with profound, cathartic peaks.">Intense</OptionButton>
          </div>
        </div>
      </div>


      <div className="pt-4 mt-auto">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400/50 relative shadow-lg animate-glow"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <SparklesIcon />
                  <span>Generate Assets</span>
                </div>
                <span className="text-xs font-semibold text-amber-200/80 italic opacity-80">Ignite the Vision</span>
             </div>
          )}
        </button>
      </div>
    </div>
  );
};