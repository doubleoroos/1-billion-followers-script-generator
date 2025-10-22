import React, { useState, useEffect, useRef } from 'react';
import type { Scene, VisualStyle } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { CopyButton } from '../ui/CopyButton';

// Re-usable Icons
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;
const RegenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-mint-glow">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan-lum flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Continuity preserved.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300">{content}</div>;
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

export const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({ 
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

interface VideoGenerationControlsProps {
  statusInfo: { status: 'idle' | 'loading' | 'error', error?: string };
  onGenerate: () => void;
  onCancel: () => void;
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
  hasVideo: boolean;
}

const VideoGenerationControls: React.FC<VideoGenerationControlsProps> = ({ statusInfo, onGenerate, onCancel, isVeoKeySelected, onSelectKey, hasVideo }) => {
    // Loading State (compact)
    if (statusInfo.status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-2 animate-fade-in w-full">
                <p className="text-sm text-gray-300">Generating...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div>
                </div>
                 <button onClick={onCancel} className="text-xs bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full transition-all duration-300">Cancel</button>
            </div>
        );
    }
    
    // Error State (expanded)
    if (statusInfo.status === 'error') {
      return (
          <div className="bg-red-900/30 border border-red-600/50 p-3 rounded-lg animate-fade-in w-full text-left">
              <h5 className="font-semibold text-white text-sm mb-2">Generation Error</h5>
              <p className="text-xs font-mono p-2 bg-black/20 rounded text-red-200/80 mb-3 break-words">
                {statusInfo.error || 'An unknown error occurred.'}
              </p>
              <div className="flex justify-end gap-2">
                {isVeoKeySelected === false && (
                    <button onClick={onSelectKey} className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Select New Key</button>
                )}
                <button onClick={onGenerate} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Retry</button>
              </div>
          </div>
      );
    }

    // Key Selection State (expanded)
    if (isVeoKeySelected === false) {
        return (
             <div className="bg-blue-deep/50 p-4 rounded-lg border border-violet-glow/30 text-center animate-fade-in w-full">
                <p className="text-gray-300 text-sm mb-2">
                    Video generation with Veo requires a billed API key.
                </p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-lum hover:underline mb-3 block">Learn more about billing</a>
                <button onClick={onSelectKey} className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-all text-sm">
                    <KeyIcon /> Select API Key
                </button>
            </div>
        );
    }
    
    // Verifying State (compact)
    if (isVeoKeySelected === null) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 h-10">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Verifying...</span>
            </div>
        );
    }
    
    // Idle/Generate State (compact)
    const buttonText = hasVideo ? 'Regenerate' : 'Generate Video';
    const Icon = hasVideo ? RegenerateIcon : VideoIcon;
    
    return (
        <button onClick={onGenerate} className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] text-sm">
            <Icon /> {buttonText}
        </button>
    );
};


const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, onFieldChange, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError
}) => {
    const [generationStatus, setGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const [showSuccess, setShowSuccess] = useState(false);
    const generationController = useRef<AbortController | null>(null);
    const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);

    const handleGenerateVideo = async () => {
        generationController.current = new AbortController();
        setGenerationStatus({ status: 'loading' });
        setShowSuccess(false);
        try {
            const downloadLink = await generateVideoForScene(scene, visualStyle, generationController.current.signal);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            onVideoSave({ ...scene, videoUrl: finalUrl });
            setGenerationStatus({ status: 'idle' });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
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

    const EditableField: React.FC<{label: string, id: string, value: string, field: keyof Scene, isTextarea?: boolean, placeholder?: string}> = ({ label, id, value, field, isTextarea, placeholder }) => {
        const commonClasses = "w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition";
        return (
        <div>
            <label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>
            {isTextarea ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onFieldChange(field, e.target.value)}
                    className={`${commonClasses} h-28 resize-y`}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onFieldChange(field, e.target.value)}
                    className={commonClasses}
                    placeholder={placeholder}
                />
            )}
        </div>
    )};

    return (
        <div className="relative bg-gradient-to-br from-gray-900/20 to-gray-800/10 rounded-xl p-6 transition-all duration-300 border border-white/10 shadow-lg">
             <div className="flex-grow">
                 <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => onFieldChange('title', e.target.value)}
                    aria-label="Scene Title"
                    className="text-xl font-bold text-white bg-transparent focus:bg-gray-900/50 focus:ring-1 focus:ring-violet-glow rounded-md p-1 -m-1 w-full"
                />
            </div>
            
            <div className="my-6">
                <VideoGenerationControls 
                    statusInfo={generationStatus}
                    onGenerate={handleGenerateVideo}
                    onCancel={handleCancelGeneration}
                    isVeoKeySelected={isVeoKeySelected}
                    onSelectKey={onSelectKey}
                    hasVideo={!!scene.videoUrl}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <EditableField label="Location" id={`loc-${scene.id}`} value={scene.location} field="location" />
                <EditableField label="Time of Day" id={`time-${scene.id}`} value={scene.timeOfDay} field="timeOfDay" />
                <div className="md:col-span-2">
                    <EditableField
                        label="Description"
                        id={`desc-${scene.id}`}
                        value={scene.description}
                        field="description"
                        isTextarea
                        placeholder="Describe the scene's mood, setting, and key actions..."
                    />
                </div>
                <div className="md:col-span-2 relative">
                    <label htmlFor={`prompt-${scene.id}`} className="block text-gray-400 font-semibold mb-1 text-sm">Video Generation Prompt</label>
                    <div className="relative group">
                        <textarea
                            id={`prompt-${scene.id}`}
                            value={scene.videoPrompt || ''}
                            onChange={(e) => onFieldChange('videoPrompt', e.target.value)}
                            className="w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition h-28 pr-28 resize-y"
                            placeholder="A detailed, cinematic prompt for the video generation model..."
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                            <button
                                onClick={handleRegeneratePrompt}
                                disabled={isRegeneratingPrompt}
                                title="Regenerate prompt with AI"
                                aria-label="Regenerate prompt with AI"
                                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-glow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRegeneratingPrompt 
                                    ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    : <SparklesIcon />
                                }
                            </button>
                             <CopyButton textToCopy={scene.videoPrompt || ''}/>
                        </div>
                    </div>
                    {promptError && (
                        <p className="text-xs text-red-400 mt-1 animate-fade-in">
                            {promptError}
                        </p>
                    )}
                </div>
            </div>

            {scene.videoUrl && generationStatus.status !== 'loading' && (
                 <div className="mt-6 border-t border-white/10 pt-6 animate-fade-in">
                    {showSuccess && (
                        <div className="bg-green-500/20 border border-green-500/30 text-green-300 text-sm p-3 rounded-lg mb-4 flex items-center gap-3 animate-fade-in">
                            <CheckmarkIcon />
                            <span>Video generated successfully! Ready for review.</span>
                        </div>
                    )}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                        <video key={scene.videoUrl} src={scene.videoUrl} controls className="w-full h-full"></video>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => window.open(scene.videoUrl, '_blank')} className="flex items-center justify-center gap-2 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm">
                            <DownloadIcon /><span>Download</span>
                        </button>
                    </div>
                 </div>
            )}
        </div>
    );
};