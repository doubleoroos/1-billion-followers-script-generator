import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import type { EmotionalArcIntensity } from '../types';

interface InputPanelProps {
  onGenerate: () => void;
  isLoading: boolean;
  emotionalArc: EmotionalArcIntensity;
  setEmotionalArc: (intensity: EmotionalArcIntensity) => void;
}

const IntensityButton: React.FC<{
  value: EmotionalArcIntensity;
  current: EmotionalArcIntensity;
  onClick: (value: EmotionalArcIntensity) => void;
  children: React.ReactNode;
  tooltip: string;
}> = ({ value, current, onClick, children, tooltip }) => {
  const isActive = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      title={tooltip}
      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
        isActive
          ? 'bg-cyan-600 text-white shadow-lg'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
};

export const InputPanel: React.FC<InputPanelProps> = ({ onGenerate, isLoading, emotionalArc, setEmotionalArc }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-white">Concept & Workflow</h2>
      
      <div className="space-y-4 text-slate-300 flex-grow">
        <div>
          <h3 className="font-bold text-cyan-400">Project Title:</h3>
          <p>1 Billion Followers</p>
        </div>
        <div>
          <h3 className="font-bold text-cyan-400">Theme:</h3>
          <p>Envisioning a future where 1 billion people follow a single, positive idea.</p>
        </div>
        <div>
          <h3 className="font-bold text-cyan-400">Concept Summary:</h3>
          <p className="italic">
            A poetic AI-generated short film that explores a future where one billion people are united by a single, positive idea. The film visualizes the birth, growth, and impact of this idea on humanity, imagining a future of collective hope and action.
          </p>
        </div>
         <div>
          <h3 className="font-bold text-cyan-400">Generation Task:</h3>
          <p>
            Use Gemini to generate assets for <strong>Phase 1: Script & Visual Outline</strong> of the "1 Billion Followers" AI Film Award, including a draft for your BTS document.
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="font-bold text-cyan-400 mb-3">Emotional Arc Intensity:</h3>
        <div className="flex justify-between items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
          <IntensityButton
            value="subtle"
            current={emotionalArc}
            onClick={setEmotionalArc}
            tooltip="A gentle, contemplative arc with nuanced feelings and gradual mood shifts."
          >
            Subtle
          </IntensityButton>
          <IntensityButton
            value="moderate"
            current={emotionalArc}
            onClick={setEmotionalArc}
            tooltip="A balanced emotional journey with clear peaks and valleys, like a standard film."
          >
            Moderate
          </IntensityButton>
          <IntensityButton
            value="intense"
            current={emotionalArc}
            onClick={setEmotionalArc}
            tooltip="A powerful, dramatic arc with stark contrasts and a cathartic, impactful climax."
          >
            Intense
          </IntensityButton>
        </div>
      </div>


      <div className="mt-8">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
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