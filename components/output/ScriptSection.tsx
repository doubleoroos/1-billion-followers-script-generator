
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { CopyButton } from '../ui/CopyButton';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { useSound } from '../hooks/useSound';
import { generateScriptAudio, processInBatches } from '../../services/geminiService';

interface ScriptSectionProps {
    script: ScriptBlock[];
    characters: Character[];
    onSave: (newScript: ScriptBlock[]) => void;
}

const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;
const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const MagicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-slate-500">Unsaved...</span>;
    else if (status === 'saving') content = <span className="text-slate-500 flex items-center gap-2"><svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-600 flex items-center gap-1"><CheckmarkIcon />Saved</span>;
    else return <div className="h-4"></div>;
    return <div className="h-4 text-xs font-sans transition-opacity duration-300 text-right">{content}</div>;
};

const AutoSizingTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '0px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight + 'px';
        }
    }, [props.value]);

    return <textarea ref={textareaRef} {...props} />;
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const InlineAudioPlayer: React.FC<{ src: string; filename: string }> = ({ src, filename }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnd = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnd);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnd);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    return (
        <div className="w-full mt-3 bg-slate-100 rounded-full p-2 flex items-center gap-3 border border-slate-200 shadow-sm">
            <audio ref={audioRef} src={src} preload="metadata" />
            
            <button 
                onClick={togglePlay}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors"
            >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="flex-grow flex flex-col justify-center h-full">
                <input 
                    type="range" 
                    min="0" 
                    max={duration || 0} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
            </div>

            <span className="text-[10px] font-mono font-medium text-slate-500 w-16 text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <a 
                href={src} 
                download={filename}
                className="flex-shrink-0 p-2 text-slate-400 hover:text-violet-600 transition-colors"
                title="Download Audio Stem"
            >
                <DownloadIcon />
            </a>
        </div>
    );
};

// Audio Controls Component
const AudioBlockControls: React.FC<{ 
    block: ScriptBlock; 
    onGenerate: () => void; 
    isGenerating: boolean; 
}> = ({ block, onGenerate, isGenerating }) => {
    const playSound = useSound();
    
    if (block.audioUrl) {
        return (
            <div className="w-full mt-2">
                <InlineAudioPlayer 
                    src={block.audioUrl} 
                    filename={`voice_${block.type}_${block.id}.wav`} 
                />
                <div className="flex justify-end mt-1">
                     <button 
                        onClick={() => { playSound(); onGenerate(); }}
                        disabled={isGenerating}
                        className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-violet-500 flex items-center gap-1 transition-colors px-2 py-1 disabled:opacity-50"
                     >
                        {isGenerating ? (
                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                        ) : (
                            <RefreshIcon />
                        )}
                        {isGenerating ? 'Regenerating...' : 'Regenerate Voice'}
                     </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-end mt-2">
            <button 
                onClick={() => { playSound(); onGenerate(); }} 
                disabled={isGenerating}
                className="flex items-center gap-2 text-[10px] uppercase tracking-wide font-sans text-slate-400 hover:text-violet-600 transition-colors disabled:opacity-50"
            >
                {isGenerating ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                ) : (
                    <SpeakerIcon />
                )}
                {isGenerating ? 'Generating...' : 'Generate Voice'}
            </button>
        </div>
    );
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({ script, characters, onSave }) => {
    const playSound = useSound();
    const processedScript = useMemo(() => {
        const characterIdSet = new Set(characters.map(c => c.id));
        return script.map(block => {
            if (block.type === 'dialogue' && (!block.characterId || !characterIdSet.has(block.characterId))) {
                return { ...block, characterId: 'UNKNOWN_CHARACTER' };
            }
            return block;
        });
    }, [script, characters]);
    
    const [editedScript, setEditedScript] = useState<ScriptBlock[]>(processedScript);
    const { status, save } = useAutosave({ onSave, onSuccess: () => playSound('success') });
    const [generatingAudio, setGeneratingAudio] = useState<Set<string>>(new Set());
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);

    useEffect(() => {
        setEditedScript(processedScript);
    }, [processedScript]);

    const getCharacterName = (characterId?: string) => {
        if (!characterId) return 'NARRATOR';
        if (characterId === 'UNKNOWN_CHARACTER') {
            return 'UNKNOWN';
        }
        return characters.find(c => c.id === characterId)?.name.toUpperCase() || 'UNKNOWN';
    };

    const handleContentChange = (blockId: string, newContent: string) => {
        const newScript = editedScript.map(block => 
            block.id === blockId ? { ...block, content: newContent } : block
        );
        setEditedScript(newScript);
        save(newScript);
    };

    const handleGenerateAudio = async (block: ScriptBlock) => {
        setGeneratingAudio(prev => new Set(prev).add(block.id));
        try {
            // Determine voice
            let voice = 'Kore'; // Default for Narration
            if (block.type === 'dialogue' && block.characterId) {
                const char = characters.find(c => c.id === block.characterId);
                if (char && char.voicePreference) {
                    voice = char.voicePreference;
                }
            }

            const audioUrl = await generateScriptAudio(block.content, voice);
            
            const newScript = editedScript.map(b => 
                b.id === block.id ? { ...b, audioUrl } : b
            );
            setEditedScript(newScript);
            save(newScript);
        } catch (e) {
            console.error(e);
            alert("Failed to generate audio.");
        } finally {
            setGeneratingAudio(prev => {
                const next = new Set(prev);
                next.delete(block.id);
                return next;
            });
        }
    };

    const handleGenerateAllNarration = async () => {
        const narrationBlocks = editedScript.filter(b => b.type === 'narration' && !b.audioUrl);
        if (narrationBlocks.length === 0) return;

        setIsBulkGenerating(true);
        playSound();

        try {
            const results = await processInBatches<ScriptBlock, { id: string, audioUrl: string } | null>(
                narrationBlocks, 
                async (block) => {
                    try {
                         const audioUrl = await generateScriptAudio(block.content, 'Kore');
                         return { id: block.id, audioUrl };
                    } catch (e) {
                        console.error(`Failed to generate audio for block ${block.id}`, e);
                        return null;
                    }
                }, 
                3, 
                500
            ); // Batch size 3, delay 500ms

            setEditedScript(prev => {
                const newScript = [...prev];
                let hasChanges = false;
                results.forEach(res => {
                    if (res) {
                        const index = newScript.findIndex(b => b.id === res.id);
                        if (index !== -1) {
                            newScript[index] = { ...newScript[index], audioUrl: res.audioUrl };
                            hasChanges = true;
                        }
                    }
                });
                if (hasChanges) save(newScript);
                return newScript;
            });
            playSound('success');
        } catch (error) {
            console.error("Bulk generation failed", error);
            alert("Some narration audio failed to generate.");
        } finally {
            setIsBulkGenerating(false);
        }
    };

    const scriptToText = () => {
        return editedScript.map(block => {
            if (block.type === 'narration') {
                return `(NARRATION)\n${block.content}`;
            }
            const charName = getCharacterName(block.characterId);
            return `${charName}\n${block.content}`;
        }).join('\n\n');
    };
    
    const missingNarrationCount = editedScript.filter(b => b.type === 'narration' && !b.audioUrl).length;

    return (
        <div className="relative w-full max-w-4xl mx-auto">
             <div className="absolute top-0 right-0 transform translate-y-[-120%] flex items-center gap-3">
                 <SaveStatusIndicator status={status} />
                 <CopyButton textToCopy={scriptToText()} className="bg-slate-800 text-white border-slate-700" />
            </div>

            {/* Paper Container */}
            <div className="bg-[#fdfbf7] text-slate-900 font-mono text-base md:text-lg shadow-2xl rounded-sm min-h-[800px] p-12 md:p-20 relative overflow-hidden">
                {/* Hole punches simulation */}
                <div className="absolute left-4 top-1/4 w-4 h-4 rounded-full bg-slate-900/10 shadow-inner"></div>
                <div className="absolute left-4 top-1/2 w-4 h-4 rounded-full bg-slate-900/10 shadow-inner"></div>
                <div className="absolute left-4 top-3/4 w-4 h-4 rounded-full bg-slate-900/10 shadow-inner"></div>

                {/* Bulk Actions Header */}
                <div className="flex justify-end mb-8 pb-4 border-b border-slate-200">
                    <button
                        onClick={handleGenerateAllNarration}
                        disabled={isBulkGenerating || missingNarrationCount === 0}
                        className="text-xs uppercase tracking-widest font-bold text-violet-600 hover:text-violet-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        title={missingNarrationCount > 0 ? `Generate audio for ${missingNarrationCount} narration blocks` : 'All narration has audio'}
                    >
                        {isBulkGenerating ? (
                             <>
                                <div className="animate-spin h-3 w-3 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                                <span className="animate-pulse">Generating Audio...</span>
                             </>
                        ) : (
                             <>
                                <MagicIcon /> Generate All Narration ({missingNarrationCount})
                             </>
                        )}
                    </button>
                </div>

                <div className="space-y-8 max-w-3xl mx-auto">
                    {editedScript.map((block) => (
                        <div key={block.id} className="transition-opacity duration-300 group">
                            {block.type === 'narration' ? (
                                <div className="mb-2">
                                    <AutoSizingTextarea
                                        value={block.content.toUpperCase()}
                                        onChange={(e) => handleContentChange(block.id, e.target.value)}
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-900 leading-relaxed font-mono"
                                        style={{ fontWeight: 600 }}
                                        aria-label="Action Description"
                                    />
                                    <AudioBlockControls 
                                        block={block} 
                                        isGenerating={generatingAudio.has(block.id)}
                                        onGenerate={() => handleGenerateAudio(block)}
                                    />
                                </div>
                            ) : (
                               <div className="flex flex-col items-center mb-2">
                                    <div className="w-2/3 text-center mb-1">
                                        <p className="font-bold tracking-wide text-slate-900">{getCharacterName(block.characterId)}</p>
                                    </div>
                                    <div className="w-2/3">
                                        <AutoSizingTextarea
                                             value={block.content}
                                             onChange={(e) => handleContentChange(block.id, e.target.value)}
                                             className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-900 leading-relaxed text-center font-mono"
                                             aria-label={`Dialogue for ${getCharacterName(block.characterId)}`}
                                        />
                                    </div>
                                    <div className="w-2/3">
                                         <AudioBlockControls 
                                            block={block} 
                                            isGenerating={generatingAudio.has(block.id)}
                                            onGenerate={() => handleGenerateAudio(block)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <div className="mt-20 flex justify-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                        [ End of Scene ]
                    </div>
                </div>
            </div>
        </div>
    );
};
