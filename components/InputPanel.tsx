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
  color?: 'gold' | 'blue' | 'red';
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ label, description, isSelected, onClick, className = '', color = 'gold' }) => {
    const playSound = useSound();
    
    // Determine active color styles (Mapped gold to cyan via global CSS/Config)
    const activeBorder = color === 'gold' ? 'border-gold' : (color === 'blue' ? 'border-paramount-blue' : 'border-studio-red');
    const activeText = color === 'gold' ? 'text-gold' : (color === 'blue' ? 'text-paramount-blue' : 'text-studio-red');
    const activeBg = color === 'gold' ? 'bg-gold/10' : (color === 'blue' ? 'bg-paramount-blue/10' : 'bg-studio-red/10');
    const activeLed = color === 'gold' ? 'bg-gold' : (color === 'blue' ? 'bg-paramount-blue' : 'bg-studio-red');

    return (
        <button
            onClick={() => { playSound(); onClick(); }}
            className={`group relative flex flex-col items-start text-left p-0 transition-all duration-200 w-full h-full 
            bg-gunmetal border-l-4 ${isSelected ? activeBorder + ' ' + activeBg : 'border-slate-700 hover:border-slate-500 bg-gunmetal'} 
            border-y border-r border-y-black border-r-black ${className}`}
        >
            {/* Rack Screws */}
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black border border-slate-700 opacity-50"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-black border border-slate-700 opacity-50"></div>

            <div className="p-5 w-full">
                <div className="flex justify-between items-center w-full mb-2">
                    <span className={`font-display font-bold text-lg uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {label}
                    </span>
                    {/* LED Indicator */}
                    <div className={`w-3 h-3 rounded-full border border-black transition-colors duration-300 ${isSelected ? activeLed + ' led-indicator' : 'bg-black'}`}></div>
                </div>
                <p className={`text-xs font-mono leading-relaxed transition-colors ${isSelected ? activeText : 'text-slate-500'}`}>{description}</p>
            </div>
        </button>
    );
};

const SectionHeader: React.FC<{ number: string; title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-2">
        <span className="font-mono text-gold text-sm font-bold">[{number}]</span>
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">{title}</h3>
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
    playSound('success');
    onGenerate();
  };

  return (
    <div className="max-w-6xl mx-auto pb-40">
        <div className="text-center mb-16 space-y-4 pt-10">
            <h2 className="font-display text-5xl md:text-7xl font-bold uppercase text-white leading-none tracking-tighter">
                Rewrite <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-slate-400">Tomorrow</span>
            </h2>
            <div className="h-1 w-24 bg-gold mx-auto"></div>
            <p className="font-mono text-slate-500 text-sm tracking-wider uppercase">
                System Ready. Initialize Narrative Parameters.
            </p>
        </div>
      
        <div className="space-y-12 bg-studio-black p-8 border border-white/5 rounded-sm shadow-2xl">
            
            {/* Step 1: Theme */}
            <section>
                <SectionHeader number="01" title="Core Theme Protocol" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ChoiceCard label="Abundance" description="Post-scarcity prosperity." isSelected={rewriteTomorrowTheme === 'abundance'} onClick={() => handleThemeSelection('abundance')} color="gold" />
                    <ChoiceCard label="Ascension" description="Evolutionary consciousness." isSelected={rewriteTomorrowTheme === 'ascension'} onClick={() => handleThemeSelection('ascension')} color="gold" />
                    <ChoiceCard label="Harmony" description="Nature/Tech symbiosis." isSelected={rewriteTomorrowTheme === 'harmony'} onClick={() => handleThemeSelection('harmony')} color="gold" />
                    <ChoiceCard label="Enlightenment" description="Universal wisdom." isSelected={rewriteTomorrowTheme === 'enlightenment'} onClick={() => handleThemeSelection('enlightenment')} color="gold" />
                </div>
            </section>

            {themeSelected && (
                <>
                {/* Step 2: Tone & Style */}
                <section className="animate-fade-in">
                    <SectionHeader number="02" title="Aesthetic Configuration" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-mono text-[10px] font-bold text-slate-500 uppercase mb-3">Narrative Tone</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <ChoiceCard label="Poetic" description="Lyrical imagery." isSelected={narrativeTone === 'poetic'} onClick={() => setNarrativeTone('poetic')} color="blue" />
                                <ChoiceCard label="Philosophical" description="Deep questioning." isSelected={narrativeTone === 'philosophical'} onClick={() => setNarrativeTone('philosophical')} color="blue" />
                                <ChoiceCard label="Hopeful" description="Inspiring optimism." isSelected={narrativeTone === 'hopeful'} onClick={() => setNarrativeTone('hopeful')} color="blue" />
                                <ChoiceCard label="Intimate" description="Personal focus." isSelected={narrativeTone === 'intimate'} onClick={() => setNarrativeTone('intimate')} color="blue" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-mono text-[10px] font-bold text-slate-500 uppercase mb-3">Visual Style</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <ChoiceCard label="Cinematic" description="Photorealistic drama." isSelected={visualStyle === 'cinematic'} onClick={() => setVisualStyle('cinematic')} color="blue" />
                                <ChoiceCard label="Solarpunk" description="Organic tech." isSelected={visualStyle === 'solarpunk'} onClick={() => setVisualStyle('solarpunk')} color="blue" />
                                <ChoiceCard label="Minimalist" description="Clean forms." isSelected={visualStyle === 'minimalist'} onClick={() => setVisualStyle('minimalist')} color="blue" />
                                <ChoiceCard label="Biomorphic" description="Fluid structures." isSelected={visualStyle === 'biomorphic'} onClick={() => setVisualStyle('biomorphic')} color="blue" />
                                <ChoiceCard label="Abstract" description="Non-representational." isSelected={visualStyle === 'abstract'} onClick={() => setVisualStyle('abstract')} className="col-span-2" color="blue" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 3: Pacing */}
                <section className="animate-fade-in">
                    <SectionHeader number="03" title="Arc Intensity" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ChoiceCard label="Subtle" description="Gentle flow." isSelected={emotionalArc === 'subtle'} onClick={() => setEmotionalArc('subtle')} color="red" />
                        <ChoiceCard label="Moderate" description="Balanced tension." isSelected={emotionalArc === 'moderate'} onClick={() => setEmotionalArc('moderate')} color="red" />
                        <ChoiceCard label="Intense" description="High drama." isSelected={emotionalArc === 'intense'} onClick={() => setEmotionalArc('intense')} color="red" />
                    </div>
                </section>
                </>
            )}

            {error && (
                <div className="bg-red-900/20 border-l-4 border-studio-red p-4 animate-fade-in text-red-400 font-mono text-xs">
                    SYSTEM ERROR: {error}
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gunmetal border-t border-gold/20 flex justify-center z-50 shadow-2xl">
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || !themeSelected}
                    className={`group relative overflow-hidden transition-all duration-200 
                    ${isLoading || !themeSelected ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100 hover:-translate-y-1 cursor-pointer'}
                    `}
                >
                     {/* The Ignition Switch */}
                     <div className="relative bg-gradient-to-r from-cyan-500 to-slate-500 hover:from-cyan-400 hover:to-slate-400 text-white font-display font-bold uppercase text-xl py-4 px-16 clip-path-polygon border-2 border-black shadow-[0_5px_0_rgb(0,0,0)] active:shadow-none active:translate-y-[5px] transition-all flex items-center gap-3">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Initiate Sequence</span>
                                <SparklesIcon />
                            </>
                        )}
                     </div>
                </button>
            </div>
            
        </div>
    </div>
  );
};