import React, { useState } from 'react';
import type { Character } from '../../types';

// Icons for buttons
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

interface CharacterCardProps {
    character: Character;
    onSave: (updatedCharacter: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(character.name);
    const [editedDescription, setEditedDescription] = useState(character.description);

    const handleSave = () => {
        onSave({
            ...character,
            name: editedName,
            description: editedDescription,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedName(character.name);
        setEditedDescription(character.description);
        setIsEditing(false);
    };

    return (
        <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-xl p-6 text-center shadow-lg flex flex-col h-full">
            <div className="flex-grow">
                {isEditing ? (
                    <div className="space-y-4 text-left">
                        <div>
                            <label htmlFor={`name-${character.id}`} className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                            <input
                                id={`name-${character.id}`}
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="w-full bg-gray-900/60 p-2 rounded-md text-violet-glow border border-white/20 focus:border-violet-glow focus:ring-violet-glow text-xl font-bold"
                            />
                        </div>
                        <div>
                            <label htmlFor={`desc-${character.id}`} className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                id={`desc-${character.id}`}
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-gray-900/60 p-2 rounded-md text-gray-300 border border-white/20 focus:border-violet-glow focus:ring-violet-glow italic"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-violet-glow">{character.name}</h3>
                        <p className="text-gray-300 italic mt-2">{character.description}</p>
                    </>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1 rounded-md">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-mint-glow text-blue-darker font-semibold py-1 px-3 rounded-lg text-sm transition-transform transform hover:scale-105"
                        >
                            <SaveIcon />
                            Save
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-colors border border-white/10"
                    >
                        <EditIcon />
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
};

interface CharactersSectionProps {
    characters: Character[];
    onSave: (chars: Character[]) => void;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({ characters, onSave }) => {
    
    const handleCharacterUpdate = (updatedCharacter: Character) => {
        const newCharacters = characters.map(char =>
            char.id === updatedCharacter.id ? updatedCharacter : char
        );
        onSave(newCharacters);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {characters.map(char => (
                <CharacterCard key={char.id} character={char} onSave={handleCharacterUpdate} />
            ))}
        </div>
    );
};