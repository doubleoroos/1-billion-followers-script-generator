
import React, { useState, useEffect } from 'react';
import type { Character } from '../../types';
import { useSound } from '../hooks/useSound';

// Icons for buttons
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

const COMMON_ROLES = ['Protagonist', 'Antagonist', 'Mentor', 'Supporting Character', 'Cameo'];

const VOICE_OPTIONS = [
    { value: 'Kore', label: 'Kore (Female - Balanced)' },
    { value: 'Zephyr', label: 'Zephyr (Female - Soft)' },
    { value: 'Puck', label: 'Puck (Male - Resonant)' },
    { value: 'Fenrir', label: 'Fenrir (Male - Deep)' },
    { value: 'Charon', label: 'Charon (Male - Authoritative)' },
];

interface CharacterCardProps {
    character: Character;
    onSave: (updatedCharacter: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(character.name);
    const [editedDescription, setEditedDescription] = useState(character.description);
    const [editedRole, setEditedRole] = useState(character.role);
    const [editedVoice, setEditedVoice] = useState(character.voicePreference || 'Kore');
    
    const playSound = useSound();

    // Sync state with props if they change while not editing
    useEffect(() => {
        if (!isEditing) {
            setEditedName(character.name);
            setEditedDescription(character.description);
            setEditedRole(character.role);
            setEditedVoice(character.voicePreference || 'Kore');
        }
    }, [character, isEditing]);

    const handleSave = () => {
        onSave({
            ...character,
            name: editedName,
            description: editedDescription,
            role: editedRole,
            voicePreference: editedVoice,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedName(character.name);
        setEditedDescription(character.description);
        setEditedRole(character.role);
        setEditedVoice(character.voicePreference || 'Kore');
        setIsEditing(false);
    };
    
    const handleSaveClick = () => {
        playSound('success');
        handleSave();
    };

    const handleCancelClick = () => {
        playSound();
        handleCancel();
    };
    
    const handleEditClick = () => {
        playSound();
        setIsEditing(true);
    };

    return (
        <div id={`character-card-${character.id}`} className="panel-glass rounded-2xl p-6 text-center flex flex-col h-full relative overflow-hidden group transition-all duration-500">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -z-10 transition-opacity opacity-50 group-hover:opacity-100"></div>

            <div className="flex-grow">
                {isEditing ? (
                    <div className="space-y-4 text-left animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor={`role-${character.id}`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                                <input
                                    id={`role-${character.id}`} type="text" value={editedRole} onChange={(e) => setEditedRole(e.target.value)}
                                    className="w-full bg-black/30 p-2 rounded-lg text-cyan border border-white/10 focus:border-cyan focus:ring-1 focus:ring-cyan text-sm font-semibold"
                                    placeholder="e.g., Protagonist" list={`roles-list-${character.id}`}
                                />
                                <datalist id={`roles-list-${character.id}`}>
                                    {COMMON_ROLES.map(role => <option key={role} value={role} />)}
                                </datalist>
                            </div>
                            <div>
                                <label htmlFor={`voice-${character.id}`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Voice</label>
                                <select
                                    id={`voice-${character.id}`}
                                    value={editedVoice}
                                    onChange={(e) => setEditedVoice(e.target.value)}
                                    className="w-full bg-black/30 p-2 rounded-lg text-white border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm font-semibold appearance-none cursor-pointer"
                                >
                                    {VOICE_OPTIONS.map(voice => (
                                        <option key={voice.value} value={voice.value} className="bg-slate-900 text-white">
                                            {voice.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor={`name-${character.id}`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                            <input
                                id={`name-${character.id}`} type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)}
                                className="w-full bg-black/30 p-2 rounded-lg text-violet-300 border border-white/10 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 text-xl font-bold"
                            />
                        </div>
                        <div>
                            <label htmlFor={`desc-${character.id}`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                            <textarea
                                id={`desc-${character.id}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={4}
                                className="w-full bg-black/30 p-2 rounded-lg text-text-primary/90 border border-white/10 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 text-sm leading-relaxed resize-none"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start w-full mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan py-1 px-2 rounded-md bg-cyan-900/20 border border-cyan-500/30">
                                {character.role}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 bg-white/5" title="Voice Preference">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                {VOICE_OPTIONS.find(v => v.value === character.voicePreference)?.label.split(' ')[0] || character.voicePreference || 'Default'}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 text-left tracking-tight">{character.name}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed text-left line-clamp-4">{character.description}</p>
                    </>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-white/5">
                {isEditing ? (
                    <>
                        <button onClick={handleCancelClick} className="text-xs text-text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-full">Cancel</button>
                        <button
                            onClick={handleSaveClick}
                            className="btn-glow flex items-center gap-2 bg-primary-action-gradient text-white font-bold py-1.5 px-4 rounded-full text-xs"
                        >
                            <SaveIcon />
                            Save
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleEditClick}
                        className="btn-glass flex items-center gap-2 font-semibold py-1.5 px-4 rounded-full text-xs hover:bg-white/10"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {characters.map(char => (
                <CharacterCard key={char.id} character={char} onSave={handleCharacterUpdate} />
            ))}
        </div>
    );
};
