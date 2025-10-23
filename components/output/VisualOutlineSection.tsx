import React, { useState, useEffect, useRef } from 'react';
import type { Scene, VisualStyle } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene, generateImageForScene } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { CopyButton } from '../ui/CopyButton';

// Re-usable Icons
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PlaceholderImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;
const RegenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;

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

const ApiKeyManager: React.FC<{
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
}> = ({ isVeoKeySelected, onSelectKey }) => {
  if (isVeoKeySelected === true) {
    return null;
  }

  if (isVeoKeySelected === null) {
    return (
      <div className="bg-blue-deep/30 p-4 rounded-lg border border-white/10 text-center animate-fade-in mb-8 flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-gray-400">Verifying API key status...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-deep/50 p-6 rounded-lg border border-violet-glow/30 text-center animate-fade-in mb-8">
      <h4 className="text-lg font-bold text-white mb-2">Enable Video Generation</h4>
      <p className="text-gray-300 text-sm max-w-xl mx-auto mb-3">
          To generate cinematic clips with Google's Veo model, a billed API key is required. This ensures access to the necessary computational resources.
      </p>
      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-lum hover:underline mb-4 block">Learn more about billing</a>
      <button onClick={onSelectKey} className="flex items-center justify-center gap-2 mx-auto bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg transition-all text-sm">
          <KeyIcon /> Select API Key
      </button>
    </div>
  );
};

const atmosphereOptions = [
    'Misty',
    'Golden Hour',
    'Stormy',
    'Serene',
    'Eerie',
    'Bustling',
    'Oppressive',
    'Tranquil',
    'Vibrant',
    'Desolate',
    'Futuristic',
    'Nostalgic',
];

const transitionOptions = [
    'Cut to:',
    'Cross-dissolve to:',
    'Slow dissolve to:',
    'Fade in from Black.',
    'Fade to Black.',
    'Match cut on action to:',
    'Jump cut to:',
    'Smash cut to black.',
    'Wipe left to:',
    'Wipe right to:',
    'Iris out.',
    'Iris in.',
];

const DatalistInput: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}> = ({ label, id, value, onChange, options, placeholder }) => {
  const datalistId = `${id}-list`;
  return (
    <div>
      <label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={datalistId}
        className="w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition"
        placeholder={placeholder}
      />
      <datalist id={datalistId}>
        {options.map(option => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
};

type BulkStatus = 'idle' | 'running' | 'error' | 'complete';
type BulkProgress = { current: number; total: number };

interface BulkGenerationControlsProps {
    videoState: { status: BulkStatus; progress: BulkProgress; error?: string };
    imageState: { status: BulkStatus; progress: BulkProgress; error?: string };
    onGenerateVideo: () => void;
    onCancelVideo: () => void;
    onDismissVideoError: () => void;
    onGenerateImage: () => void;
    onCancelImage: () => void;
    onDismissImageError: () => void;
    isVeoKeySelected: boolean | null;
    scenesWithoutVideoCount: number;
    totalSceneCount: number;
}

const BulkGenerationControls: React.FC<BulkGenerationControlsProps> = ({
    videoState, imageState,
    onGenerateVideo, onCancelVideo, onDismissVideoError,
    onGenerateImage, onCancelImage, onDismissImageError,
    isVeoKeySelected, scenesWithoutVideoCount, totalSceneCount
}) => {
    const isAnyTaskRunning = videoState.status === 'running' || imageState.status === 'running';

    const renderTaskUI = (
        type: 'video' | 'image',
        state: { status: BulkStatus; progress: BulkProgress; error?: string },
        onGenerate: () => void,
        onCancel: () => void,
        onDismissError: () => void,
        count: number,
        buttonText: string,
        buttonIcon: React.ReactNode,
        disabledTooltip: string,
        isDisabled: boolean
    ) => {
        if (state.status === 'running') {
            const progressPercentage = state.progress.total > 0 ? (state.progress.current / state.progress.total) * 100 : 0;
            return (
                <div className="flex-1 p-4 bg-blue-deep/50 rounded-lg border border-violet-glow/30 animate-fade-in text-center">
                    <h4 className="font-bold text-white">Generation in Progress</h4>
                    <p className="text-sm text-gray-300 my-2">Generating {type} {state.progress.current} of {state.progress.total}...</p>
                    <div className="w-full bg-gray-900/50 rounded-full h-2.5 my-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-lum to-violet-glow h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Cancel</button>
                </div>
            );
        }
        if (state.status === 'error') {
            return (
                <div className="flex-1 p-4 bg-red-900/40 rounded-lg border border-red-500/50 animate-fade-in text-center">
                    <h4 className="font-bold text-white">Generation Failed</h4>
                    <p className="text-sm text-red-200 my-2 font-mono">{state.error}</p>
                    <div className="flex justify-center gap-4 mt-3">
                        <button onClick={onDismissError} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Dismiss</button>
                        <button onClick={onGenerate} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Retry</button>
                    </div>
                </div>
            );
        }
        if (state.status === 'complete') {
            return (
                 <div className="flex-1 p-4 bg-green-900/40 rounded-lg border border-green-500/50 animate-fade-in text-center">
                    <h4 className="font-bold text-white">Generation Complete!</h4>
                    <p className="text-sm text-green-200 my-2">All {state.progress.total} {type}s generated.</p>
                </div>
            );
        }
        // Idle State
        return (
            <div className="flex-1">
                 <button 
                    onClick={onGenerate} 
                    disabled={isDisabled || isAnyTaskRunning}
                    title={isDisabled ? disabledTooltip : (isAnyTaskRunning ? 'Another generation process is running.' : '')}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-5 rounded-lg transition-all text-sm disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
                >
                    {buttonIcon}
                    {buttonText} ({count})
                </button>
            </div>
        );
    };

    let videoDisabledTooltip = '';
    if (isVeoKeySelected === false) videoDisabledTooltip = 'Please select an API key to enable video generation.';
    else if (scenesWithoutVideoCount === 0) videoDisabledTooltip = 'All scenes already have a generated video.';
    const isVideoDisabled = !isVeoKeySelected || scenesWithoutVideoCount === 0;

    let imageDisabledTooltip = '';
    if (totalSceneCount === 0) imageDisabledTooltip = 'There are no scenes to generate images for.';
    const isImageDisabled = totalSceneCount === 0;

    if (totalSceneCount === 0) return null;

    return (
        <div className="bg-blue-deep/30 p-4 rounded-lg border border-white/10 text-center animate-fade-in mb-8">
            <h4 className="text-lg font-bold text-white mb-2">Bulk Asset Generation</h4>
            <p className="text-gray-300 text-sm max-w-xl mx-auto mb-4">
                Use these controls to generate assets for multiple scenes at once. This process can take a significant amount of time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4">
                {renderTaskUI('image', imageState, onGenerateImage, onCancelImage, onDismissImageError, totalSceneCount, 'Regenerate All Previews', <ImageIcon />, imageDisabledTooltip, isImageDisabled)}
                {renderTaskUI('video', videoState, onGenerateVideo, onCancelVideo, onDismissVideoError, scenesWithoutVideoCount, 'Generate Missing Videos', <VideoIcon />, videoDisabledTooltip, isVideoDisabled)}
            </div>
        </div>
    );
};

export const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({ 
  outline, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError 
}) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const { status, save } = useAutosave({ onSave });
    
    // State for bulk video generation
    const [bulkVideoState, setBulkVideoState] = useState<{ status: BulkStatus; progress: BulkProgress; error?: string }>({ status: 'idle', progress: { current: 0, total: 0 } });
    const videoGenerationAbortController = useRef<AbortController | null>(null);

    // State for bulk image generation
    const [bulkImageState, setBulkImageState] = useState<{ status: BulkStatus; progress: BulkProgress; error?: string }>({ status: 'idle', progress: { current: 0, total: 0 } });
    const imageGenerationAbortController = useRef<AbortController | null>(null);
     
    useEffect(() => { setEditedOutline(outline); }, [outline]);

    const handleSceneFieldChange = (index: number, field: keyof Scene, value: string) => {
        const newOutline = [...editedOutline];
        newOutline[index] = { ...newOutline[index], [field]: value };
        setEditedOutline(newOutline);
        save(newOutline);
    };

    // Drag and drop state and handlers
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setTimeout(() => {
            e.currentTarget.classList.add('opacity-40', 'scale-[0.98]');
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
        if (dragItem.current !== index) {
            e.currentTarget.classList.add('bg-violet-glow/10');
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-violet-glow/10');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-violet-glow/10');
        
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newOutline = [...editedOutline];
            const draggedItemContent = newOutline.splice(dragItem.current, 1)[0];
            newOutline.splice(dragOverItem.current, 0, draggedItemContent);
            setEditedOutline(newOutline);
            save(newOutline);
        }
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-40', 'scale-[0.98]');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleBulkVideoGenerate = async () => {
        videoGenerationAbortController.current = new AbortController();
        const signal = videoGenerationAbortController.current.signal;

        const scenesToProcess = editedOutline.filter(scene => !scene.videoUrl);
        if (scenesToProcess.length === 0) return;

        setBulkVideoState({ status: 'running', progress: { current: 0, total: scenesToProcess.length } });

        for (let i = 0; i < scenesToProcess.length; i++) {
            if (signal.aborted) { console.log("Bulk video generation cancelled by user."); break; }
            const scene = scenesToProcess[i];
            setBulkVideoState(p => ({ ...p, progress: { ...p.progress, current: i + 1 } }));

            try {
                const currentSceneState = editedOutline.find(s => s.id === scene.id)!;
                const downloadLink = await generateVideoForScene(currentSceneState, visualStyle, signal);
                const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                const updatedScene = { ...currentSceneState, videoUrl: finalUrl };
                onVideoSave(updatedScene);
                setEditedOutline(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') break;
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setBulkVideoState({ status: 'error', progress: { current: i + 1, total: scenesToProcess.length }, error: `Failed on Scene ${scene.sceneNumber}: ${errorMessage.split('Reason: ')[1] || errorMessage}` });
                if (errorMessage.includes('Requested entity was not found.')) onInvalidKeyError();
                return;
            }
        }
        
        if (signal.aborted) {
             setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } });
        } else {
            setBulkVideoState(p => ({ ...p, status: 'complete' }));
            setTimeout(() => setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } }), 5000);
        }
    };

    const handleBulkImageRegenerate = async () => {
        imageGenerationAbortController.current = new AbortController();
        const signal = imageGenerationAbortController.current.signal;

        const scenesToProcess = editedOutline;
        if (scenesToProcess.length === 0) return;

        setBulkImageState({ status: 'running', progress: { current: 0, total: scenesToProcess.length } });

        for (let i = 0; i < scenesToProcess.length; i++) {
            if (signal.aborted) { console.log("Bulk image generation cancelled by user."); break; }
            const scene = scenesToProcess[i];
            setBulkImageState(p => ({ ...p, progress: { ...p.progress, current: i + 1 } }));

            try {
                const currentSceneState = editedOutline.find(s => s.id === scene.id)!;
                const imageUrl = await generateImageForScene(currentSceneState, visualStyle);
                const updatedScene = { ...currentSceneState, imageUrl };
                onVideoSave(updatedScene); // This function updates any scene property
                setEditedOutline(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
            } catch (error) {
                 if (error instanceof DOMException && error.name === 'AbortError') break;
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setBulkImageState({ status: 'error', progress: { current: i + 1, total: scenesToProcess.length }, error: `Failed on Scene ${scene.sceneNumber}: ${errorMessage.split('Reason: ')[1] || errorMessage}` });
                return;
            }
        }

        if (signal.aborted) {
            setBulkImageState({ status: 'idle', progress: { current: 0, total: 0 } });
        } else {
            setBulkImageState(p => ({ ...p, status: 'complete' }));
            setTimeout(() => setBulkImageState({ status: 'idle', progress: { current: 0, total: 0 } }), 5000);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
             <div className="flex justify-end items-center mb-4 px-1">
                <SaveStatusIndicator status={status} />
            </div>

            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />

            <BulkGenerationControls
                videoState={bulkVideoState}
                imageState={bulkImageState}
                onGenerateVideo={handleBulkVideoGenerate}
                onCancelVideo={() => videoGenerationAbortController.current?.abort()}
                onDismissVideoError={() => setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } })}
                onGenerateImage={handleBulkImageRegenerate}
                onCancelImage={() => imageGenerationAbortController.current?.abort()}
                onDismissImageError={() => setBulkImageState({ status: 'idle', progress: { current: 0, total: 0 } })}
                isVeoKeySelected={isVeoKeySelected}
                scenesWithoutVideoCount={editedOutline.filter(s => !s.videoUrl).length}
                totalSceneCount={editedOutline.length}
            />
            
            <div className="space-y-4">
                {editedOutline.map((scene, index) => (
                    <div
                        key={scene.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="cursor-grab active:cursor-grabbing rounded-xl transition-all duration-300"
                    >
                        <SceneCard 
                            scene={scene} 
                            onFieldChange={(field, value) => handleSceneFieldChange(index, field, value)}
                            onVideoSave={onVideoSave}
                            visualStyle={visualStyle}
                            isVeoKeySelected={isVeoKeySelected}
                            onSelectKey={onSelectKey}
                            onInvalidKeyError={onInvalidKeyError}
                        />
                    </div>
                ))}
            </div>
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
    if (statusInfo.status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-2 animate-fade-in w-full">
                <p className="text-sm text-gray-300">Generating Video...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div>
                </div>
                 <button onClick={onCancel} className="text-xs bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full transition-all duration-300">Cancel</button>
            </div>
        );
    }
    
    if (statusInfo.status === 'error') {
      return (
          <div className="bg-red-900/30 border border-red-600/50 p-3 rounded-lg animate-fade-in w-full text-left">
              <h5 className="font-semibold text-white text-sm mb-2">Generation Error</h5>
              <p className="text-xs font-mono p-2 bg-black/20 rounded text-red-200/80 mb-3 break-words">
                {statusInfo.error || 'An unknown error occurred.'}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={onGenerate} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Retry</button>
              </div>
          </div>
      );
    }

    if (isVeoKeySelected === false) {
        const buttonText = hasVideo ? 'Regenerate Video' : 'Generate Video';
        const Icon = hasVideo ? RegenerateIcon : VideoIcon;
        return (
            <button 
                disabled 
                title="Please select an API Key above to enable video generation."
                className="flex items-center justify-center gap-2 w-full bg-gray-600/50 text-gray-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed text-sm"
            >
                <Icon /> {buttonText}
            </button>
        );
    }
    
    if (isVeoKeySelected === null) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 h-10">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Verifying...</span>
            </div>
        );
    }
    
    const buttonText = hasVideo ? 'Regenerate Video' : 'Generate Video';
    const Icon = hasVideo ? RegenerateIcon : VideoIcon;
    
    return (
        <button onClick={onGenerate} className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] text-sm">
            <Icon /> {buttonText}
        </button>
    );
};

interface ImageGenerationControlsProps {
  statusInfo: { status: 'idle' | 'loading' | 'error', error?: string };
  onGenerate: () => void;
  hasImage: boolean;
}

const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({ statusInfo, onGenerate, hasImage }) => {
    if (statusInfo.status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center gap-2 animate-fade-in w-full text-sm">
                <p className="text-gray-300">Generating Preview...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div>
                </div>
            </div>
        );
    }
    
    if (statusInfo.status === 'error') {
      return (
          <div className="bg-red-900/30 border border-red-600/50 p-3 rounded-lg animate-fade-in w-full text-left h-full flex flex-col justify-between">
              <div>
                <h5 className="font-semibold text-white text-sm mb-1">Image Error</h5>
                <p className="text-xs text-red-200/80 mb-2 break-words">
                    {statusInfo.error || 'An unknown error occurred.'}
                </p>
              </div>
              <div className="flex justify-end">
                <button onClick={onGenerate} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Retry</button>
              </div>
          </div>
      );
    }
    
    const buttonText = hasImage ? 'Regenerate Preview' : 'Generate Preview';
    const Icon = hasImage ? RegenerateIcon : ImageIcon;
    
    return (
        <button onClick={onGenerate} className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] text-sm">
            <Icon /> {buttonText}
        </button>
    );
};


const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, onFieldChange, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError
}) => {
    const [videoGenerationStatus, setVideoGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const [imageGenerationStatus, setImageGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const generationController = useRef<AbortController | null>(null);
    const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);

    const handleGenerateVideo = async () => {
        generationController.current = new AbortController();
        setVideoGenerationStatus({ status: 'loading' });
        try {
            const downloadLink = await generateVideoForScene(scene, visualStyle, generationController.current.signal);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            onVideoSave({ ...scene, videoUrl: finalUrl });
            setVideoGenerationStatus({ status: 'idle' });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setVideoGenerationStatus({ status: 'idle' });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            if (errorMessage.includes('Requested entity was not found.')) {
              setVideoGenerationStatus({ status: 'error', error: "Your API Key appears to be invalid. Please select a different one to continue." });
              onInvalidKeyError();
            } else {
              setVideoGenerationStatus({ status: 'error', error: errorMessage });
            }
        }
    };
    
    const handleGenerateImage = async () => {
        setImageGenerationStatus({ status: 'loading' });
        try {
            const imageUrl = await generateImageForScene(scene, visualStyle);
            onVideoSave({ ...scene, imageUrl });
            setImageGenerationStatus({ status: 'idle' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setImageGenerationStatus({ status: 'error', error: errorMessage });
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

    const EditableField: React.FC<{
        label: string;
        id: string;
        value: string;
        field: keyof Scene;
        isTextarea?: boolean;
        placeholder?: string;
        rows?: number;
    }> = ({ label, id, value, field, isTextarea, placeholder, rows = 4 }) => {
        const commonClasses = "w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition";
        return (
        <div>
            <label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>
            {isTextarea ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onFieldChange(field, e.target.value)}
                    rows={rows}
                    className={`${commonClasses} resize-y`}
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
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-mono font-bold text-violet-glow/60 select-none">{String(scene.sceneNumber).padStart(2, '0')}</span>
                <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => onFieldChange('title', e.target.value)}
                    aria-label="Scene Title"
                    className="text-xl font-bold text-white bg-transparent focus:bg-gray-900/50 focus:ring-1 focus:ring-violet-glow rounded-md p-1 -m-1 w-full"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center relative border border-white/10 overflow-hidden">
                        {videoGenerationStatus.status === 'loading' ? (
                            <div className="p-4 text-center text-sm text-gray-300">Generating video, this may take a few minutes...</div>
                        ) : scene.videoUrl ? (
                            <video key={scene.videoUrl} src={scene.videoUrl} controls className="w-full h-full object-cover"></video>
                        ) : imageGenerationStatus.status === 'loading' ? (
                            <div className="p-4 text-center text-sm text-gray-300">Generating image...</div>
                        ) : scene.imageUrl ? (
                            <img src={scene.imageUrl} alt={`Preview for ${scene.title}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-400 p-4">
                                <PlaceholderImageIcon />
                                <p className="mt-2 text-sm font-semibold">No Preview Generated</p>
                                <p className="text-xs">Use the controls to generate a preview.</p>
                            </div>
                        )}
                    </div>
                    
                    <ImageGenerationControls 
                        statusInfo={imageGenerationStatus}
                        onGenerate={handleGenerateImage}
                        hasImage={!!scene.imageUrl}
                    />

                    <VideoGenerationControls 
                        statusInfo={videoGenerationStatus}
                        onGenerate={handleGenerateVideo}
                        onCancel={handleCancelGeneration}
                        isVeoKeySelected={isVeoKeySelected}
                        onSelectKey={onSelectKey}
                        hasVideo={!!scene.videoUrl}
                    />
                     {scene.videoUrl && (
                        <button onClick={() => window.open(scene.videoUrl, '_blank')} className="flex items-center justify-center gap-2 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm w-full">
                            <DownloadIcon /><span>Download Video</span>
                        </button>
                    )}
                </div>

                <div className="lg:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditableField label="Location" id={`loc-${scene.id}`} value={scene.location} field="location" />
                        <EditableField label="Time of Day" id={`time-${scene.id}`} value={scene.timeOfDay} field="timeOfDay" />
                        <DatalistInput
                            label="Atmosphere"
                            id={`atmos-${scene.id}`}
                            value={scene.atmosphere}
                            onChange={(value) => onFieldChange('atmosphere', value)}
                            options={atmosphereOptions}
                            placeholder="e.g., Serene, Stormy..."
                        />
                        <EditableField label="Duration" id={`duration-${scene.id}`} value={scene.duration} field="duration" placeholder="e.g., 10s or 240f" />
                    </div>
                    <DatalistInput
                        label="Transition to Next Scene"
                        id={`trans-${scene.id}`}
                        value={scene.transition}
                        onChange={(value) => onFieldChange('transition', value)}
                        options={transitionOptions}
                        placeholder="e.g., Match cut on action..."
                    />
                     <EditableField
                        label="Characters in Scene"
                        id={`chars-${scene.id}`}
                        value={scene.charactersInScene}
                        field="charactersInScene"
                        isTextarea
                        rows={2}
                        placeholder="Describe characters present and their key actions/emotions..."
                    />
                    <EditableField
                        label="Description"
                        id={`desc-${scene.id}`}
                        value={scene.description}
                        field="description"
                        isTextarea
                        rows={4}
                        placeholder="Describe the scene's mood, setting, and key actions..."
                    />
                    <div className="relative">
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
            </div>
        </div>
    );
};