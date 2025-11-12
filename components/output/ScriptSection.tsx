
import React, { useState, useEffect, useMemo } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { CopyButton } from '../ui/CopyButton';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';

interface ScriptSectionProps {
    script: ScriptBlock[];
    characters: Character[];
    onSave: (newScript: ScriptBlock[]) => void;
}

// Helper components for status indicator
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-cyan">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Script updated.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300 text-right">{content}</div>;
};

// Autosizing textarea component
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
    const { status, save } = useAutosave({ onSave });

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
    
    const baseTextAreaClasses = "w-full bg-transparent p-1 -m-1 rounded-md focus:bg-black/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors duration-200 resize-none overflow-hidden leading-relaxed";

    return (
        <div className="relative panel-glass p-8 md:p-12 rounded-2xl max-w-4xl mx-auto font-mono text-text-primary/90 space-y-8">
            <CopyButton textToCopy={scriptToText()} />
             <div className="flex justify-end items-center -mb-6">
                <SaveStatusIndicator status={status} />
            </div>
            {editedScript.map((block) => (
                <div key={block.id} className="grid grid-cols-10 gap-6">
                    {block.type === 'narration' ? (
                        <div className="col-span-10 md:col-start-2 md:col-span-8">
                            <AutoSizingTextarea
                                value={block.content}
                                onChange={(e) => handleContentChange(block.id, e.target.value)}
                                className={`${baseTextAreaClasses} italic text-text-secondary`}
                                aria-label="Narration content"
                            />
                        </div>
                    ) : (
                       <>
                            <div className="col-span-10 sm:col-span-3 text-left sm:text-right font-bold text-violet-300 pr-4 pt-1">
                                <p>{getCharacterName(block.characterId)}</p>
                            </div>
                            <div className="col-span-10 sm:col-span-7">
                                <AutoSizingTextarea
                                     value={block.content}
                                     onChange={(e) => handleContentChange(block.id, e.target.value)}
                                     className={baseTextAreaClasses}
                                     aria-label={`Dialogue for ${getCharacterName(block.characterId)}`}
                                />
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};