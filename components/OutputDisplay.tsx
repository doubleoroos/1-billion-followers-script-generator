import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedAssets, ScriptBlock, Scene, Character, ReferenceImage, VisualStyle } from '../types';
import { generateVideoForScene } from '../services/geminiService';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void;
  onOutlineSave: (newOutline: Scene[]) => void;
  onBtsSave: (newBtsDoc: string) => void;
  onVideoSave: (updatedScene: Scene) => void;
  isLoading: boolean;
  visualStyle: VisualStyle;
}

type Tab = 'script' | 'outline' | 'images' | 'bts' | 'video';
type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';


// Icons
const ScriptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const OutlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ImagesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const BtsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const CheckmarkIcon = () => (
    <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} />
    </svg>
);


const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content = null;
    switch (status) {
        case 'dirty':
            content = <span className="text-amber-400">Unsaved changes...</span>;
            break;
        case 'saving':
            content = (
                <span className="text-cyan-400 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                </span>
            );
            break;
        case 'saved':
            content = (
                <span className="text-green-400 flex items-center gap-2">
                    <CheckmarkIcon />
                    All changes saved
                </span>
            );
            break;
        default: // clean
            return <div className="h-5"></div>; // Keep space consistent
    }
    return <div className="h-5 text-sm transition-opacity duration-300">{content}</div>;
};

// Autosave hook
function useAutosave<T>({ onSave, delay = 1500 }: { onSave: (data: T) => void, delay?: number }) {
    const [status, setStatus] = useState<SaveStatus>('clean');
    const timeoutRef = useRef<number | null>(null);
    const dataRef = useRef<T | undefined>(undefined);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    const save = useCallback((newData: T) => {
        dataRef.current = newData;
        if (status !== 'saving') {
            setStatus('dirty');
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            if (dataRef.current !== undefined) {
                setStatus('saving');
                try {
                    onSaveRef.current(dataRef.current);
                    setStatus('saved');
                } catch (error) {
                    console.error("Autosave failed:", error);
                    setStatus('dirty'); 
                }
            }
        }, delay);
    }, [delay, status]);

    useEffect(() => {
        let savedTimeout: number;
        if (status === 'saved') {
            savedTimeout = window.setTimeout(() => {
                setStatus('clean');
            }, 2000);
        }
        return () => {
            clearTimeout(savedTimeout);
        };
    }, [status]);
    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, []);

    return { status, save };
}

const TabButton = ({ isActive, onClick, children, icon, id, panelId, style }: { isActive: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode, id: string, panelId: string, style?: React.CSSProperties }) => (
    <button
        id={id}
        role="tab"
        aria-selected={isActive}
        aria-controls={panelId}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold text-sm rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 animate-fade-in ${
            isActive
                ? 'bg-[#161b22]/80 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-800/30 hover:text-white'
        }`}
        style={style}
    >
        {icon}
        {children}
    </button>
);

const ScriptPanel: React.FC<{ script: ScriptBlock[], characters: Character[], onSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void }> = ({ script, characters, onSave }) => {
    const [editedScript, setEditedScript] = useState(script);
    const [editedCharacters, setEditedCharacters] = useState(characters);
    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    const { status, save } = useAutosave({ 
        onSave: (data: { script: ScriptBlock[], characters: Character[] }) => onSave(data.script, data.characters) 
    });

    useEffect(() => {
        setEditedScript(script);
        setEditedCharacters(characters);
    }, [script, characters]);

    useEffect(() => {
        if (isCharacterModalOpen && firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, [isCharacterModalOpen]);
    
    const getCharacterName = (characterId?: string) => {
        if (!characterId) return 'Narrator';
        return editedCharacters.find(c => c.id === characterId)?.name || 'Unknown Character';
    };

    const handleContentChange = (index: number, content: string) => {
        const newScript = [...editedScript];
        newScript[index] = {...newScript[index], content};
        setEditedScript(newScript);
        save({ script: newScript, characters: editedCharacters });
    };

    const handleCharacterAssignmentChange = (index: number, characterId: string) => {
        const newScript = [...editedScript];
        newScript[index] = {...newScript[index], characterId};
        setEditedScript(newScript);
        save({ script: newScript, characters: editedCharacters });
    };

    const openCharacterModal = (char: Character | null) => {
        triggerRef.current = document.activeElement as HTMLElement;
        setEditingCharacter(char ? {...char} : {id: '', name: '', description: ''});
        setIsCharacterModalOpen(true);
    };

    const closeCharacterModal = () => {
        setIsCharacterModalOpen(false);
        triggerRef.current?.focus();
    }

    const handleCharacterSave = () => {
        if (!editingCharacter || !editingCharacter.name.trim()) return;
        let newChars;
        if (editingCharacter.id) {
            newChars = editedCharacters.map(c => c.id === editingCharacter.id ? editingCharacter : c);
        } else {
            newChars = [...editedCharacters, {...editingCharacter, id: `char_${Math.random().toString(36).substring(2, 9)}` }];
        }
        setEditedCharacters(newChars);
        save({ script: editedScript, characters: newChars });
        closeCharacterModal();
        setEditingCharacter(null);
    }
    
    return (
      <div className="bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h3 className="text-xl font-bold text-white">Script & Characters</h3>
            <SaveStatusIndicator status={status} />
        </div>
        <div className="space-y-6">
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-cyan-400">Characters</h4>
                    <button onClick={() => openCharacterModal(null)} className="text-sm bg-cyan-900/40 border border-cyan-700/50 text-cyan-300 font-semibold py-1 px-3 rounded-md transition-all duration-200 hover:bg-cyan-800/60 active:scale-[0.98]">+ Add</button>
                 </div>
                <div className="space-y-4">
                    {editedCharacters.map((char) => (
                        <div key={char.id} className="group relative pr-8">
                            <p className="font-bold text-white">{char.name}</p>
                            <p className="text-gray-300 italic">{char.description}</p>
                            <button onClick={() => openCharacterModal(char)} className="absolute top-1 right-0 text-gray-400 hover:text-white opacity-20 group-hover:opacity-100 transition-opacity">
                                <EditIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-cyan-400 mb-2 mt-4">Script</h4>
                <div className="space-y-6 max-w-none font-mono">
                    {editedScript.map((block, index) => (
                        <div key={block.id} className="flex flex-col gap-2">
                            {block.type === 'dialogue' ? (
                                <select 
                                    value={block.characterId || ''}
                                    onChange={(e) => handleCharacterAssignmentChange(index, e.target.value)}
                                    className="w-full max-w-xs bg-gray-900/50 border border-gray-700 rounded p-2 text-white font-bold uppercase focus:ring-cyan-400 focus:border-cyan-400 transition"
                                >
                                    <option value="" disabled>-- Assign Character --</option>
                                    {editedCharacters.map(char => (
                                        <option key={char.id} value={char.id}>{char.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="font-bold text-white uppercase">{getCharacterName(block.characterId)}</p>
                            )}
                            <textarea value={block.content} onChange={(e) => handleContentChange(index, e.target.value)}
                              className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-300 font-mono focus:ring-cyan-400 focus:border-cyan-400" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {isCharacterModalOpen && editingCharacter && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={closeCharacterModal}>
                <div className="bg-[#161b22] p-6 rounded-xl border border-white/10 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">{editingCharacter.id ? 'Edit' : 'Add'} Character</h3>
                    <div className="space-y-4">
                        <input ref={firstInputRef} type="text" placeholder="Name" value={editingCharacter.name} onChange={e => setEditingCharacter({...editingCharacter, name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-white" />
                        <textarea placeholder="Description" value={editingCharacter.description} onChange={e => setEditingCharacter({...editingCharacter, description: e.target.value})} className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-2 text-white" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={closeCharacterModal} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-transform active:scale-[0.98]">Cancel</button>
                        <button onClick={handleCharacterSave} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-transform active:scale-[0.98]">Save</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

const SceneEditModal: React.FC<{ scene: Scene; onSave: (scene: Scene) => void; onClose: () => void; }> = ({ scene, onSave, onClose }) => {
    const [localScene, setLocalScene] = useState<Scene>(scene);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    const handleInputChange = (field: keyof Scene, value: string) => {
        setLocalScene(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(localScene);
    };

    const ModalField: React.FC<{ field: keyof Scene, label: string, isTextarea?: boolean, placeholder?: string, inputRef?: React.Ref<HTMLInputElement> }> = ({ field, label, isTextarea, placeholder, inputRef }) => {
        const value = localScene[field] as string;
        const commonClasses = "w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-white focus:ring-cyan-400 focus:border-cyan-400";
        return (
            <div>
                <label className="block text-gray-400 font-semibold mb-1">{label}</label>
                {isTextarea ? (
                    <textarea
                        value={value}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={`${commonClasses} h-28 min-h-[40px]`}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={commonClasses}
                        placeholder={placeholder}
                    />
                )}
            </div>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-[#161b22] p-6 rounded-xl border border-white/10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-6">Edit Scene</h3>
                <div className="space-y-4">
                    <ModalField field="title" label="Scene Title" inputRef={firstInputRef} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ModalField field="location" label="Location" />
                        <ModalField field="timeOfDay" label="Time of Day" />
                    </div>
                    <ModalField field="atmosphere" label="Atmosphere" />
                    <ModalField field="description" label="Description" isTextarea />
                     <ModalField 
                        field="videoPrompt" 
                        label="Video Generation Prompt" 
                        isTextarea 
                        placeholder="Describe the video you want to generate. If empty, a prompt is created from scene details."
                    />
                    <ModalField field="keyVisualElements" label="Key Visual Elements" isTextarea />
                    <ModalField field="visuals" label="Visuals" isTextarea />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ModalField field="pacingEmotion" label="Pacing & Emotion" />
                        <ModalField field="transition" label="Transition" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Cancel</button>
                    <button onClick={handleSave} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Save Changes</button>
                </div>
            </div>
        </div>
    )
};


const OutlinePanel: React.FC<{ outline: Scene[], onSave: (newOutline: Scene[]) => void, onVideoSave: (updatedScene: Scene) => void, visualStyle: VisualStyle }> = ({ outline, onSave, onVideoSave, visualStyle }) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
    const [editingScene, setEditingScene] = useState<Scene | null>(null);
    const [generationStatus, setGenerationStatus] = useState<Record<string, { status: 'idle' | 'loading' | 'error', error?: string }>>({});
    const [liftedSceneId, setLiftedSceneId] = useState<string | null>(null);
    const [liveRegionMessage, setLiveRegionMessage] = useState('');

    const { status, save } = useAutosave({ onSave });

    const triggerRef = useRef<HTMLElement | null>(null);
    const sceneRefs = useRef(new Map<string, HTMLDivElement | null>());
    const dragItem = useRef<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        setEditedOutline(outline);
    }, [outline]);
    
    useEffect(() => {
      if (liftedSceneId) {
        sceneRefs.current.get(liftedSceneId)?.focus();
      }
    }, [editedOutline, liftedSceneId])

    const handleDeleteClick = (scene: Scene) => {
        triggerRef.current = document.activeElement as HTMLElement;
        setSceneToDelete(scene);
    };
    
    const handleEditClick = (scene: Scene) => {
        triggerRef.current = document.activeElement as HTMLElement;
        setEditingScene(scene);
    }
    
    const closeModal = () => {
        setSceneToDelete(null);
        setEditingScene(null);
        triggerRef.current?.focus();
    }

    const handleConfirmDelete = () => {
        if (!sceneToDelete) return;
        const newOutline = editedOutline.filter(s => s.id !== sceneToDelete.id);
        setEditedOutline(newOutline);
        save(newOutline);
        closeModal();
    };
    
    const handleModalSave = (updatedScene: Scene) => {
        const newOutline = editedOutline.map(s => s.id === updatedScene.id ? updatedScene : s);
        setEditedOutline(newOutline);
        save(newOutline);
        closeModal();
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        if (index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = () => {
        if (dragItem.current === null || dragOverIndex === null || dragItem.current === dragOverIndex) {
            handleDragEnd();
            return;
        }
        const newOutline = [...editedOutline];
        const [draggedItemContent] = newOutline.splice(dragItem.current, 1);
        newOutline.splice(dragOverIndex, 0, draggedItemContent);
        setEditedOutline(newOutline);
        save(newOutline);
        handleDragEnd();
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleAddNewScene = () => {
        const newScene: Scene = {
            id: `scene_${editedOutline.length}_${Math.random().toString(36).substring(2, 9)}`,
            title: `Scene ${editedOutline.length + 1}: [New Scene Title]`,
            location: '',
            timeOfDay: '',
            atmosphere: '',
            description: '',
            keyVisualElements: '',
            visuals: '',
            transition: '',
            pacingEmotion: '',
            videoPrompt: '',
        };
        const newOutline = [...editedOutline, newScene];
        setEditedOutline(newOutline);
        save(newOutline);
    };

    const handleDuplicateScene = (sceneToDuplicate: Scene, index: number) => {
        const newScene: Scene = {
            ...JSON.parse(JSON.stringify(sceneToDuplicate)),
            id: `scene_${editedOutline.length}_${Math.random().toString(36).substring(2, 9)}`,
            title: `${sceneToDuplicate.title} (Copy)`,
        };
        
        const newOutline = [...editedOutline];
        newOutline.splice(index + 1, 0, newScene);
        
        setEditedOutline(newOutline);
        save(newOutline);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, scene: Scene, index: number) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (liftedSceneId === scene.id) {
                setLiftedSceneId(null);
                setLiveRegionMessage(`${scene.title} dropped at position ${index + 1}.`);
            } else {
                setLiftedSceneId(scene.id);
                setLiveRegionMessage(`${scene.title} lifted. Use arrow keys to move.`);
            }
        }
        
        if (liftedSceneId === scene.id) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (index > 0) {
                    const newOutline = [...editedOutline];
                    [newOutline[index], newOutline[index - 1]] = [newOutline[index - 1], newOutline[index]];
                    setEditedOutline(newOutline);
                    save(newOutline);
                    setLiveRegionMessage(`${scene.title} moved to position ${index}.`);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (index < editedOutline.length - 1) {
                    const newOutline = [...editedOutline];
                    [newOutline[index], newOutline[index + 1]] = [newOutline[index + 1], newOutline[index]];
                    setEditedOutline(newOutline);
                    save(newOutline);
                    setLiveRegionMessage(`${scene.title} moved to position ${index + 2}.`);
                }
            } else if (e.key === 'Escape') {
                setLiftedSceneId(null);
                setLiveRegionMessage(`Reordering cancelled.`);
            }
        }
    };


    const handlePromptChange = (index: number, prompt: string) => {
        const newOutline = [...editedOutline];
        newOutline[index] = { ...newOutline[index], videoPrompt: prompt };
        setEditedOutline(newOutline);
        save(newOutline);
    };

    const handleGenerateVideo = async (scene: Scene) => {
        setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'loading' } }));
        try {
            const downloadLink = await generateVideoForScene(scene, visualStyle);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            
            onVideoSave({ ...scene, videoUrl: finalUrl });
            setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'idle' } }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'error', error: errorMessage } }));
        }
    };

    const InfoField: React.FC<{label: string, value: string | undefined, fullWidth?: boolean}> = ({ label, value, fullWidth = false }) => (
        <div className={fullWidth ? 'md:col-span-2' : ''}>
            <p className="block text-gray-400 font-semibold mb-1">{label}</p>
            <p className="text-gray-200 bg-gray-900/40 p-2 rounded-md min-h-[2.5rem] whitespace-pre-wrap">{value || '...'}</p>
        </div>
    );
    
    return (
        <div>
            <div className="flex justify-end items-center mb-4 px-1">
                <SaveStatusIndicator status={status} />
            </div>
            <div className="space-y-6" onDragLeave={handleDragEnd}>
                {editedOutline.map((scene, index) => {
                    const isDraggedOver = dragOverIndex === index && draggedIndex !== index;
                    const isLifted = liftedSceneId === scene.id;
                    return (
                        <div 
                            key={scene.id}
                            ref={node => { sceneRefs.current.set(scene.id, node); }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onKeyDown={(e) => handleKeyDown(e, scene, index)}
                            tabIndex={0}
                            aria-roledescription="Draggable scene. Press Space or Enter to lift, arrow keys to move, and Space or Enter again to drop."
                            className={`relative bg-gradient-to-br from-gray-900/20 to-gray-800/10 rounded-xl p-6 transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#0D1117]
                                ${draggedIndex === index ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}
                                ${isLifted ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0D1117] shadow-2xl' : ''}
                                ${draggedIndex !== null ? 'border-transparent' : 'border-white/10'}
                                ${draggedIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
                                ${liftedSceneId ? 'cursor-move' : ''}
                                ${isLifted ? '-translate-y-1 shadow-2xl' : ''}
                            `}
                        >
                            { isDraggedOver && <div className="absolute top-0 left-6 right-6 h-1 bg-cyan-400 rounded-full animate-pulse"></div> }
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h4 className="text-xl font-bold text-white flex-grow">{scene.title}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => handleDuplicateScene(scene, index)} title="Duplicate Scene" className="p-2 rounded-full text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200 active:scale-[0.9]">
                                        <DuplicateIcon />
                                    </button>
                                    <button onClick={() => handleEditClick(scene)} title="Edit Scene" className="p-2 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 active:scale-[0.9]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => handleDeleteClick(scene)} title="Delete Scene" className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 active:scale-[0.9]">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                               <InfoField label="Location" value={scene.location} />
                               <InfoField label="Time of Day" value={scene.timeOfDay} />
                               <InfoField label="Atmosphere" value={scene.atmosphere} fullWidth />
                               <InfoField label="Description" value={scene.description} fullWidth />

                                <div className="md:col-span-2 mt-4 pt-4 border-t border-white/10">
                                     <div className="mb-4">
                                        <label htmlFor={`prompt-${scene.id}`} className="block text-gray-400 font-semibold mb-2">Video Generation Prompt</label>
                                        <textarea
                                            id={`prompt-${scene.id}`}
                                            value={scene.videoPrompt || ''}
                                            onChange={(e) => handlePromptChange(index, e.target.value)}
                                            placeholder="Describe the video you want to generate for this scene. If empty, a prompt is generated from scene details."
                                            className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-300 font-sans focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                    
                                    {scene.videoUrl && (
                                        <div>
                                            <h5 className="font-semibold text-gray-400 mb-2">Generated Video</h5>
                                            <video src={scene.videoUrl} controls className="w-full rounded-lg bg-black aspect-video"></video>
                                        </div>
                                    )}

                                    {!scene.videoUrl && (() => {
                                        const statusInfo = generationStatus[scene.id] || { status: 'idle' };
                                        const isLoading = statusInfo.status === 'loading';
                                        
                                        switch (statusInfo.status) {
                                            case 'loading':
                                                return (
                                                    <div className="flex flex-col items-center justify-center bg-black/20 p-6 rounded-lg aspect-video">
                                                        <svg className="animate-spin h-8 w-8 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        <p className="text-white font-semibold">Generating video...</p>
                                                        <p className="text-gray-400 text-sm mt-1">This can take a few minutes.</p>
                                                    </div>
                                                );
                                            case 'error':
                                                return (
                                                    <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex-grow">
                                                            <p className="font-semibold text-white flex items-center gap-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Generation Failed
                                                            </p>
                                                            <p className="text-sm text-red-300 mt-1 pl-7">{statusInfo.error}</p>
                                                        </div>
                                                        <button onClick={() => handleGenerateVideo(scene)} className="text-sm bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-all flex-shrink-0 self-end sm:self-center active:scale-[0.98]">Retry Generation</button>
                                                    </div>
                                                );
                                            default: // 'idle'
                                                return (
                                                    <button
                                                        onClick={() => handleGenerateVideo(scene)}
                                                        disabled={isLoading}
                                                        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed"
                                                    >
                                                        <VideoIcon />
                                                        Generate Scene Video
                                                    </button>
                                                );
                                        }
                                    })()}
                                </div>

                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleAddNewScene}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-cyan-300 bg-cyan-900/40 border border-cyan-700/50 rounded-lg hover:bg-cyan-800/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161b22] focus:ring-cyan-400 active:scale-[0.98]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Scene
                </button>
            </div>

            {editingScene && (
                <SceneEditModal 
                    scene={editingScene}
                    onSave={handleModalSave}
                    onClose={closeModal}
                />
            )}

            {sceneToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={closeModal}>
                    <div className="bg-[#161b22] p-6 rounded-xl border border-red-500/30 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-300 mt-3 mb-6">Are you sure you want to permanently delete the scene: <strong className="text-white">"{sceneToDelete.title}"</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeModal} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Cancel</button>
                            <button onClick={handleConfirmDelete} className="text-sm bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Delete Scene</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Live region for screen reader announcements */}
            <div className="sr-only" aria-live="assertive" aria-atomic="true">{liveRegionMessage}</div>
        </div>
    );
};


const ImagesPanel: React.FC<{ images: ReferenceImage[] }> = ({ images }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map(image => (
                <div key={image.title} className="bg-gray-900/20 rounded-xl overflow-hidden border border-white/10">
                    <img src={image.imageUrl} alt={image.title} className="w-full h-auto object-cover aspect-video" />
                    <div className="p-4">
                        <h4 className="font-bold text-white">{image.title}</h4>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BtsPanel: React.FC<{ document: string, onSave: (newDoc: string) => void }> = ({ document, onSave }) => {
    const [editedDoc, setEditedDoc] = useState(document);
    const { status, save } = useAutosave({ onSave });
    
    useEffect(() => {
        setEditedDoc(document);
    }, [document]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newDoc = e.target.value;
        setEditedDoc(newDoc);
        save(newDoc);
    };

    return (
        <div className="bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-white/10 rounded-xl p-6 mb-6">
             <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xl font-bold text-white">Behind The Scenes Document</h3>
                <SaveStatusIndicator status={status} />
            </div>
            <textarea
                value={editedDoc}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 text-gray-300 focus:ring-cyan-400 focus:border-cyan-400"
                rows={20}
            />
        </div>
    );
};

const VideoPanel: React.FC<{ outline: Scene[], visualStyle: VisualStyle, onSave: (updatedScene: Scene) => void }> = ({ outline, visualStyle, onSave }) => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<Record<string, { status: 'idle' | 'loading' | 'error', error?: string }>>({});
  const [downloadingSceneId, setDownloadingSceneId] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
        setIsCheckingApiKey(true);
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } else {
            console.warn("aistudio API not available.");
            setApiKeySelected(false); 
        }
        setIsCheckingApiKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
    }
  };

  const handleGenerateVideo = async (scene: Scene) => {
    setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'loading' } }));
    try {
        const downloadLink = await generateVideoForScene(scene, visualStyle);
        const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        
        onSave({ ...scene, videoUrl: finalUrl });
        setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'idle' } }));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setGenerationStatus(prev => ({ ...prev, [scene.id]: { status: 'error', error: errorMessage } }));

        if (errorMessage.includes("Requested entity was not found")) {
            setApiKeySelected(false);
        }
    }
  };
  
  const handleDownloadVideo = async (scene: Scene) => {
    if (!scene.videoUrl) return;
    setDownloadingSceneId(scene.id);
    try {
        const response = await fetch(scene.videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const filename = `${scene.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Download failed:", error);
        // Here you could set an error state to show a message to the user
    } finally {
        setDownloadingSceneId(null);
    }
  };


  if (isCheckingApiKey) {
    return (
        <div className="flex items-center justify-center h-64">
            <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  if (!apiKeySelected) {
    return (
        <div className="bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-amber-500/30 text-amber-200 p-6 rounded-2xl flex flex-col items-center text-center animate-fade-in shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-400/80 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h3 className="text-xl font-semibold mb-2 text-white">API Key Required for Video Generation</h3>
            <p className="mb-4 text-gray-300 max-w-lg">
                The Veo video generation model requires you to use your own Google AI Studio API key.
                Please select a key to proceed. For more information on billing, visit the{' '}
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                    official documentation
                </a>.
            </p>
            <button onClick={handleSelectKey} className="flex items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition-all duration-200 ease-in-out hover:from-amber-400 hover:to-orange-500 focus:outline-none focus:ring-4 focus:ring-amber-400/50 transform hover:scale-[1.02] active:scale-[0.98]">
                Select API Key
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {outline.map(scene => {
            const statusInfo = generationStatus[scene.id] || { status: 'idle' };
            const isLoading = statusInfo.status === 'loading';
            const isDownloading = downloadingSceneId === scene.id;

            return (
                <div key={scene.id} className="bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-white/10 rounded-xl p-6 transition-all duration-300">
                    <h4 className="text-lg font-bold text-white mb-1">{scene.title}</h4>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{scene.description}</p>
                    
                    <div className="mt-4">
                        {scene.videoUrl && !isLoading && (
                             <div>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                                    <video src={scene.videoUrl} controls className="w-full h-full"></video>
                                </div>
                                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => handleDownloadVideo(scene)}
                                        disabled={isDownloading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Downloading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <DownloadIcon />
                                                <span>Download</span>
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => handleGenerateVideo(scene)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center bg-black/20 p-6 rounded-lg aspect-video">
                                <svg className="animate-spin h-8 w-8 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p className="text-white font-semibold">Assembling your cinematic vision...</p>
                                <p className="text-gray-400 text-sm mt-1 text-center">This can take a few minutes. Please be patient.</p>
                            </div>
                        )}
                        
                        {statusInfo.status === 'error' && (
                            <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="font-semibold text-white flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Generation Failed
                                    </p>
                                    <p className="text-sm text-red-300 mt-1 pl-7">{statusInfo.error}</p>
                                </div>
                                <button onClick={() => handleGenerateVideo(scene)} className="text-sm bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-all flex-shrink-0 self-end sm:self-center active:scale-[0.98]">Retry Generation</button>
                            </div>
                        )}

                        {!scene.videoUrl && statusInfo.status === 'idle' && (
                            <button onClick={() => handleGenerateVideo(scene)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed">
                                <VideoIcon/>
                                Generate Video
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
    </div>
);
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({
  generatedAssets,
  onScriptSave,
  onOutlineSave,
  onBtsSave,
  onVideoSave,
  visualStyle,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('script');

    useEffect(() => {
        setActiveTab('script');
    }, [generatedAssets.script, generatedAssets.characters, generatedAssets.visualOutline, generatedAssets.referenceImages, generatedAssets.btsDocument]);
    
    const tabs: {id: Tab, label: string, icon: React.ReactNode}[] = [
        { id: 'script', label: 'Script & Characters', icon: <ScriptIcon /> },
        { id: 'outline', label: 'Visual Outline', icon: <OutlineIcon /> },
        { id: 'images', label: 'Reference Images', icon: <ImagesIcon /> },
        { id: 'bts', label: 'BTS Document', icon: <BtsIcon /> },
        { id: 'video', label: 'Video Generation', icon: <VideoIcon /> },
    ];


    const renderContent = () => {
        const panelId = `${activeTab}-panel`;
        const content = (() => {
            switch (activeTab) {
                case 'script':
                    return <ScriptPanel script={generatedAssets.script} characters={generatedAssets.characters} onSave={onScriptSave} />;
                case 'outline':
                    return <OutlinePanel outline={generatedAssets.visualOutline} onSave={onOutlineSave} onVideoSave={onVideoSave} visualStyle={visualStyle} />;
                case 'images':
                    return <ImagesPanel images={generatedAssets.referenceImages} />;
                case 'bts':
                    return <BtsPanel document={generatedAssets.btsDocument} onSave={onBtsSave} />;
                case 'video':
                    return <VideoPanel outline={generatedAssets.visualOutline} visualStyle={visualStyle} onSave={onVideoSave} />;
                default:
                    return null;
            }
        })();
        
        return (
            <div
                id={panelId}
                role="tabpanel"
                aria-labelledby={`${activeTab}-tab`}
                className="animate-fade-in"
                style={{ animationDelay: '250ms' }}
            >
                {content}
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <div role="tablist" aria-label="Creative Assets" className="flex border-b border-white/10 mb-6 space-x-2">
                 {tabs.map((tab, index) => (
                    <TabButton 
                        key={tab.id}
                        id={`${tab.id}-tab`}
                        panelId={`${tab.id}-panel`}
                        isActive={activeTab === tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        icon={tab.icon}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {tab.label}
                    </TabButton>
                ))}
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
}