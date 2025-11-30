
import React, { useState } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { useSound } from '../hooks/useSound';
import { generateScriptAudio } from '../../services/geminiService';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

const InlineAudioPlayer: React.FC<{ url: string }> = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        });

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
            audio.pause();
        };
    }, [url]);

    const togglePlay = () => {
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
             <div className="flex items-center gap-2 bg-red-900/40 rounded-full px-3 py-1.5 border border-red-500/30 w-fit mt-2">
                 <span className="text-[9px] text-red-300 font-bold uppercase">Playback Error</span>
             </div>
        );
    }

    return (
        <div className="flex items-center gap-3 bg-black/40 rounded-full px-3 py-1.5 border border-white/10 w-fit mt-2 backdrop-blur-sm shadow-sm transition-all hover:border-cyan-500/30">
            <button onClick={togglePlay} className="text-cyan-400 hover:text-white transition-colors">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <a 
                href={url} 
                download="voice-stem.wav" 
                className="text-slate-500 hover:text-cyan-400 transition-colors"
                title="Download Stem"
            >
                <DownloadIcon />
            </a>
        </div>
    );
};

export const ScriptSection: React.FC<any> = ({ script, characters, onSave }) => {
    const playSound = useSound();
    const [editedScript, setEditedScript] = useState(script);
    
    // Mimic "Final Draft Night Mode"
    // Background: #1a1a1a (Darker Gunmetal)
    // Text: #cccccc (Light Grey)
    
    const { status, save } = useAutosave({ onSave });

    const handleGenerateVoice = async (blockIndex: number) => {
        const block = editedScript[blockIndex];
        const char = characters.find((c: any) => c.id === block.characterId);
        const voiceName = char?.voicePreference || 'Kore';
        
        playSound();
        // Optimistic loading state could be added here
        
        try {
            const url = await generateScriptAudio(block.content, voiceName);
            const newScript = [...editedScript];
            newScript[blockIndex] = { ...block, audioUrl: url };
            setEditedScript(newScript);
            onSave(newScript);
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
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>
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
                         <div key={block.id} className="group hover:bg-white/5 transition-colors rounded p-4 -mx-4 border border-transparent hover:border-white/5">
                             {block.type === 'narration' ? (
                                 <div className="text-[#a0a0a0] mb-2 uppercase tracking-wide leading-relaxed pl-8">
                                     {block.content}
                                     {!block.audioUrl && (
                                        <button 
                                            onClick={() => handleGenerateVoice(idx)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-[9px] uppercase text-slate-500 hover:text-cyan-400 border border-slate-700 px-2 py-0.5 rounded-full"
                                        >
                                            Generate Narration
                                        </button>
                                     )}
                                     {block.audioUrl && <InlineAudioPlayer url={block.audioUrl} />}
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
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] uppercase text-slate-500 hover:text-cyan-400 border border-slate-700 px-2 py-0.5 rounded-full"
                                        >
                                            Generate Dialogue
                                        </button>
                                     ) : (
                                         <InlineAudioPlayer url={block.audioUrl} />
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
