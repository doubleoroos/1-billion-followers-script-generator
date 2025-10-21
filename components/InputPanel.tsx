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
      className={`relative flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 overflow-hidden ${
        isActive
          ? 'text-white shadow-md'
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
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
        <p className="text-gray-400">Define the core attributes of your film to guide the AI generation.</p>
      </div>
      
      <div className="space-y-5">
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Narrative Tone</h3>
          <div className="grid grid-cols-2 gap-2">
              <OptionButton value="poetic" current={narrativeTone} onClick={setNarrativeTone} tooltip="Evocative, metaphorical language; focuses on feeling and imagery.">Poetic</OptionButton>
              <OptionButton value="philosophical" current={narrativeTone} onClick={setNarrativeTone} tooltip="Explores deep questions about existence, humanity, and meaning.">Philosophical</OptionButton>
              <OptionButton value="hopeful" current={narrativeTone} onClick={setNarrativeTone} tooltip="Inspiring and optimistic, focusing on positive outcomes.">Hopeful</OptionButton>
              <OptionButton value="intimate" current={narrativeTone} onClick={setNarrativeTone} tooltip="A close, personal, and reflective perspective.">Intimate</OptionButton>
          </div>
        </div>
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Visual Style</h3>
          <div className="grid grid-cols-2 gap-2">
              <OptionButton value="cinematic" current={visualStyle} onClick={setVisualStyle} tooltip="Photorealistic, grand, and emotionally resonant visuals with dramatic lighting.">Cinematic</OptionButton>
              <OptionButton value="solarpunk" current={visualStyle} onClick={setVisualStyle} tooltip="Utopian and nature-integrated, with organic architecture and lush greenery.">Solarpunk</OptionButton>
              <OptionButton value="minimalist" current={visualStyle} onClick={setVisualStyle} tooltip="Clean, abstract, and symbolic, using simple forms and negative space.">Minimalist</OptionButton>
              <OptionButton value="biomorphic" current={visualStyle} onClick={setVisualStyle} tooltip="Fluid, organic shapes inspired by nature's curves and patterns.">Biomorphic</OptionButton>
          </div>
        </div>
        <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-brand-cyan to-transparent"></div>
          <h3 className="font-semibold text-white mb-3 pl-2">Emotional Arc Intensity</h3>
          <div className="flex justify-between items-center gap-2">
            <OptionButton value="subtle" current={emotionalArc} onClick={setEmotionalArc} tooltip="A gentle, contemplative arc with nuanced feelings.">Subtle</OptionButton>
            <OptionButton value="moderate" current={emotionalArc} onClick={setEmotionalArc} tooltip="A balanced journey with clear peaks and valleys.">Moderate</OptionButton>
            <OptionButton value="intense" current={emotionalArc} onClick={setEmotionalArc} tooltip="A powerful, dramatic arc with stark contrasts.">Intense</OptionButton>
          </div>
        </div>
      </div>


      <div className="pt-4 mt-auto">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400/50 relative shadow-lg animate-glow"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating Assets...</span>
            </>
          ) : (
            <>
              <SparklesIcon />
              Generate Assets
            </>
          )}
        </button>
      </div>
    </div>
  );
};