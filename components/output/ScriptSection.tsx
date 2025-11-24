
import React, { useState, useEffect, useMemo } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { CopyButton } from '../ui/CopyButton';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { useSound } from '../hooks/useSound';

interface ScriptSectionProps {
    script: ScriptBlock[];
    characters: Character[];
    onSave: (newScript: ScriptBlock[]) => void;
}

const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;

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

    const scriptToText = () => {
        return editedScript.map(block => {
            if (block.type === 'narration') {
                return `(NARRATION)\n${block.content}`;
            }
            const charName = getCharacterName(block.characterId);
            return `${charName}\n${block.content}`;
        }).join('\n\n');
    };
    
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

                <div className="space-y-6 max-w-3xl mx-auto">
                    {editedScript.map((block) => (
                        <div key={block.id} className="transition-opacity duration-300">
                            {block.type === 'narration' ? (
                                <div className="mb-6">
                                    <AutoSizingTextarea
                                        value={block.content.toUpperCase()}
                                        onChange={(e) => handleContentChange(block.id, e.target.value)}
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-slate-900 leading-relaxed font-mono"
                                        style={{ fontWeight: 600 }} // Action lines often slightly bolder or standard
                                        aria-label="Action Description"
                                    />
                                </div>
                            ) : (
                               <div className="flex flex-col items-center mb-6">
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
