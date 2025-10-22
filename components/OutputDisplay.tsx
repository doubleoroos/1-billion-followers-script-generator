import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedAssets, ScriptBlock, Scene, Character, ReferenceImage, VisualStyle } from '../types';
import { generateVideoForScene, regenerateVideoPromptForScene } from '../services/geminiService';
import { LogoIcon } from './icons/LogoIcon';
import { SparklesIcon } from './icons/SparklesIcon';

// Re-usable Icons
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;

// Component Props
interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void;
  onOutlineSave: (newOutline: Scene[]) => void;
  onBtsSave: (newBtsDoc: string) => void;
  onVideoSave: (updatedScene: Scene) => void;
  visualStyle: VisualStyle;
}

// Sub-components for clean structure
type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';

const StoryboardSection: React.FC<{ title: string; children: React.ReactNode, style?: React.CSSProperties }> = ({ title, children, style }) => (
    <section className="animate-fade-in-stagger opacity-0" style={style}>
        <h2 className="text-3xl font-bold text-center mb-8 text-white tracking-wide border-b-2 border-violet-glow/20 pb-4">{title}</h2>
        {children}
    </section>
);

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-mint-glow">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan-lum flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Continuity preserved.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300">{content}</div>;
};

// Autosave Hook
function useAutosave<T>({ onSave, delay = 1500 }: { onSave: (data: T) => void, delay?: number }) {
    const [status, setStatus] = useState<SaveStatus>('clean');
    const timeoutRef = useRef<number | null>(null);
    const dataRef = useRef<T | undefined>(undefined);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    const save = useCallback((newData: T) => {
        dataRef.current = newData;
        if (status !== 'saving') setStatus('dirty');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
            savedTimeout = window.setTimeout(() => setStatus('clean'), 2000);
        }
        return () => clearTimeout(savedTimeout);
    }, [status]);
    
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    return { status, save };
}

// Storyboard Sections
const CharactersSection: React.FC<{ characters: Character[], onSave: (chars: Character[]) => void }> = ({ characters, onSave }) => {
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

const ScriptSection: React.FC<{ script: ScriptBlock[], characters: Character[], onSave: (newScript: ScriptBlock[]) => void }> = ({ script, characters, onSave }) => {
    const getCharacterName = (characterId?: string) => {
        if (!characterId) return 'NARRATOR';
        return characters.find(c => c.id === characterId)?.name.toUpperCase() || 'UNKNOWN';
    };

    return (
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 p-6 md:p-10 rounded-2xl max-w-4xl mx-auto font-mono text-gray-300 space-y-6 shadow-2xl">
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

interface VisualOutlineSectionProps {
  outline: Scene[];
  onSave: (newOutline: Scene[]) => void;
  onVideoSave: (scene: Scene) => void;
  visualStyle: VisualStyle;
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
  onInvalidKeyError: () => void;
}

const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({ 
  outline, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError 
}) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const { status, save } = useAutosave({ onSave });
     
    useEffect(() => { setEditedOutline(outline); }, [outline]);

    const handleSceneFieldChange = (index: number, field: keyof Scene, value: string) => {
        const newOutline = [...editedOutline];
        newOutline[index] = { ...newOutline[index], [field]: value };
        setEditedOutline(newOutline);
        save(newOutline);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
             <div className="flex justify-end items-center mb-4 px-1">
                <SaveStatusIndicator status={status} />
            </div>
            {editedOutline.map((scene, index) => (
                <SceneCard 
                    key={scene.id} 
                    scene={scene} 
                    onFieldChange={(field, value) => handleSceneFieldChange(index, field, value)}
                    onVideoSave={onVideoSave}
                    visualStyle={visualStyle}
                    isVeoKeySelected={isVeoKeySelected}
                    onSelectKey={onSelectKey}
                    onInvalidKeyError={onInvalidKeyError}
                />
            ))}
        </div>
    );
};

interface SceneCardProps {
  scene: Scene;
  onFieldChange: (field: keyof Scene, value: string) => void;
  onVideoSave: (scene: Scene) => void;
  visualStyle: VisualStyle;
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
  onInvalidKeyError: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, onFieldChange, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError
}) => {
    const [generationStatus, setGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const generationController = useRef<AbortController | null>(null);
    const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);

    const handleGenerateVideo = async () => {
        generationController.current = new AbortController();
        setGenerationStatus({ status: 'loading' });
        try {
            const downloadLink = await generateVideoForScene(scene, visualStyle, generationController.current.signal);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            onVideoSave({ ...scene, videoUrl: finalUrl });
            setGenerationStatus({ status: 'idle' });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setGenerationStatus({ status: 'idle' });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            if (errorMessage.includes('Requested entity was not found.')) {
              setGenerationStatus({ status: 'error', error: "Your API Key appears to be invalid. Please select a different one to continue." });
              onInvalidKeyError();
            } else {
              setGenerationStatus({ status: 'error', error: errorMessage });
            }
        }
    };
    
    const handleRegeneratePrompt = async () => {
        setIsRegeneratingPrompt(true);
        setPromptError(null);
        try {
            const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
            onFieldChange('videoPrompt', newPrompt);
        } catch (error) {
            console.error("Failed to regenerate prompt:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to regenerate prompt.";
            setPromptError(errorMessage);
            setTimeout(() => setPromptError(null), 5000);
        } finally {
            setIsRegeneratingPrompt(false);
        }
    };

    const handleCancelGeneration = () => {
        generationController.current?.abort();
    };

    const EditableField: React.FC<{label: string, id: string, value: string, field: keyof Scene, isTextarea?: boolean}> = ({ label, id, value, field, isTextarea }) => {
        const commonClasses = "w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition";
        return (
        <div>
            <label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>
            {isTextarea ? (
                <textarea id={id} value={value} onChange={(e) => onFieldChange(field, e.target.value)} className={`${commonClasses} h-24 resize-y`} />
            ) : (
                <input id={id} type="text" value={value} onChange={(e) => onFieldChange(field, e.target.value)} className={commonClasses} />
            )}
        </div>
    )};

    return (
        <div className="relative bg-gradient-to-br from-gray-900/20 to-gray-800/10 rounded-xl p-6 transition-all duration-300 border border-white/10 shadow-lg">
             <input
                type="text"
                value={scene.title}
                onChange={(e) => onFieldChange('title', e.target.value)}
                aria-label="Scene Title"
                className="text-xl font-bold text-white bg-transparent focus:bg-gray-900/50 focus:ring-1 focus:ring-violet-glow rounded-md p-1 -m-1 w-full mb-4"
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <EditableField label="Location" id={`loc-${scene.id}`} value={scene.location} field="location" />
                <EditableField label="Time of Day" id={`time-${scene.id}`} value={scene.timeOfDay} field="timeOfDay" />
                <div className="md:col-span-2">
                    <EditableField label="Description" id={`desc-${scene.id}`} value={scene.description} field="description" isTextarea />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor={`prompt-${scene.id}`} className="block text-gray-400 font-semibold mb-1 text-sm">Video Generation Prompt</label>
                    <div className="relative group">
                        <textarea
                            id={`prompt-${scene.id}`}
                            value={scene.videoPrompt || ''}
                            onChange={(e) => onFieldChange('videoPrompt', e.target.value)}
                            className="w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition h-28 pr-12 resize-y"
                            placeholder="A detailed, cinematic prompt for the video generation model..."
                        />
                        <button
                            onClick={handleRegeneratePrompt}
                            disabled={isRegeneratingPrompt}
                            title="Regenerate prompt with AI"
                            aria-label="Regenerate prompt with AI"
                            className="absolute top-2 right-2 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-glow disabled:opacity-50 disabled:cursor-not-allowed group-hover:opacity-100 opacity-70"
                        >
                            {isRegeneratingPrompt 
                                ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                : <SparklesIcon />
                            }
                        </button>
                    </div>
                    {promptError && (
                        <p className="text-xs text-red-400 mt-1 animate-fade-in">
                            {promptError}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
                <VideoGenerationUnit 
                    scene={scene}
                    statusInfo={generationStatus}
                    onGenerate={handleGenerateVideo}
                    onCancel={handleCancelGeneration}
                    isVeoKeySelected={isVeoKeySelected}
                    onSelectKey={onSelectKey}
                />
            </div>
        </div>
    );
};

interface VideoGenerationUnitProps {
  scene: Scene;
  statusInfo: { status: 'idle' | 'loading' | 'error', error?: string };
  onGenerate: () => void;
  onCancel: () => void;
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
}

const VideoGenerationUnit: React.FC<VideoGenerationUnitProps> = ({ scene, statusInfo, onGenerate, onCancel, isVeoKeySelected, onSelectKey }) => {
    
    if (scene.videoUrl && statusInfo.status !== 'loading') {
        return (
            <div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                    <video src={scene.videoUrl} controls className="w-full h-full"></video>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => window.open(scene.videoUrl, '_blank')} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed">
                        <DownloadIcon /><span>Download</span>
                    </button>
                    <button onClick={onGenerate} className="flex-1 flex items-center justify-center gap-2 bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                        Regenerate
                    </button>
                </div>
            </div>
        );
    }

    if (statusInfo.status === 'loading') {
        return (
            <div className="bg-black/20 p-6 rounded-lg aspect-video flex flex-col justify-center animate-fade-in">
                <p className="text-white font-semibold text-center mb-4">Assembling your cinematic vision...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-2 mb-2 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div>
                </div>
                <p className="text-gray-400 text-sm text-center mb-6">This can take a few minutes.</p>
                <div className="flex justify-center">
                    <button onClick={onCancel} className="bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 active:scale-[0.98]">Cancel</button>
                </div>
            </div>
        );
    }

    if (statusInfo.status === 'error') {
        return (
            <div className="bg-red-900/30 border border-red-600/50 p-4 rounded-lg animate-fade-in">
                <h5 className="font-semibold text-white">An Unexpected Plot Twist</h5>
                <p className="text-sm font-mono p-2 bg-black/20 rounded mt-2 text-red-200/80">{statusInfo.error}</p>
                <div className="flex justify-end mt-4">
                     {isVeoKeySelected ? (
                        <button onClick={onGenerate} className="text-sm bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Retry</button>
                    ) : (
                         <button onClick={onSelectKey} className="text-sm bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-md transition-all active:scale-[0.98]">Select New Key</button>
                    )}
                </div>
            </div>
        );
    }

    if (isVeoKeySelected === false) {
        return (
            <div className="bg-blue-deep/50 p-6 rounded-lg border border-violet-glow/30 text-center animate-fade-in">
                <h4 className="font-bold text-white text-lg mb-2">API Key Required for Veo</h4>
                <p className="text-gray-300 text-sm mb-4">
                    Video generation with Google's Veo model requires an API key associated with a project that has billing enabled. Please select your key to proceed.
                </p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-lum hover:underline mb-4 block">Learn more about billing</a>
                <button onClick={onSelectKey} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                    Select API Key
                </button>
            </div>
        );
    }

    if (isVeoKeySelected === null) {
        return (
            <div className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Verifying API Key...
            </div>
        );
    }
    
    return (
        <button onClick={onGenerate} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98]">
            <VideoIcon/> Generate Video Clip
        </button>
    );
};

const MoodboardSection: React.FC<{ images: ReferenceImage[] }> = ({ images }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {images.map(image => (
            <div key={image.title} className="bg-gray-900/20 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img src={image.imageUrl} alt={image.title} className="w-full h-auto object-cover aspect-video" />
                <div className="p-4">
                    <h4 className="font-bold text-white text-lg">{image.title}</h4>
                </div>
            </div>
        ))}
    </div>
);

const BtsSection: React.FC<{ document: string, onSave: (newDoc: string) => void }> = ({ document, onSave }) => {
    return (
         <div className="bg-black/20 backdrop-blur-sm border border-white/10 p-6 md:p-10 rounded-2xl max-w-4xl mx-auto text-gray-300 space-y-6 shadow-2xl leading-relaxed">
            <p style={{ whiteSpace: 'pre-wrap' }}>{document}</p>
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
    const { script, characters, visualOutline, referenceImages, btsDocument } = generatedAssets;
    const [isVeoKeySelected, setIsVeoKeySelected] = useState<boolean | null>(null);

    const checkApiKey = useCallback(async () => {
        if ((window as any).aistudio) {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsVeoKeySelected(hasKey);
            } catch (e) {
                console.error("Error checking API key status:", e);
                setIsVeoKeySelected(false);
            }
        } else {
            console.warn("window.aistudio not found. Assuming no key selected.");
            setIsVeoKeySelected(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            setIsVeoKeySelected(true); // Optimistic update
            checkApiKey(); // Re-verify in the background
        }
    };

    const handleInvalidKeyError = useCallback(() => {
        setIsVeoKeySelected(false);
    }, []);

    const handleCharacterSave = (newCharacters: Character[]) => {
        onScriptSave(script, newCharacters);
    };
    const handleScriptContentSave = (newScript: ScriptBlock[]) => {
        onScriptSave(newScript, characters);
    }
    
    return (
        <div className="space-y-16 md:space-y-24">
            <div className="text-center animate-fade-in">
                <div className="inline-block">
                    <LogoIcon large={true} />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-4">Blueprint for a Brighter Future</h1>
                <p className="text-gray-400 text-lg mt-2">Generated by your AI creative partner.</p>
            </div>

            <StoryboardSection title="Characters" style={{ animationDelay: '200ms' }}>
                <CharactersSection characters={characters} onSave={handleCharacterSave} />
            </StoryboardSection>
            
            <StoryboardSection title="Script" style={{ animationDelay: '400ms' }}>
                <ScriptSection script={script} characters={characters} onSave={handleScriptContentSave} />
            </StoryboardSection>

            <StoryboardSection title="Visual Outline" style={{ animationDelay: '600ms' }}>
                <VisualOutlineSection 
                    outline={visualOutline} 
                    onSave={onOutlineSave} 
                    onVideoSave={onVideoSave} 
                    visualStyle={visualStyle} 
                    isVeoKeySelected={isVeoKeySelected}
                    onSelectKey={handleSelectKey}
                    onInvalidKeyError={handleInvalidKeyError}
                />
            </StoryboardSection>

            <StoryboardSection title="Moodboard" style={{ animationDelay: '800ms' }}>
                <MoodboardSection images={referenceImages} />
            </StoryboardSection>

            <StoryboardSection title="Behind The Scenes" style={{ animationDelay: '1000ms' }}>
                <BtsSection document={btsDocument} onSave={onBtsSave} />
            </StoryboardSection>
        </div>
    );
}