
import React, { useState, useEffect } from 'react';
import type { Character } from '../../types';
import { useSound } from '../hooks/useSound';
import { generateCharacterPortrait } from '../../services/geminiService';

// Icons for buttons
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" /></svg>;

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
    const [editedImageUrl, setEditedImageUrl] = useState(character.imageUrl || '');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    
    const playSound = useSound();

    // Sync state with props if they change while not editing
    useEffect(() => {
        if (!isEditing) {
            setEditedName(character.name);
            setEditedDescription(character.description);
            setEditedRole(character.role);
            setEditedVoice(character.voicePreference || 'Kore');
            setEditedImageUrl(character.imageUrl || '');
        }
    }, [character, isEditing]);

    const handleSave = () => {
        onSave({
            ...character,
            name: editedName,
            description: editedDescription,
            role: editedRole,
            voicePreference: editedVoice,
            imageUrl: editedImageUrl,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedName(character.name);
        setEditedDescription(character.description);
        setEditedRole(character.role);
        setEditedVoice(character.voicePreference || 'Kore');
        setEditedImageUrl(character.imageUrl || '');
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

    const handleGeneratePortrait = async () => {
        setIsGeneratingImage(true);
        playSound();
        try {
            const url = await generateCharacterPortrait(character, 'cinematic'); // Defaulting to cinematic for portraits
            setEditedImageUrl(url);
            // Auto-save if not in full edit mode
            if (!isEditing) {
                onSave({ ...character, imageUrl: url });
            }
        } catch (e) {
            console.error("Failed to generate portrait", e);
            alert("Portrait generation failed.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div id={`character-card-${character.id}`} className="group relative flex flex-col h-full bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
            {/* Top Bar Decoration */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500/50 to-slate-500/50"></div>
            
            <div className="p-6 flex flex-col flex-grow">
                {isEditing ? (
                    <div className="space-y-4 animate-fade-in flex-grow">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                                <input
                                    type="text" value={editedRole} onChange={(e) => setEditedRole(e.target.value)}
                                    className="w-full bg-slate-950 p-2 rounded-lg text-cyan-300 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-bold"
                                    list={`roles-list-${character.id}`}
                                />
                                <datalist id={`roles-list-${character.id}`}>
                                    {COMMON_ROLES.map(role => <option key={role} value={role} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Voice Model</label>
                                <select
                                    value={editedVoice}
                                    onChange={(e) => setEditedVoice(e.target.value)}
                                    className="w-full bg-slate-950 p-2 rounded-lg text-white border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-medium cursor-pointer"
                                >
                                    {VOICE_OPTIONS.map(voice => (
                                        <option key={voice.value} value={voice.value}>{voice.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                            <input
                                type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)}
                                className="w-full bg-slate-950 p-2 rounded-lg text-white border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-lg font-bold"
                            />
                        </div>
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avatar URL</label>
                                <button 
                                    onClick={handleGeneratePortrait}
                                    disabled={isGeneratingImage}
                                    className="text-[9px] text-cyan-400 hover:text-white flex items-center gap-1 font-bold uppercase disabled:opacity-50"
                                >
                                    {isGeneratingImage ? 'Generating...' : <><SparklesIcon /> Generate AI Portrait</>}
                                </button>
                             </div>
                             <input
                                type="text" value={editedImageUrl} onChange={(e) => setEditedImageUrl(e.target.value)}
                                className="w-full bg-slate-950 p-2 rounded-lg text-slate-300 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dossier Description</label>
                            <textarea
                                value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={6}
                                className="w-full bg-slate-950 p-2 rounded-lg text-slate-300 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm leading-relaxed resize-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative group/avatar">
                                    {character.imageUrl ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-lg">
                                            <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleGeneratePortrait}
                                            disabled={isGeneratingImage}
                                            className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all disabled:opacity-50"
                                            title="Generate Portrait"
                                        >
                                            {isGeneratingImage ? (
                                                <div className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                                            ) : <SparklesIcon />}
                                        </button>
                                    )}
                                </div>

                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    {character.role}
                                </span>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                {VOICE_OPTIONS.find(v => v.value === character.voicePreference)?.label.split(' ')[0] || character.voicePreference || 'Default'}
                            </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{character.name}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{character.description}</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
                 {isEditing ? (
                    <div className="flex gap-2">
                        <button onClick={handleCancelClick} className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5">Cancel</button>
                        <button onClick={handleSaveClick} className="btn-glow flex items-center gap-1.5 px-4 rounded text-xs py-1.5">
                            <SaveIcon /> Save
                        </button>
                    </div>
                ) : (
                    <button onClick={handleEditClick} className="text-xs font-medium text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1">
                        <EditIcon /> Edit Profile
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto auto-rows-fr">
            {characters.map(char => (
                <CharacterCard key={char.id} character={char} onSave={handleCharacterUpdate} />
            ))}
        </div>
    );
};
