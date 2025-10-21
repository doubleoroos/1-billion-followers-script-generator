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
      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
        isActive
          ? 'bg-cyan-600 text-white shadow-lg'
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {children}
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
    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 h-full flex flex-col space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-2 text-white">Creative Controls</h2>
        <p className="text-sm text-gray-400">Define the core attributes of your film to guide the AI generation process.</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-cyan-400 mb-2">Narrative Tone</h3>
          <div className="flex justify-between items-center gap-2 bg-gray-900/50 p-1.5 rounded-xl border border-gray-700">
              <OptionButton value="poetic" current={narrativeTone} onClick={setNarrativeTone} tooltip="Evocative, metaphorical language; focuses on feeling and imagery.">Poetic</OptionButton>
              <OptionButton value="philosophical" current={narrativeTone} onClick={setNarrativeTone} tooltip="Explores deep questions about existence, humanity, and meaning.">Philosophical</OptionButton>
              <OptionButton value="hopeful" current={narrativeTone} onClick={setNarrativeTone} tooltip="Inspiring and optimistic, focusing on positive outcomes.">Hopeful</OptionButton>
              <OptionButton value="intimate" current={narrativeTone} onClick={setNarrativeTone} tooltip="A close, personal, and reflective perspective.">Intimate</OptionButton>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-cyan-400 mb-2">Visual Style</h3>
          <div className="flex justify-between items-center gap-2 bg-gray-900/50 p-1.5 rounded-xl border border-gray-700">
              <OptionButton value="cinematic" current={visualStyle} onClick={setVisualStyle} tooltip="Photorealistic, grand, and emotionally resonant visuals with dramatic lighting.">Cinematic</OptionButton>
              <OptionButton value="solarpunk" current={visualStyle} onClick={setVisualStyle} tooltip="Utopian and nature-integrated, with organic architecture and lush greenery.">Solarpunk</OptionButton>
              <OptionButton value="minimalist" current={visualStyle} onClick={setVisualStyle} tooltip="Clean, abstract, and symbolic, using simple forms and negative space.">Minimalist</OptionButton>
              <OptionButton value="biomorphic" current={visualStyle} onClick={setVisualStyle} tooltip="Fluid, organic shapes inspired by nature's curves and patterns.">Biomorphic</OptionButton>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-cyan-400 mb-2">Emotional Arc Intensity</h3>
          <div className="flex justify-between items-center gap-2 bg-gray-900/50 p-1.5 rounded-xl border border-gray-700">
            <OptionButton value="subtle" current={emotionalArc} onClick={setEmotionalArc} tooltip="A gentle, contemplative arc with nuanced feelings.">Subtle</OptionButton>
            <OptionButton value="moderate" current={emotionalArc} onClick={setEmotionalArc} tooltip="A balanced journey with clear peaks and valleys.">Moderate</OptionButton>
            <OptionButton value="intense" current={emotionalArc} onClick={setEmotionalArc} tooltip="A powerful, dramatic arc with stark contrasts.">Intense</OptionButton>
          </div>
        </div>
      </div>


      <div className="pt-4">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-cyan-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
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