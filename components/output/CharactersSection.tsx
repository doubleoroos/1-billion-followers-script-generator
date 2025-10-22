import React from 'react';
import type { Character } from '../../types';

interface CharactersSectionProps {
    characters: Character[];
    onSave: (chars: Character[]) => void;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({ characters, onSave }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {characters.map(char => (
                <div key={char.id} className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-xl p-6 text-center shadow-lg">
                    <h3 className="text-xl font-bold text-violet-glow">{char.name}</h3>
                    <p className="text-gray-300 italic mt-2">{char.description}</p>
                </div>
            ))}
        </div>
    );
};
