import React, { useState } from 'react';
import type { Character } from '../../types';

// Icons for buttons
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const COMMON_ROLES = ['Protagonist', 'Antagonist', 'Mentor', 'Supporting Character', 'Cameo'];

interface CharacterCardProps {
    character: Character;
    onSave: (updatedCharacter: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(character.name);
    const [editedDescription, setEditedDescription] = useState(character.description);
    const [editedRole, setEditedRole] = useState(character.role);

    const handleSave = () => {
        onSave({
            ...character,
            name: editedName,
            description: editedDescription,
            role: editedRole,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedName(character.name);
        setEditedDescription(character.description);
        setEditedRole(character.role);
        setIsEditing(false);
    };

    return (
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 text-center shadow-lg flex flex-col h-full">
            <div className="flex-grow">
                {isEditing ? (
                    <div className="space-y-4 text-left">
                        <div>
                            <label htmlFor={`role-${character.id}`} className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                            <input
                                id={`role-${character.id}`} type="text" value={editedRole} onChange={(e) => setEditedRole(e.target.value)}
                                className="w-full bg-black/30 p-2 rounded-lg text-cyan-lum border border-white/20 focus:border-cyan-lum focus:ring-cyan-lum text-sm font-semibold uppercase tracking-wider"
                                placeholder="e.g., Protagonist" list={`roles-list-${character.id}`}
                            />
                            <datalist id={`roles-list-${character.id}`}>
                                {COMMON_ROLES.map(role => <option key={role} value={role} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor={`name-${character.id}`} className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                            <input
                                id={`name-${character.id}`} type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)}
                                className="w-full bg-black/30 p-2 rounded-lg text-violet-glow border border-white/20 focus:border-violet-glow focus:ring-violet-glow text-2xl font-bold"
                            />
                        </div>
                        <div>
                            <label htmlFor={`desc-${character.id}`} className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                id={`desc-${character.id}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={3}
                                className="w-full bg-black/30 p-2 rounded-lg text-gray-300 border border-white/20 focus:border-violet-glow focus:ring-violet-glow italic"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-lum mb-2">{character.role}</p>
                        <h3 className="text-2xl font-bold text-violet-glow">{character.name}</h3>
                        <p className="text-gray-300 italic mt-3 text-base">{character.description}</p>
                    </>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-full">Cancel</button>
                        <button
                            onClick={handleSave}
                            className="btn-3d flex items-center gap-2 bg-gradient-action text-blue-darker font-bold py-2 px-4 rounded-full text-sm border border-white/20"
                        >
                            <SaveIcon />
                            Save
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-3d flex items-center gap-2 bg-gradient-neutral text-rose-gray font-semibold py-2 px-4 rounded-full text-sm border border-white/10"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {characters.map(char => (
                <CharacterCard key={char.id} character={char} onSave={handleCharacterUpdate} />
            ))}
        </div>
    );
};