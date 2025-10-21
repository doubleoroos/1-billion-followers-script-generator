import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedAssets, ScriptBlock, Scene, Character, ReferenceImage } from '../types';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void;
  onOutlineSave: (newOutline: Scene[]) => void;
  onBtsSave: (newBtsDoc: string) => void;
  isLoading: boolean;
}

type Tab = 'script' | 'outline' | 'images' | 'bts';
type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';


// Icons
const ScriptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const OutlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ImagesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const BtsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

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
            content = <span className="text-green-400">All changes saved</span>;
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

const TabButton = ({ isActive, onClick, children, icon }: { isActive: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold text-sm rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 ${
            isActive
                ? 'bg-[#161b22]/80 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-800/30 hover:text-white'
        }`}
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

    const { status, save } = useAutosave({ 
        onSave: (data: { script: ScriptBlock[], characters: Character[] }) => onSave(data.script, data.characters) 
    });

    useEffect(() => {
        setEditedScript(script);
        setEditedCharacters(characters);
    }, [script, characters]);
    
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

    const openCharacterModal = (char: Character | null) => {
        setEditingCharacter(char ? {...char} : {id: '', name: '', description: ''});
        setIsCharacterModalOpen(true);
    };

    const handleCharacterSave = () => {
        if (!editingCharacter) return;
        let newChars;
        if (editingCharacter.id) {
            newChars = editedCharacters.map(c => c.id === editingCharacter.id ? editingCharacter : c);
        } else {
            newChars = [...editedCharacters, {...editingCharacter, id: `char_${Math.random().toString(36).substring(2, 9)}` }];
        }
        setEditedCharacters(newChars);
        save({ script: editedScript, characters: newChars });
        setIsCharacterModalOpen(false);
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
                    <button onClick={() => openCharacterModal(null)} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded-md">+ Add</button>
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
                <div className="space-y-4 prose prose-invert prose-p:text-gray-300 max-w-none font-mono">
                    {editedScript.map((block, index) => (
                        <div key={block.id}>
                            <p className="font-bold text-white">{getCharacterName(block.characterId).toUpperCase()}</p>
                            <textarea value={block.content} onChange={(e) => handleContentChange(index, e.target.value)}
                              className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-300 font-mono focus:ring-cyan-400 focus:border-cyan-400" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {isCharacterModalOpen && editingCharacter && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsCharacterModalOpen(false)}>
                <div className="bg-[#161b22] p-6 rounded-xl border border-white/10 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">{editingCharacter.id ? 'Edit' : 'Add'} Character</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Name" value={editingCharacter.name} onChange={e => setEditingCharacter({...editingCharacter, name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-white" />
                        <textarea placeholder="Description" value={editingCharacter.description} onChange={e => setEditingCharacter({...editingCharacter, description: e.target.value})} className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-2 text-white" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsCharacterModalOpen(false)} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={handleCharacterSave} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

const OutlinePanel: React.FC<{ outline: Scene[], onSave: (newOutline: Scene[]) => void }> = ({ outline, onSave }) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
    const { status, save } = useAutosave({ onSave });

    // Drag and Drop state and refs
    const dragItem = useRef<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        setEditedOutline(outline);
    }, [outline]);

    const handleInputChange = (sceneId: string, field: keyof Scene, value: string) => {
        const newOutline = editedOutline.map(scene =>
            scene.id === sceneId ? { ...scene, [field]: value } : scene
        );
        setEditedOutline(newOutline);
        save(newOutline);
    };
    
    const handleDeleteClick = (scene: Scene) => {
        setSceneToDelete(scene);
    };

    const handleConfirmDelete = () => {
        if (!sceneToDelete) return;

        const newOutline = editedOutline.filter(s => s.id !== sceneToDelete.id);
        setEditedOutline(newOutline);
        save(newOutline);
        setSceneToDelete(null);
    };

    const handleCancelDelete = () => {
        setSceneToDelete(null);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        // Store the index of the item being dragged
        dragItem.current = index;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        // Store the index of the item we are dragging over
        if (index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = () => {
        // If the drop is not on a valid target, reset
        if (dragItem.current === null || dragOverIndex === null || dragItem.current === dragOverIndex) {
            handleDragEnd();
            return;
        }

        // Reorder the outline array
        const newOutline = [...editedOutline];
        const [draggedItemContent] = newOutline.splice(dragItem.current, 1);
        newOutline.splice(dragOverIndex, 0, draggedItemContent);
        
        // Update local state and trigger the autosave
        setEditedOutline(newOutline);
        save(newOutline);

        // Reset drag state
        handleDragEnd();
    };

    const handleDragEnd = () => {
        // Clear all drag-related state
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
        };
        const newOutline = [...editedOutline, newScene];
        setEditedOutline(newOutline);
        save(newOutline);
    };


    const EditableField: React.FC<{scene: Scene, field: keyof Scene, label: string, isTextarea?: boolean}> = ({ scene, field, label, isTextarea }) => {
        const value = scene[field] as string;
        const commonClasses = "w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-gray-300 focus:ring-cyan-400 focus:border-cyan-400";
        return (
            <div>
                <label className="block text-gray-400 font-semibold mb-1">{label}</label>
                {isTextarea ? (
                     <textarea
                        value={value}
                        onChange={(e) => handleInputChange(scene.id, field, e.target.value)}
                        className={`${commonClasses} h-24 min-h-[40px]`}
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(scene.id, field, e.target.value)}
                        className={commonClasses}
                    />
                )}
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-end items-center mb-4 px-1">
                <SaveStatusIndicator status={status} />
            </div>
            <div className="space-y-6" onDragLeave={handleDragEnd}>
                {editedOutline.map((scene, index) => {
                    const isDraggedOver = dragOverIndex === index && draggedIndex !== index;
                    return (
                        <div 
                            key={scene.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`relative bg-gradient-to-br from-gray-900/20 to-gray-800/10 rounded-xl p-6 transition-all duration-300 border
                                ${draggedIndex === index ? 'opacity-30 scale-95 shadow-2xl' : 'opacity-100 scale-100'}
                                ${draggedIndex !== null ? 'border-transparent' : 'border-white/10'}
                                ${draggedIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
                            `}
                        >
                            { isDraggedOver && <div className="absolute top-0 left-6 right-6 h-1 bg-cyan-400 rounded-full animate-pulse"></div> }
                            <div className="flex items-end gap-4 mb-4">
                                <div className="flex-grow">
                                    <EditableField scene={scene} field="title" label="Scene Title" />
                                </div>
                                <button
                                    onClick={() => handleDeleteClick(scene)}
                                    title="Delete Scene"
                                    className="mb-2 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                               <EditableField scene={scene} field="location" label="Location" />
                               <EditableField scene={scene} field="timeOfDay" label="Time of Day" />
                               <div className="md:col-span-2"><EditableField scene={scene} field="atmosphere" label="Atmosphere" /></div>
                               <div className="md:col-span-2"><EditableField scene={scene} field="description" label="Description" isTextarea /></div>
                               <div className="md:col-span-2"><EditableField scene={scene} field="keyVisualElements" label="Key Visual Elements" isTextarea /></div>
                               <div className="md:col-span-2"><EditableField scene={scene} field="visuals" label="Visuals" isTextarea /></div>
                               <EditableField scene={scene} field="pacingEmotion" label="Pacing & Emotion" />
                               <EditableField scene={scene} field="transition" label="Transition" />
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleAddNewScene}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-cyan-300 bg-cyan-900/40 border border-cyan-700/50 rounded-lg hover:bg-cyan-800/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161b22] focus:ring-cyan-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Scene
                </button>
            </div>

            {sceneToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={handleCancelDelete}>
                    <div className="bg-[#161b22] p-6 rounded-xl border border-red-500/30 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-300 mt-3 mb-6">Are you sure you want to permanently delete the scene: <strong className="text-white">"{sceneToDelete.title}"</strong>? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={handleCancelDelete} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
                            <button onClick={handleConfirmDelete} className="text-sm bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Delete Scene</button>
                        </div>
                    </div>
                </div>
            )}
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


export const OutputDisplay: React.FC<OutputDisplayProps> = ({
  generatedAssets,
  onScriptSave,
  onOutlineSave,
  onBtsSave,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('script');

    useEffect(() => {
        setActiveTab('script');
    }, [generatedAssets.script, generatedAssets.characters, generatedAssets.visualOutline, generatedAssets.referenceImages, generatedAssets.btsDocument]);


    const renderContent = () => {
        switch (activeTab) {
            case 'script':
                return <ScriptPanel script={generatedAssets.script} characters={generatedAssets.characters} onSave={onScriptSave} />;
            case 'outline':
                return <OutlinePanel outline={generatedAssets.visualOutline} onSave={onOutlineSave} />;
            case 'images':
                return <ImagesPanel images={generatedAssets.referenceImages} />;
            case 'bts':
                return <BtsPanel document={generatedAssets.btsDocument} onSave={onBtsSave} />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex border-b border-white/10 mb-6 space-x-2">
                <TabButton isActive={activeTab === 'script'} onClick={() => setActiveTab('script')} icon={<ScriptIcon />}>Script & Characters</TabButton>
                <TabButton isActive={activeTab === 'outline'} onClick={() => setActiveTab('outline')} icon={<OutlineIcon />}>Visual Outline</TabButton>
                <TabButton isActive={activeTab === 'images'} onClick={() => setActiveTab('images')} icon={<ImagesIcon />}>Reference Images</TabButton>
                <TabButton isActive={activeTab === 'bts'} onClick={() => setActiveTab('bts')} icon={<BtsIcon />}>BTS Document</TabButton>
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
}