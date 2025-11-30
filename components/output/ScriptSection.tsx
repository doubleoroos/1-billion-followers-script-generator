
import React, { useState, useRef, useEffect } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { useSound } from '../hooks/useSound';
import { generateScriptAudio } from '../../services/geminiService';
import { useAutosave } from '../hooks/useAutosave';

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const InlineAudioPlayer: React.FC<{ url: string; onRegenerate?: () => void }> = ({ url, onRegenerate }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        const updateProgress = () => {
             if (audio.duration && isFinite(audio.duration)) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setProgress(0);
        });
        audio.addEventListener('error', () => {
            console.error("Audio playback error");
            setError(true);
            setIsPlaying(false);
        });

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.pause();
            audioRef.current = null;
        };
    }, [url]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current || error) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => setError(true));
        }
        setIsPlaying(!isPlaying);
    };

    if (error) {
        return (
             <div className="flex items-center gap-2 bg-red-900/20 rounded-full px-3 py-1.5 border border-red-500/30 w-fit mt-3">
                 <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Audio Error</span>
                 {onRegenerate && (
                    <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="text-red-400 hover:text-white ml-2">
                        <RefreshIcon />
                    </button>
                 )}
             </div>
        );
    }

    return (
        <div className="flex items-center gap-3 bg-gunmetal/80 rounded-full px-4 py-2 border border-white/10 w-fit mt-3 backdrop-blur-sm shadow-lg hover:border-cyan-500/50 transition-all group/player select-none">
            <button 
                onClick={togglePlay} 
                className="text-cyan-400 hover:text-white transition-colors focus:outline-none"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            
            <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden relative">
                <div 
                    className="absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            <div className="w-px h-3 bg-white/10 mx-1"></div>

            <a 
                href={url} 
                download="dialogue_stem.wav" 
                className="text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none"
                title="Download Audio Stem"
                onClick={(e) => e.stopPropagation()}
            >
                <DownloadIcon />
            </a>
            
             {onRegenerate && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                    className="text-slate-600 hover:text-white transition-colors focus:outline-none ml-1"
                    title="Regenerate Voice"
                >
                    <RefreshIcon />
                </button>
            )}
        </div>
    );
};

export const ScriptSection: React.FC<any> = ({ script, characters, onSave }) => {
    const playSound = useSound();
    const [editedScript, setEditedScript] = useState(script);
    const { status, save } = useAutosave({ onSave });

    // Sync if prop changes externally
    useEffect(() => {
        setEditedScript(script);
    }, [script]);

    const handleGenerateVoice = async (blockIndex: number) => {
        const block = editedScript[blockIndex];
        const char = characters.find((c: any) => c.id === block.characterId);
        const voiceName = char?.voicePreference || 'Kore';
        
        playSound();
        
        // Optimistic update to show loading state if we had one, but here we just wait
        try {
            const url = await generateScriptAudio(block.content, voiceName);
            const newScript = [...editedScript];
            newScript[blockIndex] = { ...block, audioUrl: url };
            setEditedScript(newScript);
            onSave(newScript);
            save(newScript);
        } catch (e) {
            console.error(e);
            alert("Voice generation failed.");
        }
    };
    
    return (
        <div className="relative w-full max-w-4xl mx-auto pb-20">
            {/* Sticky Studio Toolbar */}
            <div className="sticky top-[64px] z-30 flex justify-between items-center bg-gunmetal border border-white/10 border-b-0 rounded-t-sm p-3 shadow-xl backdrop-blur-md bg-opacity-95">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Screenplay_Final_Draft.fdx</span>
                 </div>
                 <div className="flex gap-2">
                     <span className="text-[10px] font-mono text-cyan-500 opacity-60 uppercase">Auto-Format: ON</span>
                 </div>
            </div>

            {/* The Page */}
            <div className="bg-[#1a1a1a] text-[#d4d4d4] font-mono text-base shadow-2xl border-x border-b border-white/5 min-h-[800px] p-8 md:p-16 relative">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]"></div>
                
                <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                     {editedScript.map((block: any, idx: number) => (
                         <div key={block.id} className="group hover:bg-white/5 transition-colors rounded p-4 -mx-4 border border-transparent hover:border-white/5 relative">
                             {block.type === 'narration' ? (
                                 <div className="text-[#a0a0a0] mb-2 uppercase tracking-wide leading-relaxed pl-8">
                                     {block.content}
                                     {!block.audioUrl && (
                                        <button 
                                            onClick={() => handleGenerateVoice(idx)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-[9px] uppercase text-slate-500 hover:text-cyan-400 border border-slate-700 px-3 py-1 rounded-full"
                                        >
                                            Generate Narration
                                        </button>
                                     )}
                                     {block.audioUrl && (
                                         <InlineAudioPlayer 
                                            url={block.audioUrl} 
                                            onRegenerate={() => handleGenerateVoice(idx)} 
                                         />
                                     )}
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center mb-2">
                                     <div className="font-bold text-white mb-0.5 tracking-wider mt-4">
                                         {characters.find((c: any) => c.id === block.characterId)?.name.toUpperCase() || 'UNKNOWN'}
                                     </div>
                                     <div className="text-[#d4d4d4] text-center w-3/4 leading-relaxed mb-2">
                                         {block.content}
                                     </div>
                                      {!block.audioUrl ? (
                                        <button 
                                            onClick={() => handleGenerateVoice(idx)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] uppercase text-slate-500 hover:text-cyan-400 border border-slate-700 px-3 py-1 rounded-full mt-2"
                                        >
                                            Generate Dialogue
                                        </button>
                                     ) : (
                                         <InlineAudioPlayer 
                                            url={block.audioUrl} 
                                            onRegenerate={() => handleGenerateVoice(idx)} 
                                         />
                                     )}
                                 </div>
                             )}
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};
