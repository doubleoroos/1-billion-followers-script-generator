import React from 'react';
import type { ScriptBlock, Character } from '../../types';
import { CopyButton } from '../ui/CopyButton';

interface ScriptSectionProps {
    script: ScriptBlock[];
    characters: Character[];
    onSave: (newScript: ScriptBlock[]) => void;
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({ script, characters, onSave }) => {
    const getCharacterName = (characterId?: string) => {
        if (!characterId) return 'NARRATOR';
        return characters.find(c => c.id === characterId)?.name.toUpperCase() || 'UNKNOWN';
    };

    const scriptToText = () => {
        return script.map(block => {
            if (block.type === 'narration') {
                return `(NARRATION)\n${block.content}`;
            }
            const charName = getCharacterName(block.characterId);
            return `${charName}\n${block.content}`;
        }).join('\n\n');
    };

    return (
        <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 p-6 md:p-10 rounded-2xl max-w-4xl mx-auto font-mono text-gray-300 space-y-6 shadow-2xl">
            <CopyButton textToCopy={scriptToText()} />
            {script.map((block) => (
                <div key={block.id} className="grid grid-cols-4 gap-4">
                    {block.type === 'narration' ? (
                        <div className="col-span-4">
                            <p className="italic">{block.content}</p>
                        </div>
                    ) : (
                       <>
                            <div className="col-span-1 text-right font-bold text-white pr-4">
                                <p>{getCharacterName(block.characterId)}</p>
                            </div>
                            <div className="col-span-3">
                                <p>{block.content}</p>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};
