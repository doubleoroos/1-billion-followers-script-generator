
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

interface ChoiceCardProps {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  color?: 'blue' | 'red';
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ label, description, isSelected, onClick, className = '', color = 'blue' }) => {
    const playSound = useSound();
    
    // Strict Blue/Slate Theme
    const activeBorder = 'border-cyan-500'; 
    const activeText = 'text-cyan-400';
    const activeBg = 'bg-cyan-900/10';
    const activeLed = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';

    return (
        <button
            type="button"
            onClick={() => { playSound(); onClick(); }}
            className={`group relative flex flex-col items-start text-left p-0 transition-all duration-100 w-full h-full 
            bg-gunmetal border-l-4 ${isSelected ? activeBorder + ' ' + activeBg : 'border-slate-800 hover:border-slate-600 bg-gunmetal'} 
            border-y border-r border-y-black border-r-black border-opacity-30 ${className}
            active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`}
        >
            {/* Mechanical Screw Detail */}
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-black border border-slate-800 opacity-50 shadow-inner"></div>
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-black border border-slate-800 opacity-50 shadow-inner"></div>

            <div className="p-5 w-full">
                <div className="flex justify-between items-center w-full mb-2">
                    <span className={`font-display font-bold text-lg uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {label}
                    </span>
                    {/* LED Indicator */}
                    <div className={`w-2 h-2 rounded-full border border-black transition-colors duration-300 ${isSelected ? activeLed : 'bg-black'}`}></div>
                </div>
                {/* Description uses font-sans for readability */}
                <p className={`text-xs font-sans leading-relaxed transition-colors ${isSelected ? activeText : 'text-slate-600'}`}>{description}</p>
            </div>
        </button>
    );
};

const SectionHeader: React.FC<{ number: string; title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2">
        <span className="font-mono text-cyan-600 text-[12px] font-bold tracking-[0.15em] bg-cyan-950/30 px-1 py-0.5 rounded-sm">[{number}]</span>
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">{title}</h3>
    </div>
);

export const InputPanel: React.FC<InputPanelProps> = ({ 
  onGenerate, isLoading, rewriteTomorrowTheme, setRewriteTomorrowTheme, emotionalArc, setEmotionalArc, visualStyle, setVisualStyle, narrativeTone, setNarrativeTone, error,
}) => {
  const [themeSelected, setThemeSelected] = useState(false);
  const playSound = useSound();

  const handleThemeSelection = (theme: RewriteTomorrowTheme) => {
    setRewriteTomorrowTheme(theme);
    setThemeSelected(true);
  }
  
  const handleGenerateClick = () => {
    playSound('success');
    onGenerate();
  };

  return (
    <div className="max-w-6xl mx-auto pb-48"> {/* Extra padding for mobile fixed button */}
        <div className="text-center mb-16 space-y-4 pt-10">
            <h2 className="font-display text-5xl md:text-7xl font-bold uppercase text-white leading-none tracking-tighter drop-shadow-2xl">
                Rewrite <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-slate-400">Tomorrow</span>
            </h2>
            
            <p className="text-cyan-400 font-display text-lg md:text-xl uppercase tracking-[0.2em] font-bold drop-shadow-md pb-2">
                1 Billion Followers Film Competition
            </p>

            <div className="h-0.5 w-24 bg-cyan-500/50 mx-auto shadow-[0_0_10px_#06b6d4]"></div>
            <p className="font-mono text-slate-500 text-sm tracking-wider uppercase">
                System Ready. Initialize Narrative Parameters.
            </p>
            {/* Created for badge */}
            <div className="inline-block mt-4 px-4 py-1.5 bg-gunmetal border border-white/10 rounded-sm shadow-xl">
                 <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Created for the 1 Billion Followers Competition
                 </span>
            </div>
        </div>
      
        <div className="space-y-12 bg-studio-black p-4 md:p-8 border border-white/5 rounded-sm shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50"></div>

            {/* Step 1: Theme */}
            <section className="mb-8">
                <SectionHeader number="01" title="Core Theme Protocol" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ChoiceCard label="Abundance" description="Post-scarcity prosperity." isSelected={rewriteTomorrowTheme === 'abundance'} onClick={() => handleThemeSelection('abundance')} />
                    <ChoiceCard label="Ascension" description="Evolutionary consciousness." isSelected={rewriteTomorrowTheme === 'ascension'} onClick={() => handleThemeSelection('ascension')} />
                    <ChoiceCard label="Harmony" description="Nature/Tech symbiosis." isSelected={rewriteTomorrowTheme === 'harmony'} onClick={() => handleThemeSelection('harmony')} />
                    <ChoiceCard label="Enlightenment" description="Universal wisdom." isSelected={rewriteTomorrowTheme === 'enlightenment'} onClick={() => handleThemeSelection('enlightenment')} />
                </div>
            </section>

            {themeSelected && (
                <>
                {/* Step 2: Tone & Style */}
                <section className="animate-fade-in mb-8">
                    <SectionHeader number="02" title="Aesthetic Configuration" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <span className="label-studio">Narrative Tone</span>
                            <div className="grid grid-cols-2 gap-3">
                                <ChoiceCard label="Poetic" description="Lyrical imagery." isSelected={narrativeTone === 'poetic'} onClick={() => setNarrativeTone('poetic')} />
                                <ChoiceCard label="Philosophical" description="Deep questioning." isSelected={narrativeTone === 'philosophical'} onClick={() => setNarrativeTone('philosophical')} />
                                <ChoiceCard label="Hopeful" description="Inspiring optimism." isSelected={narrativeTone === 'hopeful'} onClick={() => setNarrativeTone('hopeful')} />
                                <ChoiceCard label="Intimate" description="Personal focus." isSelected={narrativeTone === 'intimate'} onClick={() => setNarrativeTone('intimate')} />
                            </div>
                        </div>
                        <div>
                            <span className="label-studio">Visual Style</span>
                            <div className="grid grid-cols-2 gap-3">
                                <ChoiceCard label="Cinematic" description="Photorealistic drama." isSelected={visualStyle === 'cinematic'} onClick={() => setVisualStyle('cinematic')} />
                                <ChoiceCard label="Solarpunk" description="Organic tech." isSelected={visualStyle === 'solarpunk'} onClick={() => setVisualStyle('solarpunk')} />
                                <ChoiceCard label="Minimalist" description="Clean forms." isSelected={visualStyle === 'minimalist'} onClick={() => setVisualStyle('minimalist')} />
                                <ChoiceCard label="Biomorphic" description="Fluid structures." isSelected={visualStyle === 'biomorphic'} onClick={() => setVisualStyle('biomorphic')} />
                                <ChoiceCard label="Abstract" description="Non-representational." isSelected={visualStyle === 'abstract'} onClick={() => setVisualStyle('abstract')} className="col-span-2" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 3: Pacing */}
                <section className="animate-fade-in mb-8">
                    <SectionHeader number="03" title="Arc Intensity" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ChoiceCard label="Subtle" description="Gentle flow." isSelected={emotionalArc === 'subtle'} onClick={() => setEmotionalArc('subtle')} />
                        <ChoiceCard label="Moderate" description="Balanced tension." isSelected={emotionalArc === 'moderate'} onClick={() => setEmotionalArc('moderate')} />
                        <ChoiceCard label="Intense" description="High drama." isSelected={emotionalArc === 'intense'} onClick={() => setEmotionalArc('intense')} color="blue" />
                    </div>
                </section>
                </>
            )}

            {error && (
                <div className="bg-red-900/20 border-l-4 border-red-500 p-4 animate-fade-in text-red-400 font-mono text-xs">
                    SYSTEM ERROR: {error}
                </div>
            )}

            {/* Sticky Launch Button - Tactile Physics */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gunmetal/95 backdrop-blur-sm border-t border-cyan-500/20 flex justify-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <button
                    type="button"
                    onClick={handleGenerateClick}
                    disabled={isLoading || !themeSelected}
                    className={`group relative overflow-hidden transition-all duration-100 
                    ${isLoading || !themeSelected ? 'opacity-70 grayscale cursor-not-allowed' : 'opacity-100 cursor-pointer'}
                    `}
                >
                     {/* The Ignition Switch - Tactile Logic Applied */}
                     <div className="relative bg-gradient-to-r from-cyan-600 to-slate-600 hover:from-cyan-500 hover:to-slate-500 text-white font-display font-bold uppercase text-xl py-4 px-12 md:px-20 clip-path-polygon border-2 border-black border-b-4 
                     shadow-[0_4px_0_rgb(0,0,0)] 
                     group-active:shadow-[0_0_0_rgb(0,0,0),inset_0_2px_6px_rgba(0,0,0,0.5)] 
                     group-active:translate-y-[1px] 
                     group-active:border-b-2
                     transition-all flex items-center gap-3">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-6 w-6 text-cyan-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Processing Sequence...</span>
                            </>
                        ) : (
                            <>
                                <span>Initiate Sequence</span>
                                <SparklesIcon />
                            </>
                        )}
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                     </div>
                </button>
            </div>
            
        </div>
    </div>
  );
};
