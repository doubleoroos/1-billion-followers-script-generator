

import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import type { EmotionalArcIntensity, VisualStyle, NarrativeTone, RewriteTomorrowTheme } from '../types';
import { useSound } from './hooks/useSound';

interface InputPanelProps {
  onGenerate: () => void;
  isLoading: boolean;
  rewriteTomorrowTheme: RewriteTomorrowTheme;
  setRewriteTomorrowTheme: (theme: RewriteTomorrowTheme) => void;
  emotionalArc: EmotionalArcIntensity;
  setEmotionalArc: (intensity: EmotionalArcIntensity) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (style: VisualStyle) => void;
  narrativeTone: NarrativeTone;
  setNarrativeTone: (tone: NarrativeTone) => void;
  error: string | null;
}

interface OptionButtonProps<T extends string> {
  value: T;
  current: string;
  onClick: (value: T) => void;
  children: React.ReactNode;
  tooltip: string;
}

const OptionButton = <T extends string>(props: OptionButtonProps<T>) => {
  const { value, current, onClick, children, tooltip } = props;
  const isActive = value === current;
  const playSound = useSound();

  const handleClick = () => {
    playSound();
    onClick(value);
  };

  return (
    <button
      onClick={handleClick}
      title={tooltip}
      aria-pressed={isActive}
      className={`relative w-full px-4 py-3 text-sm font-semibold rounded-full border transition-all duration-300 group
        ${
          isActive
            ? 'bg-violet-500/20 border-violet-400 text-white shadow-[0_0_15px_rgba(167,139,250,0.4)]'
            : 'bg-white/5 text-text-secondary border-transparent hover:border-white/20 hover:text-white'
        }`}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

const ControlGroup: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="space-y-3">
        <h3 className="font-semibold text-text-primary text-lg pl-2">{title}</h3>
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/10">
            {children}
        </div>
    </div>
);

export const InputPanel: React.FC<InputPanelProps> = ({ 
  onGenerate, 
  isLoading, 
  rewriteTomorrowTheme,
  setRewriteTomorrowTheme,
  emotionalArc, 
  setEmotionalArc,
  visualStyle,
  setVisualStyle,
  narrativeTone,
  setNarrativeTone,
  error,
}) => {
  const [themeSelected, setThemeSelected] = useState(false);
  const playSound = useSound();

  const handleThemeSelection = (theme: RewriteTomorrowTheme) => {
    setRewriteTomorrowTheme(theme);
    setThemeSelected(true);
  }
  
  const handleGenerateClick = () => {
    playSound();
    onGenerate();
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold mb-3 bg-gold-reflection text-transparent bg-clip-text">Envision a New Future</h2>
            <p className="text-text-secondary text-xl">Your choices will guide the AI in generating a complete film concept.</p>
        </div>
      
        <div className="panel-glass p-6 md:p-8 rounded-3xl flex flex-col space-y-8">
        
        <ControlGroup title="Step 1: Choose a Core Theme">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* FIX: Added children to OptionButton components to provide button text. */}
                <OptionButton value="abundance" current={rewriteTomorrowTheme} onClick={handleThemeSelection} tooltip="A post-scarcity world where AI ensures prosperity for all.">Abundance</OptionButton>
                <OptionButton value="ascension" current={rewriteTomorrowTheme} onClick={handleThemeSelection} tooltip="AI as a bridge to higher forms of consciousness and existence.">Ascension</OptionButton>
                <OptionButton value="harmony" current={rewriteTomorrowTheme} onClick={handleThemeSelection} tooltip="A perfect balance between humanity, technology, and nature.">Harmony</OptionButton>
                <OptionButton value="enlightenment" current={rewriteTomorrowTheme} onClick={handleThemeSelection} tooltip="AI helps unlock the deepest mysteries of the mind and universe.">Enlightenment</OptionButton>
            </div>
        </ControlGroup>

        {themeSelected && (
            <div className="space-y-6 animate-fade-in">
                <ControlGroup title="Step 2: Set the Creative Direction">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium text-text-primary mb-2 pl-1">Narrative Tone</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {/* FIX: Added children to OptionButton components to provide button text. */}
                                <OptionButton value="poetic" current={narrativeTone} onClick={setNarrativeTone} tooltip="Speak in metaphor. Weave rich imagery to capture the heart of the idea.">Poetic</OptionButton>
                                <OptionButton value="philosophical" current={narrativeTone} onClick={setNarrativeTone} tooltip="Ponder the great questions. Explore the depths of meaning and existence.">Philosophical</OptionButton>
                                <OptionButton value="hopeful" current={narrativeTone} onClick={setNarrativeTone} tooltip="Paint a vision of tomorrow. Inspire with a story of optimism and unity.">Hopeful</OptionButton>
                                <OptionButton value="intimate" current={narrativeTone} onClick={setNarrativeTone} tooltip="Share a quiet secret. Draw the viewer close with a personal, reflective voice.">Intimate</OptionButton>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-medium text-text-primary mb-2 pl-1">Visual Style</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {/* FIX: Added children to OptionButton components to provide button text. */}
                                <OptionButton value="cinematic" current={visualStyle} onClick={setVisualStyle} tooltip="Craft a world of breathtaking realism. Use grand scale and dramatic light to stir the soul.">Cinematic</OptionButton>
                                <OptionButton value="solarpunk" current={visualStyle} onClick={setVisualStyle} tooltip="Envision a world in bloom. Weave sunlight, technology, and nature into a hopeful tomorrow.">Solarpunk</OptionButton>
                                <OptionButton value="minimalist" current={visualStyle} onClick={setVisualStyle} tooltip="Find power in simplicity. Use clean forms and open space to convey profound ideas.">Minimalist</OptionButton>
                                <OptionButton value="biomorphic" current={visualStyle} onClick={setVisualStyle} tooltip="Draw from nature's blueprint. Create a flowing, interconnected world of organic shapes.">Biomorphic</OptionButton>
                                <OptionButton value="abstract" current={visualStyle} onClick={setVisualStyle} tooltip="Evoke feelings through non-literal forms. Use color, shape, and texture to build an inner landscape.">Abstract</OptionButton>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-medium text-text-primary mb-2 pl-1">Emotional Arc</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* FIX: Added children to OptionButton components to provide button text. */}
                                <OptionButton value="subtle" current={emotionalArc} onClick={setEmotionalArc} tooltip="A gentle current. Build feeling through quiet, contemplative moments.">Subtle</OptionButton>
                                <OptionButton value="moderate" current={emotionalArc} onClick={setEmotionalArc} tooltip="Chart the heart's journey. Craft moments of tension and release that resonate deeply.">Moderate</OptionButton>
                                <OptionButton value="intense" current={emotionalArc} onClick={setEmotionalArc} tooltip="A storm of emotion. Forge a powerful, dramatic arc with profound, cathartic peaks.">Intense</OptionButton>
                            </div>
                        </div>
                    </div>
                </ControlGroup>
            </div>
        )}

        {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl animate-fade-in text-sm text-red-200">
                <p className="font-semibold mb-1">An Unexpected Plot Twist</p>
                <p>{error}</p>
            </div>
        )}

        <div className="pt-4 mt-auto">
            <button
                onClick={handleGenerateClick}
                disabled={isLoading || !themeSelected}
                className="btn-glow w-full flex items-center justify-center gap-3 bg-primary-action-gradient text-white font-bold py-4 px-4 rounded-xl relative shadow-glow-violet disabled:bg-gray-600 disabled:shadow-none disabled:text-gray-300"
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
                <div className="flex items-center gap-2 text-lg">
                    <SparklesIcon />
                    <span>Generate Film Blueprint</span>
                </div>
            )}
            </button>
        </div>
        </div>
    </div>
  );
};
