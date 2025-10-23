
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import type { EmotionalArcIntensity, VisualStyle, NarrativeTone, RewriteTomorrowTheme } from '../types';

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
      className={`relative flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-deep focus:ring-violet-glow overflow-hidden border ${
        isActive
          ? 'text-white shadow-md border-violet-glow/50'
          : 'bg-blue-deep/50 text-gray-300 hover:bg-blue-deep hover:border-violet-glow/50 border-transparent'
      }`}
    >
      {isActive && <span className="absolute inset-0 bg-gradient-to-br from-violet-glow/20 to-blue-deep"></span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

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
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-white mb-3 bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">Envision a New Future</h2>
            <p className="text-gray-400 text-lg">Select a core theme and creative direction. Your choices will guide the AI in generating a complete concept for your 7-10 minute film.</p>
        </div>
      
        <div className="bg-black/20 backdrop-blur-lg p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col space-y-8 shadow-2xl shadow-black/30">
        
        <div className="space-y-6">
            <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-glow to-transparent"></div>
                <h3 className="font-semibold text-white mb-3 text-lg pl-2">Rewrite Tomorrow Theme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* FIX: The OptionButton component requires a 'children' prop which was missing. Added children to all OptionButton instances to display their labels. */}
                    <OptionButton value="abundance" current={rewriteTomorrowTheme} onClick={setRewriteTomorrowTheme} tooltip="A post-scarcity world where AI ensures prosperity for all.">Abundance</OptionButton>
                    <OptionButton value="ascension" current={rewriteTomorrowTheme} onClick={setRewriteTomorrowTheme} tooltip="AI as a bridge to higher forms of consciousness and existence.">Ascension</OptionButton>
                    <OptionButton value="harmony" current={rewriteTomorrowTheme} onClick={setRewriteTomorrowTheme} tooltip="A perfect balance between humanity, technology, and nature.">Harmony</OptionButton>
                    <OptionButton value="enlightenment" current={rewriteTomorrowTheme} onClick={setRewriteTomorrowTheme} tooltip="AI helps unlock the deepest mysteries of the mind and universe.">Enlightenment</OptionButton>
                </div>
            </div>
            <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-glow to-transparent"></div>
                <h3 className="font-semibold text-white mb-3 text-lg pl-2">Narrative Tone</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* FIX: The OptionButton component requires a 'children' prop which was missing. Added children to all OptionButton instances to display their labels. */}
                    <OptionButton value="poetic" current={narrativeTone} onClick={setNarrativeTone} tooltip="Speak in metaphor. Weave rich imagery to capture the heart of the idea.">Poetic</OptionButton>
                    <OptionButton value="philosophical" current={narrativeTone} onClick={setNarrativeTone} tooltip="Ponder the great questions. Explore the depths of meaning and existence.">Philosophical</OptionButton>
                    <OptionButton value="hopeful" current={narrativeTone} onClick={setNarrativeTone} tooltip="Paint a vision of tomorrow. Inspire with a story of optimism and unity.">Hopeful</OptionButton>
                    <OptionButton value="intimate" current={narrativeTone} onClick={setNarrativeTone} tooltip="Share a quiet secret. Draw the viewer close with a personal, reflective voice.">Intimate</OptionButton>
                </div>
            </div>
            <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-glow to-transparent"></div>
                <h3 className="font-semibold text-white mb-3 text-lg pl-2">Visual Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {/* FIX: The OptionButton component requires a 'children' prop which was missing. Added children to all OptionButton instances to display their labels. */}
                    <OptionButton value="cinematic" current={visualStyle} onClick={setVisualStyle} tooltip="Craft a world of breathtaking realism. Use grand scale and dramatic light to stir the soul.">Cinematic</OptionButton>
                    <OptionButton value="solarpunk" current={visualStyle} onClick={setVisualStyle} tooltip="Envision a world in bloom. Weave sunlight, technology, and nature into a hopeful tomorrow.">Solarpunk</OptionButton>
                    <OptionButton value="minimalist" current={visualStyle} onClick={setVisualStyle} tooltip="Find power in simplicity. Use clean forms and open space to convey profound ideas.">Minimalist</OptionButton>
                    <OptionButton value="biomorphic" current={visualStyle} onClick={setVisualStyle} tooltip="Draw from nature's blueprint. Create a flowing, interconnected world of organic shapes.">Biomorphic</OptionButton>
                    <OptionButton value="abstract" current={visualStyle} onClick={setVisualStyle} tooltip="Evoke feelings through non-literal forms. Use color, shape, and texture to build an inner landscape.">Abstract</OptionButton>
                </div>
            </div>
            <div className="p-4 bg-gray-800/20 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-violet-glow to-transparent"></div>
                <h3 className="font-semibold text-white mb-3 text-lg pl-2">Emotional Arc Intensity</h3>
                <div className="flex justify-between items-center gap-2">
                    {/* FIX: The OptionButton component requires a 'children' prop which was missing. Added children to all OptionButton instances to display their labels. */}
                    <OptionButton value="subtle" current={emotionalArc} onClick={setEmotionalArc} tooltip="A gentle current. Build feeling through quiet, contemplative moments.">Subtle</OptionButton>
                    <OptionButton value="moderate" current={emotionalArc} onClick={setEmotionalArc} tooltip="Chart the heart's journey. Craft moments of tension and release that resonate deeply.">Moderate</OptionButton>
                    <OptionButton value="intense" current={emotionalArc} onClick={setEmotionalArc} tooltip="A storm of emotion. Forge a powerful, dramatic arc with profound, cathartic peaks.">Intense</OptionButton>
                </div>
            </div>
        </div>

        {error && (
            <div className="bg-red-900/30 border border-red-600/50 p-4 rounded-lg animate-fade-in text-sm text-red-200">
                <p className="font-semibold mb-1">An Unexpected Plot Twist</p>
                <p>{error}</p>
            </div>
        )}

        <div className="pt-4 mt-auto">
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-teal-bright to-mint-glow text-blue-darker font-bold py-4 px-4 rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-mint-glow/50 relative shadow-lg animate-glow transform hover:scale-[1.02] active:scale-[0.98] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:animate-none"
            >
            {isLoading ? (
                <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-white">Generating...</span>
                </>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-lg">
                    <SparklesIcon />
                    <span>Generate Film Blueprint</span>
                    </div>
                    <span className="text-xs font-semibold text-teal-900/80 italic opacity-80 mt-1">Ignite the Vision</span>
                </div>
            )}
            </button>
        </div>
        </div>
    </div>
  );
};