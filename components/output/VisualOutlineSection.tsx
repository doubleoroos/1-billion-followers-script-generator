import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Scene, VisualStyle } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene, generateImageForScene } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { CopyButton } from '../ui/CopyButton';

// Re-usable Icons
const DownloadIcon = () => <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PlaceholderImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;
const RegenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;

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
    'Misty', 'Golden Hour', 'Stormy', 'Serene', 'Eerie', 'Bustling', 'Oppressive', 'Tranquil', 'Vibrant', 'Desolate', 'Futuristic', 'Nostalgic',
];
const transitionOptions = [
    'Cut to:', 'Cross-dissolve to:', 'Slow dissolve to:', 'Fade in from Black.', 'Fade to Black.', 'Match cut on action to:', 'Jump cut to:', 'Smash cut to black.', 'Wipe left to:', 'Wipe right to:', 'Iris out.', 'Iris in.',
];

const DatalistInput: React.FC<{
  label: string; id: string; value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; disabled?: boolean;
}> = ({ label, id, value, onChange, options, placeholder, disabled = false }) => {
  const datalistId = `${id}-list`;
  return (
    <div>
      <label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>
      <input
        id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} list={datalistId}
        className="w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition disabled:bg-gray-800/20 disabled:text-gray-500 disabled:cursor-not-allowed"
        placeholder={placeholder} disabled={disabled}
      />
      <datalist id={datalistId}>{options.map(option => (<option key={option} value={option} />))}</datalist>
    </div>
  );
};

type BulkStatus = 'idle' | 'running' | 'error' | 'complete';
type BulkProgress = { current: number; total: number };

interface BulkGenerationControlsProps {
    promptState: { status: BulkStatus; progress: BulkProgress; error?: string };
    videoState: { status: BulkStatus; progress: BulkProgress; error?: string };
    onGeneratePrompt: () => void;
    onCancelPrompt: () => void;
    onDismissPromptError: () => void;
    onGenerateVideo: () => void;
    onCancelVideo: () => void;
    onDismissVideoError: () => void;
    isVeoKeySelected: boolean | null;
    scenesWithoutVideoCount: number;
}

const BulkGenerationControls: React.FC<BulkGenerationControlsProps> = ({
    promptState, onGeneratePrompt, onCancelPrompt, onDismissPromptError,
    videoState, onGenerateVideo, onCancelVideo, onDismissVideoError,
    isVeoKeySelected, scenesWithoutVideoCount
}) => {
    const renderGenericUI = (
        state: { status: BulkStatus; progress: BulkProgress; error?: string },
        onGenerate: () => void, onCancel: () => void, onDismissError: () => void,
        title: string, buttonText: string, Icon: React.FC, isDisabled: boolean, disabledTooltip: string
    ) => {
        if (state.status === 'running') {
            const progressPercentage = state.progress.total > 0 ? (state.progress.current / state.progress.total) * 100 : 0;
            return (
                <div className="flex-1 p-4 bg-blue-deep/50 rounded-lg border border-violet-glow/30 animate-fade-in text-center">
                    <h4 className="font-bold text-white">{title} in Progress</h4>
                    <p className="text-sm text-gray-300 my-2">Processing scene {state.progress.current} of {state.progress.total}...</p>
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
                    <h4 className="font-bold text-white">{title} Failed</h4>
                    <p className="text-sm text-red-200 my-2 font-mono break-all">{state.error}</p>
                    <div className="flex justify-center gap-4 mt-3">
                        <button onClick={onDismissError} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">Dismiss</button>
                    </div>
                </div>
            );
        }
        if (state.status === 'complete') {
            return (
                 <div className="flex-1 p-4 bg-green-900/40 rounded-lg border border-green-500/50 animate-fade-in text-center">
                    <h4 className="font-bold text-white">{title} Complete!</h4>
                    <p className="text-sm text-green-200 my-2">All {state.progress.total} scenes processed.</p>
                </div>
            );
        }
        return (
            <div className="flex-1">
                 <button 
                    onClick={onGenerate} 
                    disabled={isDisabled}
                    title={disabledTooltip}
                    className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg transition-all text-sm disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100 border border-white/10"
                >
                    <Icon />
                    {buttonText} ({scenesWithoutVideoCount})
                </button>
            </div>
        );
    };

    const isPromptDisabled = scenesWithoutVideoCount === 0;
    const promptDisabledTooltip = isPromptDisabled ? 'All scenes already have a generated video.' : '';

    let videoDisabledTooltip = '';
    if (isVeoKeySelected === false) videoDisabledTooltip = 'Please select an API key to enable video generation.';
    else if (scenesWithoutVideoCount === 0) videoDisabledTooltip = 'All scenes already have a generated video.';
    const isVideoDisabled = !isVeoKeySelected || scenesWithoutVideoCount === 0;

    return (
        <div className="bg-blue-deep/30 p-4 rounded-lg border border-white/10 text-center animate-fade-in mb-8">
            <h4 className="text-lg font-bold text-white mb-2">Bulk Asset Generation</h4>
            <p className="text-gray-300 text-sm max-w-2xl mx-auto mb-4">
                Use these controls to first regenerate cinematic prompts for missing scenes, then generate the final video clips. This can take several minutes.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-stretch gap-4">
                {renderGenericUI(promptState, onGeneratePrompt, onCancelPrompt, onDismissPromptError, 'Prompt Regeneration', 'Regenerate Missing Prompts', SparklesIcon, isPromptDisabled, promptDisabledTooltip)}
                {renderGenericUI(videoState, onGenerateVideo, onCancelVideo, onDismissVideoError, 'Video Generation', 'Generate Missing Videos', VideoIcon, isVideoDisabled, videoDisabledTooltip)}
            </div>
        </div>
    );
};

export const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({ 
  outline, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError 
}) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const { status, save } = useAutosave({ onSave });
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for bulk operations
    const [bulkPromptState, setBulkPromptState] = useState<{ status: BulkStatus; progress: BulkProgress; error?: string }>({ status: 'idle', progress: { current: 0, total: 0 } });
    const [bulkVideoState, setBulkVideoState] = useState<{ status: BulkStatus; progress: BulkProgress; error?: string }>({ status: 'idle', progress: { current: 0, total: 0 } });
    const promptGenerationAbortController = useRef<AbortController | null>(null);
    const videoGenerationAbortController = useRef<AbortController | null>(null);
     
    useEffect(() => { setEditedOutline(outline); }, [outline]);

    const handleSceneFieldChange = (index: number, field: keyof Scene, value: any) => {
        const newOutline = [...editedOutline];
        newOutline[index] = { ...newOutline[index], [field]: value };
        setEditedOutline(newOutline);
        save(newOutline);
    };

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setTimeout(() => e.currentTarget.classList.add('opacity-40', 'scale-[0.98]'), 0);
    };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
        if (dragItem.current !== index) e.currentTarget.classList.add('bg-violet-glow/10');
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => e.currentTarget.classList.remove('bg-violet-glow/10');
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-violet-glow/10');
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const reorderedOutline = [...editedOutline];
            const draggedItemContent = reorderedOutline.splice(dragItem.current, 1)[0];
            reorderedOutline.splice(dragOverItem.current, 0, draggedItemContent);
            const finalOutline = reorderedOutline.map((scene, index) => ({ ...scene, sceneNumber: index + 1 }));
            setEditedOutline(finalOutline);
            save(finalOutline);
        }
    };
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-40', 'scale-[0.98]');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleBulkPromptGenerate = async () => {
        promptGenerationAbortController.current = new AbortController();
        const signal = promptGenerationAbortController.current.signal;
        const scenesToProcess = editedOutline.filter(scene => !scene.videoUrl);
        if (scenesToProcess.length === 0) return;

        setBulkPromptState({ status: 'running', progress: { current: 0, total: scenesToProcess.length } });
        const successfulUpdates: Scene[] = [];

        try {
            for (let i = 0; i < scenesToProcess.length; i++) {
                if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                const scene = scenesToProcess[i];
                setBulkPromptState(p => ({ ...p, progress: { ...p.progress, current: i + 1 } }));
                const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
                successfulUpdates.push({ ...scene, videoPrompt: newPrompt });
            }
            setBulkPromptState(p => ({ ...p, status: 'complete' }));
            setTimeout(() => setBulkPromptState({ status: 'idle', progress: { current: 0, total: 0 } }), 5000);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setBulkPromptState({ status: 'idle', progress: { current: 0, total: 0 } });
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                const errorReason = errorMessage.split('Reason: ')[1] || errorMessage;
                const progress = bulkPromptState.progress.current;
                const sceneWithError = scenesToProcess[progress > 0 ? progress - 1 : 0];
                setBulkPromptState({ status: 'error', progress: bulkPromptState.progress, error: `Failed on Scene ${sceneWithError.sceneNumber}: ${errorReason}` });
            }
        } finally {
            if (successfulUpdates.length > 0) {
                const newOutline = editedOutline.map(originalScene => successfulUpdates.find(u => u.id === originalScene.id) || originalScene);
                setEditedOutline(newOutline);
                save(newOutline);
            }
        }
    };

    const handleBulkVideoGenerate = async () => {
        videoGenerationAbortController.current = new AbortController();
        const signal = videoGenerationAbortController.current.signal;
    
        let scenesToProcess = editedOutline.filter(scene => !scene.videoUrl);
        const totalScenesToProcess = scenesToProcess.length;
        if (totalScenesToProcess === 0) return;
    
        setBulkVideoState({ status: 'running', progress: { current: 0, total: totalScenesToProcess } });
    
        let completedInThisRun = new Set<string>(editedOutline.filter(s => !!s.videoUrl).map(s => s.id));
        let totalGeneratedCount = 0;
        let lastLoopSceneCount = scenesToProcess.length + 1;
    
        while (scenesToProcess.length > 0) {
            if (signal.aborted) {
                console.log("Bulk video generation cancelled by user.");
                break;
            }
    
            if (scenesToProcess.length === lastLoopSceneCount) {
                const remainingSceneNumbers = scenesToProcess.map(s => `#${s.sceneNumber}`).join(', ');
                setBulkVideoState({ status: 'error', progress: bulkVideoState.progress, error: `Deadlock detected. Check for circular dependencies among scenes: ${remainingSceneNumbers}` });
                return;
            }
            lastLoopSceneCount = scenesToProcess.length;
    
            const generatableScenes = scenesToProcess.filter(scene =>
                (scene.dependsOn ?? []).every(depId => completedInThisRun.has(depId))
            );
    
            for (const scene of generatableScenes) {
                if (signal.aborted) break;
                
                totalGeneratedCount++;
                setBulkVideoState(p => ({ ...p, progress: { ...p.progress, current: totalGeneratedCount } }));
    
                try {
                    let currentSceneState = editedOutline.find(s => s.id === scene.id)!;
                    if (!currentSceneState.videoPrompt?.trim()) {
                        const newPrompt = await regenerateVideoPromptForScene(currentSceneState, visualStyle);
                        currentSceneState = { ...currentSceneState, videoPrompt: newPrompt };
                        const newOutline = editedOutline.map(s => s.id === currentSceneState.id ? currentSceneState : s);
                        setEditedOutline(newOutline);
                        save(newOutline);
                    }
    
                    const downloadLink = await generateVideoForScene(currentSceneState, visualStyle, signal);
                    const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                    const updatedScene = { ...currentSceneState, videoUrl: finalUrl };
                    
                    onVideoSave(updatedScene);
                    setEditedOutline(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
                    completedInThisRun.add(scene.id);
    
                } catch (error) {
                    if (error instanceof DOMException && error.name === 'AbortError') break;
                    
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    const errorReason = errorMessage.split('Reason: ')[1] || errorMessage;
    
                    if (errorReason.includes('Requested entity was not found.')) {
                        onInvalidKeyError();
                        setBulkVideoState({ status: 'error', progress: bulkVideoState.progress, error: `API Key is invalid. Please select a valid key.` });
                    } else {
                        setBulkVideoState({ status: 'error', progress: bulkVideoState.progress, error: `Failed on Scene ${scene.sceneNumber}: ${errorReason}` });
                    }
                    return;
                }
            }
            
            scenesToProcess = scenesToProcess.filter(scene => !completedInThisRun.has(scene.id));
            if (signal.aborted) break;
        }
    
        if (signal.aborted) {
            setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } });
        } else {
            setBulkVideoState(p => ({ ...p, status: 'complete' }));
            setTimeout(() => setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } }), 5000);
        }
    };

    const filteredScenes = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return editedOutline.map((scene, index) => ({ scene, originalIndex: index }));
        return editedOutline.map((scene, index) => ({ scene, originalIndex: index }))
            .filter(({ scene }) =>
                scene.title.toLowerCase().includes(lowercasedFilter) ||
                scene.description.toLowerCase().includes(lowercasedFilter) ||
                scene.location.toLowerCase().includes(lowercasedFilter)
            );
    }, [searchTerm, editedOutline]);

    const completedSceneIds = useMemo(() => new Set(editedOutline.filter(s => !!s.videoUrl).map(s => s.id)), [editedOutline]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-end items-center mb-4 px-1"><SaveStatusIndicator status={status} /></div>
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                <input
                    type="text" placeholder="Search scenes by title, description, or location..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-blue-deep/30 border border-white/10 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-glow"
                />
                {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Clear search"><ClearIcon /></button>)}
            </div>
            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />
            <BulkGenerationControls
                promptState={bulkPromptState}
                onGeneratePrompt={handleBulkPromptGenerate}
                onCancelPrompt={() => promptGenerationAbortController.current?.abort()}
                onDismissPromptError={() => setBulkPromptState({ status: 'idle', progress: { current: 0, total: 0 } })}
                videoState={bulkVideoState}
                onGenerateVideo={handleBulkVideoGenerate}
                onCancelVideo={() => videoGenerationAbortController.current?.abort()}
                onDismissVideoError={() => setBulkVideoState({ status: 'idle', progress: { current: 0, total: 0 } })}
                isVeoKeySelected={isVeoKeySelected}
                scenesWithoutVideoCount={editedOutline.filter(s => !s.videoUrl).length}
            />
            <div className="space-y-4">
                 {filteredScenes.length > 0 ? (
                    filteredScenes.map(({ scene, originalIndex }) => (
                        <div
                            key={scene.id} draggable onDragStart={(e) => handleDragStart(e, originalIndex)}
                            onDragEnter={(e) => handleDragEnter(e, originalIndex)} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()} className="cursor-grab active:cursor-grabbing rounded-xl transition-all duration-300"
                        >
                            <SceneCard 
                                scene={scene} onFieldChange={(field, value) => handleSceneFieldChange(originalIndex, field, value)}
                                onVideoSave={onVideoSave} visualStyle={visualStyle} isVeoKeySelected={isVeoKeySelected}
                                onSelectKey={onSelectKey} onInvalidKeyError={onInvalidKeyError} allScenes={editedOutline} completedSceneIds={completedSceneIds}
                            />
                        </div>
                    ))
                 ) : (
                    <div className="text-center py-12 px-6 bg-black/20 rounded-lg border border-white/10 animate-fade-in">
                        <h4 className="text-lg font-semibold text-white">No Scenes Found</h4>
                        <p className="text-gray-400 mt-1">Your search for "{searchTerm}" did not match any scenes.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

interface SceneCardProps {
  scene: Scene; onFieldChange: (field: keyof Scene, value: any) => void; onVideoSave: (scene: Scene) => void;
  visualStyle: VisualStyle; isVeoKeySelected: boolean | null; onSelectKey: () => Promise<void>; onInvalidKeyError: () => void;
  allScenes: Scene[]; completedSceneIds: Set<string>;
}
interface VideoGenerationControlsProps {
  statusInfo: { status: 'idle' | 'loading' | 'error', error?: string }; onGenerate: () => void; onCancel: () => void;
  isVeoKeySelected: boolean | null; onSelectKey: () => Promise<void>; hasVideo: boolean; disabled?: boolean;
}

const VideoGenerationControls: React.FC<VideoGenerationControlsProps> = ({ statusInfo, onGenerate, onCancel, isVeoKeySelected, onSelectKey, hasVideo, disabled = false }) => {
    if (statusInfo.status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-2 animate-fade-in w-full">
                <p className="text-sm text-gray-300">Generating Video...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden relative"><div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div></div>
                 <button onClick={onCancel} className="text-xs bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full transition-all duration-300">Cancel</button>
            </div>
        );
    }
    if (statusInfo.status === 'error') {
      return (
          <div className="bg-red-900/30 border border-red-600/50 p-3 rounded-lg animate-fade-in w-full text-left">
              <h5 className="font-semibold text-white text-sm mb-2">Generation Error</h5>
              <p className="text-xs font-mono p-2 bg-black/20 rounded text-red-200/80 mb-3 break-words">{statusInfo.error || 'An unknown error occurred.'}</p>
              <div className="flex justify-end gap-2"><button onClick={onGenerate} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Retry</button></div>
          </div>
      );
    }
    if (isVeoKeySelected === false || disabled) {
        const buttonText = hasVideo ? 'Regenerate Video' : 'Generate Video'; const Icon = hasVideo ? RegenerateIcon : VideoIcon;
        const title = disabled ? "Prerequisites not met. Generate videos for dependent scenes first." : "Please select an API Key above to enable video generation.";
        return (<button disabled title={title} className="flex items-center justify-center gap-2 w-full bg-gray-600/50 text-gray-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed text-sm"><Icon /> {buttonText}</button>);
    }
    if (isVeoKeySelected === null) {
        return (<div className="flex items-center justify-center gap-2 text-sm text-gray-400 h-10"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Verifying...</span></div>);
    }
    const buttonText = hasVideo ? 'Regenerate Video' : 'Generate Video'; const Icon = hasVideo ? RegenerateIcon : VideoIcon;
    return (<button onClick={onGenerate} className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] text-sm"><Icon /> {buttonText}</button>);
};

interface ImageGenerationControlsProps { statusInfo: { status: 'idle' | 'loading' | 'error', error?: string }; onGenerate: () => void; hasImage: boolean; disabled?: boolean; }
const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({ statusInfo, onGenerate, hasImage, disabled = false }) => {
    if (statusInfo.status === 'loading') {
        return (<div className="flex flex-col items-center justify-center gap-2 animate-fade-in w-full text-sm"><p className="text-gray-300">Generating Preview...</p><div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden relative"><div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-1/2 rounded-full animate-progress-indeterminate"></div></div></div>);
    }
    if (statusInfo.status === 'error') {
      return (<div className="bg-red-900/30 border border-red-600/50 p-3 rounded-lg animate-fade-in w-full text-left h-full flex flex-col justify-between"><div><h5 className="font-semibold text-white text-sm mb-1">Image Error</h5><p className="text-xs text-red-200/80 mb-2 break-words">{statusInfo.error || 'An unknown error occurred.'}</p></div><div className="flex justify-end"><button onClick={onGenerate} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-md transition-all active:scale-[0.98]">Retry</button></div></div>);
    }
    const buttonText = hasImage ? 'Regenerate Preview' : 'Generate Preview'; const Icon = hasImage ? RegenerateIcon : ImageIcon;
    return (<button onClick={onGenerate} disabled={disabled} title={disabled ? "Prerequisites not met." : ""} className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] text-sm disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed"><Icon /> {buttonText}</button>);
};

const DependencyManager: React.FC<{ currentScene: Scene; allScenes: Scene[]; onDependenciesChange: (dependencies: string[]) => void; disabled?: boolean; }> = ({ currentScene, allScenes, onDependenciesChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false); const wrapperRef = useRef<HTMLDivElement>(null);
    const dependencies = useMemo(() => currentScene.dependsOn ?? [], [currentScene.dependsOn]);
    const availableScenes = useMemo(() => allScenes.filter(s => s.id !== currentScene.id), [allScenes, currentScene.id]);
    const handleToggleDependency = (sceneId: string) => { onDependenciesChange(dependencies.includes(sceneId) ? dependencies.filter(id => id !== sceneId) : [...dependencies, sceneId]); };
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    const dependencyScenes = useMemo(() => dependencies.map(id => allScenes.find(s => s.id === id)).filter((s): s is Scene => !!s), [dependencies, allScenes]);
    return (
        <div className="space-y-2">
            <div ref={wrapperRef} className="relative">
                <button onClick={() => setIsOpen(!isOpen)} disabled={disabled} className="w-full text-left bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition flex justify-between items-center disabled:bg-gray-800/20 disabled:text-gray-500 disabled:cursor-not-allowed">
                    <span className="text-sm font-semibold text-gray-400">Manage Prerequisites</span><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isOpen && (<div className="absolute z-20 top-full mt-1 w-full bg-gray-900 border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">{availableScenes.map(scene => (<label key={scene.id} className="flex items-center gap-3 p-2 hover:bg-violet-glow/10 cursor-pointer"><input type="checkbox" checked={dependencies.includes(scene.id)} onChange={() => handleToggleDependency(scene.id)} className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-violet-500 focus:ring-violet-500" /><span className="text-sm text-gray-300"><span className="font-mono text-gray-500 mr-2">{String(scene.sceneNumber).padStart(2, '0')}</span>{scene.title}</span></label>))}</div>)}
            </div>
             {dependencyScenes.length > 0 && (<div className="flex flex-wrap gap-2 pt-1">{dependencyScenes.map(depScene => (<div key={depScene.id} className="flex items-center gap-1 bg-gray-700/50 text-xs text-gray-300 font-semibold px-2 py-1 rounded-full"><span>#{depScene.sceneNumber}</span>{!disabled && (<button onClick={() => handleToggleDependency(depScene.id)} className="text-gray-400 hover:text-white" aria-label={`Remove dependency on scene ${depScene.sceneNumber}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}</div>))}</div>)}
        </div>
    );
};

const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, onFieldChange, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError, allScenes, completedSceneIds
}) => {
    const [videoGenerationStatus, setVideoGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const [imageGenerationStatus, setImageGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const generationController = useRef<AbortController | null>(null);
    const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
    const [promptError, setPromptError] = useState<string | null>(null);
    const [isDurationValid, setIsDurationValid] = useState(true);

    const unmetDependencies = useMemo(() => (scene.dependsOn ?? []).filter(depId => !completedSceneIds.has(depId)).map(depId => allScenes.find(s => s.id === depId)).filter((s): s is Scene => !!s), [scene.dependsOn, allScenes, completedSceneIds]);
    const isLocked = unmetDependencies.length > 0;

    const validateDuration = (value: string) => /^\d+\s*s$/i.test(value.trim());
    useEffect(() => { setIsDurationValid(validateDuration(scene.duration)); }, [scene.duration]);

    const handleGenerateVideo = async () => {
        if (isLocked) return;
        generationController.current = new AbortController(); setVideoGenerationStatus({ status: 'loading' });
        try {
            const downloadLink = await generateVideoForScene(scene, visualStyle, generationController.current.signal);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            onVideoSave({ ...scene, videoUrl: finalUrl }); setVideoGenerationStatus({ status: 'idle' });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') { setVideoGenerationStatus({ status: 'idle' }); return; }
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            if (errorMessage.includes('Requested entity was not found.')) { setVideoGenerationStatus({ status: 'error', error: "Your API Key appears to be invalid. Please select a different one." }); onInvalidKeyError();
            } else { setVideoGenerationStatus({ status: 'error', error: errorMessage.split('Reason: ')[1] || errorMessage }); }
        }
    };
    const handleGenerateImage = async () => {
        if (isLocked) return; setImageGenerationStatus({ status: 'loading' });
        try { const imageUrl = await generateImageForScene(scene, visualStyle); onVideoSave({ ...scene, imageUrl }); setImageGenerationStatus({ status: 'idle' });
        } catch (error) { const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."; setImageGenerationStatus({ status: 'error', error: errorMessage.split('Reason: ')[1] || errorMessage });}
    };
    const handleRegeneratePrompt = async () => {
        if (isLocked) return; setIsRegeneratingPrompt(true); setPromptError(null);
        try { const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle); onFieldChange('videoPrompt', newPrompt);
        } catch (error) { console.error("Failed to regenerate prompt:", error); const errorMessage = error instanceof Error ? error.message : "Failed to regenerate prompt."; setPromptError(errorMessage); setTimeout(() => setPromptError(null), 5000);
        } finally { setIsRegeneratingPrompt(false); }
    };
    const handleCancelGeneration = () => { generationController.current?.abort(); };

    const EditableField: React.FC<{ label: string; id: string; value: string; field: keyof Scene; isTextarea?: boolean; placeholder?: string; rows?: number; }> = ({ label, id, value, field, isTextarea, placeholder, rows = 4 }) => {
        const commonClasses = "w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition disabled:bg-gray-800/20 disabled:text-gray-500 disabled:cursor-not-allowed";
        return (<div><label htmlFor={id} className="block text-gray-400 font-semibold mb-1 text-sm">{label}</label>{isTextarea ? (<textarea id={id} value={value} onChange={(e) => onFieldChange(field, e.target.value)} rows={rows} className={`${commonClasses} resize-y`} placeholder={placeholder} disabled={isLocked} />) : (<input id={id} type="text" value={value} onChange={(e) => onFieldChange(field, e.target.value)} className={commonClasses} placeholder={placeholder} disabled={isLocked} />)}</div>);
    };

    return (
        <div className="relative bg-gradient-to-br from-gray-900/20 to-gray-800/10 rounded-xl p-6 transition-all duration-300 border border-white/10 shadow-lg">
            {isLocked && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl text-center p-4">
                    <LockIcon /><p className="mt-2 font-bold text-white">Scene Locked</p>
                    <p className="text-sm text-gray-300">Waiting for prerequisite scene{unmetDependencies.length > 1 ? 's' : ''}:<span className="font-semibold text-violet-glow ml-1">{unmetDependencies.map(d => `#${d.sceneNumber}`).join(', ')}</span></p>
                </div>
            )}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-mono font-bold text-violet-glow/60 select-none">{String(scene.sceneNumber).padStart(2, '0')}</span>
                <input type="text" value={scene.title} onChange={(e) => onFieldChange('title', e.target.value)} aria-label="Scene Title" className="text-xl font-bold text-white bg-transparent focus:bg-gray-900/50 focus:ring-1 focus:ring-violet-glow rounded-md p-1 -m-1 w-full disabled:text-gray-500" disabled={isLocked} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center relative border border-white/10 overflow-hidden">
                        {videoGenerationStatus.status === 'loading' ? (<div className="p-4 text-center text-sm text-gray-300">Generating video...</div>) : scene.videoUrl ? (<video key={scene.videoUrl} src={scene.videoUrl} controls className="w-full h-full object-cover"></video>) : imageGenerationStatus.status === 'loading' ? (<div className="p-4 text-center text-sm text-gray-300">Generating image...</div>) : scene.imageUrl ? (<img src={scene.imageUrl} alt={`Preview for ${scene.title}`} className="w-full h-full object-cover" />) : (<div className="text-center text-gray-400 p-4"><PlaceholderImageIcon /><p className="mt-2 text-sm font-semibold">No Preview</p></div>)}
                    </div>
                    <ImageGenerationControls statusInfo={imageGenerationStatus} onGenerate={handleGenerateImage} hasImage={!!scene.imageUrl} disabled={isLocked} />
                    <VideoGenerationControls statusInfo={videoGenerationStatus} onGenerate={handleGenerateVideo} onCancel={handleCancelGeneration} isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} hasVideo={!!scene.videoUrl} disabled={isLocked} />
                     {scene.videoUrl && (<a href={scene.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm w-full"><DownloadIcon /><span>Download Video</span></a>)}
                </div>
                <div className="lg:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditableField label="Location" id={`loc-${scene.id}`} value={scene.location} field="location" />
                        <EditableField label="Time of Day" id={`time-${scene.id}`} value={scene.timeOfDay} field="timeOfDay" />
                        <DatalistInput label="Atmosphere" id={`atmos-${scene.id}`} value={scene.atmosphere} onChange={(value) => onFieldChange('atmosphere', value)} options={atmosphereOptions} placeholder="e.g., Serene, Stormy..." disabled={isLocked} />
                        <div>
                            <label htmlFor={`duration-${scene.id}`} className="block text-gray-400 font-semibold mb-1 text-sm">Duration</label>
                            <div className="relative pb-4">
                                <input id={`duration-${scene.id}`} type="text" value={scene.duration} onChange={(e) => onFieldChange('duration', e.target.value)} className={`w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border transition disabled:bg-gray-800/20 disabled:text-gray-500 ${isDurationValid ? 'border-transparent hover:border-white/20 focus:border-violet-glow' : 'border-red-500/70 focus:border-red-500'}`} placeholder="e.g., 10s" disabled={isLocked} />
                                {!isDurationValid && (<p className="absolute left-1 top-full mt-1 text-xs text-red-400 animate-fade-in" role="alert">Format must be a number followed by 's', e.g., '15s'.</p>)}
                            </div>
                        </div>
                    </div>
                    <DatalistInput label="Transition to Next Scene" id={`trans-${scene.id}`} value={scene.transition} onChange={(value) => onFieldChange('transition', value)} options={transitionOptions} placeholder="e.g., Match cut on action..." disabled={isLocked} />
                     <EditableField label="Characters in Scene" id={`chars-${scene.id}`} value={scene.charactersInScene} field="charactersInScene" isTextarea rows={2} placeholder="Describe characters and their key actions..." />
                    <EditableField label="Key Visual Elements" id={`keyvis-${scene.id}`} value={scene.keyVisualElements} field="keyVisualElements" isTextarea rows={3} placeholder="e.g., A single glowing flower..." />
                    <EditableField label="Description" id={`desc-${scene.id}`} value={scene.description} field="description" isTextarea rows={4} placeholder="*Describe the scene's mood, setting...*" />
                    <DependencyManager currentScene={scene} allScenes={allScenes} onDependenciesChange={(deps) => onFieldChange('dependsOn', deps)} disabled={isLocked} />
                    <div>
                        <label htmlFor={`prompt-${scene.id}`} className="block text-gray-400 font-semibold mb-1 text-sm">Video Generation Prompt</label>
                        <div className="relative group">
                            <textarea id={`prompt-${scene.id}`} value={scene.videoPrompt || ''} onChange={(e) => onFieldChange('videoPrompt', e.target.value)} className="w-full bg-gray-900/40 p-2 rounded-md text-gray-200 border border-transparent hover:border-white/20 focus:border-violet-glow focus:bg-gray-900/80 transition h-28 pr-28 resize-y disabled:bg-gray-800/20 disabled:text-gray-500" placeholder="A detailed, cinematic prompt..." disabled={isLocked} />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <button onClick={handleRegeneratePrompt} disabled={isRegeneratingPrompt || isLocked} title="Regenerate prompt with AI" className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-violet-glow disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isRegeneratingPrompt ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SparklesIcon />}
                                </button>
                                <CopyButton textToCopy={scene.videoPrompt || ''}/>
                            </div>
                        </div>
                        {promptError && (<p className="text-xs text-red-400 mt-1 animate-fade-in">{promptError}</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};