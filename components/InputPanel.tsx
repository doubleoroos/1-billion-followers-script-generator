
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
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ label, description, isSelected, onClick }) => {
    const playSound = useSound();
    return (
        <button
            onClick={() => { playSound(); onClick(); }}
            className={`group relative flex flex-col items-start text-left p-6 rounded-2xl transition-all duration-300 w-full h-full border overflow-hidden
            ${isSelected 
                ? 'bg-violet-500/10 border-violet-500/50 ring-1 ring-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.15)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1'
            }`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
            
            <div className="relative z-10 w-full">
                <div className="flex justify-between w-full mb-3">
                    <span className={`font-bold text-lg tracking-tight ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {label}
                    </span>
                    {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>
                <p className={`text-sm leading-relaxed transition-colors ${isSelected ? 'text-violet-200' : 'text-slate-400 group-hover:text-slate-300'}`}>{description}</p>
            </div>
        </button>
    );
};

const SectionHeader: React.FC<{ number: string; title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-violet-300 font-mono font-bold text-sm shadow-inner">
            {number}
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
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
    <div className="max-w-6xl mx-auto animate-fade-in pb-28">
        <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                <span className="block text-white mb-2">Envision</span>
                <span className="bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent filter drop-shadow-lg">
                    The Tomorrow
                </span>
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Direct the AI to generate a complete cinematic package: script, storyboard, and production assets.
            </p>
        </div>
      
        <div className="space-y-16">
            
            {/* Step 1: Theme */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <SectionHeader number="01" title="Select a Core Theme" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <ChoiceCard 
                        label="Abundance" 
                        description="A post-scarcity world where AI ensures shared prosperity." 
                        isSelected={rewriteTomorrowTheme === 'abundance'} 
                        onClick={() => handleThemeSelection('abundance')} 
                    />
                    <ChoiceCard 
                        label="Ascension" 
                        description="AI acting as a bridge to higher forms of consciousness." 
                        isSelected={rewriteTomorrowTheme === 'ascension'} 
                        onClick={() => handleThemeSelection('ascension')} 
                    />
                    <ChoiceCard 
                        label="Harmony" 
                        description="Symbiotic balance between technology and nature." 
                        isSelected={rewriteTomorrowTheme === 'harmony'} 
                        onClick={() => handleThemeSelection('harmony')} 
                    />
                    <ChoiceCard 
                        label="Enlightenment" 
                        description="Unlocking the deepest mysteries of the universe." 
                        isSelected={rewriteTomorrowTheme === 'enlightenment'} 
                        onClick={() => handleThemeSelection('enlightenment')} 
                    />
                </div>
            </section>

            {themeSelected && (
                <>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                
                {/* Step 2: Tone & Style */}
                <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <SectionHeader number="02" title="Define the Aesthetic" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 ml-1">Narrative Tone</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <ChoiceCard label="Poetic" description="Lyrical, metaphorical imagery." isSelected={narrativeTone === 'poetic'} onClick={() => setNarrativeTone('poetic')} />
                                <ChoiceCard label="Philosophical" description="Deep, contemplative questions." isSelected={narrativeTone === 'philosophical'} onClick={() => setNarrativeTone('philosophical')} />
                                <ChoiceCard label="Hopeful" description="Inspiring and uplifting." isSelected={narrativeTone === 'hopeful'} onClick={() => setNarrativeTone('hopeful')} />
                                <ChoiceCard label="Intimate" description="Personal, character-focused." isSelected={narrativeTone === 'intimate'} onClick={() => setNarrativeTone('intimate')} />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 ml-1">Visual Style</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <ChoiceCard label="Cinematic" description="Photorealistic, dramatic lighting." isSelected={visualStyle === 'cinematic'} onClick={() => setVisualStyle('cinematic')} />
                                <ChoiceCard label="Solarpunk" description="Organic tech, lush greenery." isSelected={visualStyle === 'solarpunk'} onClick={() => setVisualStyle('solarpunk')} />
                                <ChoiceCard label="Minimalist" description="Clean forms, negative space." isSelected={visualStyle === 'minimalist'} onClick={() => setVisualStyle('minimalist')} />
                                <ChoiceCard label="Biomorphic" description="Fluid, organic structures." isSelected={visualStyle === 'biomorphic'} onClick={() => setVisualStyle('biomorphic')} />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Step 3: Pacing */}
                <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <SectionHeader number="03" title="Emotional Intensity" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <ChoiceCard label="Subtle" description="Gentle, contemplative flow." isSelected={emotionalArc === 'subtle'} onClick={() => setEmotionalArc('subtle')} />
                        <ChoiceCard label="Moderate" description="Balanced tension and release." isSelected={emotionalArc === 'moderate'} onClick={() => setEmotionalArc('moderate')} />
                        <ChoiceCard label="Intense" description="Dramatic peaks, profound catharsis." isSelected={emotionalArc === 'intense'} onClick={() => setEmotionalArc('intense')} />
                    </div>
                </section>
                </>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl animate-fade-in flex items-center gap-3 text-red-200">
                    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p>{error}</p>
                </div>
            )}

            <div className="fixed bottom-10 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || !themeSelected}
                    className={`pointer-events-auto group relative overflow-hidden rounded-full transition-all duration-500 
                    ${isLoading || !themeSelected ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100 hover:scale-105 hover:-translate-y-1 cursor-pointer shadow-[0_0_50px_rgba(139,92,246,0.4)]'}
                    bg-[#0f172a] p-1.5`}
                >
                     {/* Button Inner */}
                     <div className="relative bg-primary-action-gradient text-white font-bold py-4 px-12 rounded-full flex items-center gap-4 text-lg md:text-xl shadow-inner border border-white/20">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>INITIALIZING...</span>
                            </>
                        ) : (
                            <>
                                <span className="tracking-widest font-mono">LAUNCH PROJECT</span>
                                <SparklesIcon />
                            </>
                        )}
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     </div>
                </button>
            </div>
            
            {/* Spacer for fixed button */}
            <div className="h-24"></div>
        </div>
    </div>
  );
};
