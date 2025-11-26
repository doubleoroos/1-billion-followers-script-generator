
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Scene, VisualStyle, Character } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene, generateImageForScene, regenerateImagePromptForScene, refineSceneTransitions, processInBatches, regenerateTitleForScene } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { CopyButton } from '../ui/CopyButton';
import { useSound } from '../hooks/useSound';

// Re-usable Icons
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PlaceholderImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const SearchIcon = () => <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const parseVideoGenerationError = (error: unknown): { userMessage: string; isApiKeyError: boolean } => {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const reason = errorMessage.split('Reason: ')[1] || errorMessage;
    const lowerCaseReason = reason.toLowerCase();

    if (lowerCaseReason.includes("requested entity was not found") || lowerCaseReason.includes("api key not valid")) {
        return {
            userMessage: "Invalid API Key. Please select a valid, billed API key and retry.",
            isApiKeyError: true,
        };
    }
    if (lowerCaseReason.includes("quota") || lowerCaseReason.includes("billing")) {
        return {
            userMessage: "Quota exceeded or billing issue. Please check your project's billing status and usage limits.",
            isApiKeyError: true,
        };
    }
    return { userMessage: reason, isApiKeyError: false };
};


const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-cyan">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Synced.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300">{content}</div>;
};

interface VisualOutlineSectionProps {
  outline: Scene[];
  characters: Character[];
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
  const playSound = useSound();

  if (isVeoKeySelected === true) {
    return null;
  }

  if (isVeoKeySelected === null) {
    return (
      <div className="panel-glass p-4 rounded-2xl text-center animate-fade-in mb-8 flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-text-secondary">Verifying API key status...</span>
      </div>
    );
  }
  
  const handleSelectKeyClick = () => {
    playSound();
    onSelectKey();
  };

  return (
    <div className="panel-glass p-6 rounded-2xl border border-violet-500/50 text-center animate-fade-in mb-8">
      <h4 className="text-lg font-bold text-text-primary mb-2">Enable Video Generation</h4>
      <p className="text-text-secondary text-sm max-w-xl mx-auto mb-3">
          To generate cinematic clips with Google's Veo model, a billed API key is required. This ensures access to the necessary computational resources.
      </p>
      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan hover:underline mb-4 block">Learn more about billing</a>
      <button onClick={handleSelectKeyClick} className="btn-glow flex items-center justify-center gap-2 mx-auto bg-primary-action-gradient text-white font-bold py-2 px-5 rounded-full text-sm">
          <KeyIcon /> Select API Key
      </button>
    </div>
  );
};

const DatalistInput: React.FC<{
  label: string; id: string; value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; disabled?: boolean;
}> = ({ label, id, value, onChange, options, placeholder, disabled = false }) => {
  const datalistId = `${id}-list`;
  return (
    <div>
      <label htmlFor={id} className="block text-slate-400 font-medium mb-1 text-xs uppercase tracking-wide">{label}</label>
      <input
        id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} list={datalistId}
        className="w-full bg-slate-900/50 p-2.5 rounded-lg text-white text-sm border border-white/10 hover:border-violet-500/50 focus:border-violet-500 focus:bg-slate-900 transition disabled:opacity-50"
        placeholder={placeholder} disabled={disabled}
      />
      <datalist id={datalistId}>{options.map(option => (<option key={option} value={option} />))}</datalist>
    </div>
  );
};

// Cinematic Scene Card
const CinematicSceneCard: React.FC<{
  scene: Scene;
  characters: Character[];
  visualStyle: VisualStyle;
  onUpdate: (scene: Scene) => void;
  onGenerateVideo: (scene: Scene) => void;
  onGenerateImage: (scene: Scene) => void;
  onRegenerateVideoPrompt: (scene: Scene) => void;
  onRegenerateImagePrompt: (scene: Scene) => void;
  isVideoGenerating: boolean;
  isImageGenerating: boolean;
  isPromptRegenerating: boolean;
  isVeoKeySelected: boolean | null;
}> = ({
  scene, characters, onUpdate, onGenerateVideo, onGenerateImage, onRegenerateVideoPrompt, onRegenerateImagePrompt,
  isVideoGenerating, isImageGenerating, isPromptRegenerating, isVeoKeySelected
}) => {
    const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');
    const playSound = useSound();

    const atmosphereOptions = ['Misty', 'Golden Hour', 'Stormy', 'Serene', 'Eerie', 'Bustling', 'Oppressive', 'Tranquil', 'Vibrant', 'Desolate', 'Futuristic', 'Nostalgic'];
    const transitionOptions = ['Cut to:', 'Cross-dissolve to:', 'Fade to Black.', 'Match cut on action to:', 'Jump cut to:', 'Smash cut to black.'];

    const sceneCharNames = useMemo(() => {
        return scene.charactersInScene.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }, [scene.charactersInScene]);

    const getCharacter = (name: string) => characters.find(c => c.name.toLowerCase() === name.toLowerCase());

    const scrollToCharacter = (charId: string) => {
        const el = document.getElementById(`character-card-${charId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect
            el.classList.add('ring-2', 'ring-violet-500', 'shadow-[0_0_30px_rgba(139,92,246,0.5)]');
            setTimeout(() => el.classList.remove('ring-2', 'ring-violet-500', 'shadow-[0_0_30px_rgba(139,92,246,0.5)]'), 2000);
        }
    };

    return (
        <div className="panel-glass-strong rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-glow-violet/20 border border-white/10 group">
            
            {/* Header / Metadata Strip */}
            <div className="bg-slate-900/80 border-b border-white/5 p-4 flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-300 font-bold font-mono shrink-0 mt-1">
                        {scene.sceneNumber}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-wide">{scene.title}</h3>
                        <p className="text-xs text-slate-400 mb-2">{scene.location} • {scene.timeOfDay} • {scene.duration}</p>
                        
                        {/* Character Chips */}
                        <div className="flex flex-wrap gap-2">
                            {sceneCharNames.map((name, idx) => {
                                const char = getCharacter(name);
                                return (
                                    <button 
                                        key={idx}
                                        onClick={(e) => {
                                            if (char) {
                                                e.stopPropagation();
                                                playSound();
                                                scrollToCharacter(char.id);
                                            }
                                        }}
                                        disabled={!char}
                                        className={`
                                            flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all
                                            ${char 
                                                ? 'bg-violet-500/10 border-violet-500/20 text-violet-200 hover:bg-violet-500/20 hover:border-violet-500/50 cursor-pointer' 
                                                : 'bg-slate-800 border-white/5 text-slate-500 cursor-default'}
                                        `}
                                        title={char ? `Jump to ${char.name}` : 'Character not found in cast list'}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${char ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveTab('video')} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${activeTab === 'video' ? 'bg-violet-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                        <VideoIcon /> Video
                    </button>
                    <button onClick={() => setActiveTab('image')} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors ${activeTab === 'image' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                        <ImageIcon /> Image
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Visual Preview Area (Left / Top) */}
                <div className="lg:col-span-7 bg-black relative min-h-[300px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10">
                    
                    {/* VIDEO TAB CONTENT */}
                    {activeTab === 'video' && (
                        <>
                            {scene.videoUrl ? (
                                <video src={scene.videoUrl} controls className="w-full h-full object-contain max-h-[400px]" />
                            ) : (
                                <div className="text-center p-8">
                                    <div className={`mb-4 inline-block p-4 rounded-full ${isVideoGenerating ? 'animate-pulse bg-violet-900/20' : 'bg-white/5'}`}>
                                        {isVideoGenerating ? <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" /> : <VideoIcon />}
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{isVideoGenerating ? 'Rendering cinematic clip...' : 'No video generated yet.'}</p>
                                    <button 
                                        onClick={() => { playSound(); onGenerateVideo(scene); }}
                                        disabled={isVideoGenerating || isVeoKeySelected === null}
                                        className="btn-glow flex items-center gap-2 mx-auto bg-primary-action-gradient text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg disabled:opacity-50 disabled:grayscale"
                                    >
                                        {isVeoKeySelected === false && <LockIcon />}
                                        {isVideoGenerating ? 'Generating...' : (isVeoKeySelected ? 'Generate with Veo' : 'Unlock & Generate')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* IMAGE TAB CONTENT */}
                    {activeTab === 'image' && (
                        <>
                            {scene.imageUrl ? (
                                <div className="relative w-full h-full group/img">
                                    <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-contain max-h-[400px]" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={scene.imageUrl} download className="btn-glass flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/80">
                                            <DownloadIcon /> Download
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <div className={`mb-4 inline-block p-4 rounded-full ${isImageGenerating ? 'animate-pulse bg-cyan-900/20' : 'bg-white/5'}`}>
                                        {isImageGenerating ? <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" /> : <PlaceholderImageIcon />}
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{isImageGenerating ? 'Creating concept art...' : 'No image generated yet.'}</p>
                                    <button 
                                        onClick={() => { playSound(); onGenerateImage(scene); }}
                                        disabled={isImageGenerating}
                                        className="btn-glass flex items-center gap-2 mx-auto bg-cyan-600/20 text-cyan-200 border-cyan-500/50 hover:bg-cyan-600 hover:text-white px-6 py-2 rounded-full font-bold text-sm"
                                    >
                                        <SparklesIcon /> {isImageGenerating ? 'Painting...' : 'Generate with Imagen'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Controls Area (Right / Bottom) */}
                <div className="lg:col-span-5 p-6 space-y-5 bg-slate-900/20">
                    
                    {/* Description Edit */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Action</label>
                            <CopyButton textToCopy={scene.description} className="scale-75 origin-right" />
                        </div>
                        <textarea
                            value={scene.description}
                            onChange={(e) => onUpdate({ ...scene, description: e.target.value })}
                            className="w-full bg-slate-950/50 p-3 rounded-lg text-sm text-slate-200 border border-white/5 focus:border-violet-500/50 focus:ring-0 transition resize-none h-24 leading-relaxed"
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="grid grid-cols-2 gap-3">
                        <DatalistInput label="Atmosphere" id={`atm-${scene.id}`} value={scene.atmosphere} onChange={(v) => onUpdate({...scene, atmosphere: v})} options={atmosphereOptions} />
                        <DatalistInput label="Transition" id={`trans-${scene.id}`} value={scene.transition} onChange={(v) => onUpdate({...scene, transition: v})} options={transitionOptions} />
                    </div>

                    {/* Prompt Refiner */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {activeTab === 'video' ? 'Video Prompt' : 'Image Prompt'}
                            </label>
                            <button 
                                onClick={() => { playSound(); activeTab === 'video' ? onRegenerateVideoPrompt(scene) : onRegenerateImagePrompt(scene); }}
                                disabled={isPromptRegenerating}
                                className="text-xs text-violet-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <SparklesIcon /> {isPromptRegenerating ? 'Refining...' : 'AI Refine'}
                            </button>
                        </div>
                        <textarea
                            value={activeTab === 'video' ? (scene.videoPrompt || '') : (scene.imagePrompt || '')}
                            onChange={(e) => onUpdate({ ...scene, [activeTab === 'video' ? 'videoPrompt' : 'imagePrompt']: e.target.value })}
                            className="w-full bg-slate-950/30 p-3 rounded-lg text-xs text-slate-400 border border-white/5 focus:border-violet-500/50 focus:text-white transition resize-none h-20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};


type BulkStatus = 'idle' | 'running' | 'error' | 'complete';
type MasterBulkStatus = 'idle' | 'generating_prompts' | 'generating_videos' | 'generating_images' | 'error' | 'complete';
type BulkProgress = { current: number; total: number };
interface MasterBulkState {
    status: MasterBulkStatus;
    progress: BulkProgress;
    error?: string;
}

interface BulkGenerationControlsProps {
    masterState: MasterBulkState;
    onGenerateAll: () => void;
    onCancelAll: () => void;
    onDismissAllError: () => void;
    
    videoGenState: MasterBulkState;
    onGenerateVideosOnly: () => void;
    onCancelVideosOnly: () => void;
    onDismissVideoGenError: () => void;

    promptGenState: { status: BulkStatus; error?: string; };
    onRegeneratePrompts: () => void;
    onDismissPromptGenError: () => void;

    refinePromptsState: { status: BulkStatus; error?: string; };
    onRefineAllPrompts: () => void;
    onDismissRefinePromptsError: () => void;

    refineTitlesState: { status: BulkStatus; error?: string; };
    onRefineTitles: () => void;
    onDismissRefineTitlesError: () => void;

    refineTransitionsState: { status: BulkStatus; error?: string; };
    onRefineAllTransitions: () => void;
    onDismissRefineTransitionsError: () => void;

    previewGenState: { status: BulkStatus; error?: string; };
    onGenerateAllPreviews: () => void;
    onDismissPreviewGenError: () => void;
    
    isVeoKeySelected: boolean | null;
    scenesWithoutPromptsCount: number;
    scenesWithoutVideoCount: number;
    scenesReadyForVideoCount: number;
    scenesWithoutImageCount: number;
}


const BulkGenerationControls: React.FC<BulkGenerationControlsProps> = ({
    masterState, onGenerateAll, onCancelAll, onDismissAllError,
    videoGenState, onGenerateVideosOnly, onCancelVideosOnly, onDismissVideoGenError,
    promptGenState, onRegeneratePrompts, onDismissPromptGenError,
    refinePromptsState, onRefineAllPrompts, onDismissRefinePromptsError,
    refineTitlesState, onRefineTitles, onDismissRefineTitlesError,
    refineTransitionsState, onRefineAllTransitions, onDismissRefineTransitionsError,
    previewGenState, onGenerateAllPreviews, onDismissPreviewGenError,
    isVeoKeySelected, scenesWithoutPromptsCount, scenesWithoutVideoCount, scenesReadyForVideoCount, scenesWithoutImageCount
}) => {
    const playSound = useSound();
    
    const isMasterRunning = masterState.status === 'generating_prompts' || masterState.status === 'generating_videos' || masterState.status === 'generating_images';
    const isVideoGenRunning = videoGenState.status === 'generating_videos';
    const isSecondaryRunning = promptGenState.status === 'running' || refinePromptsState.status === 'running' || previewGenState.status === 'running' || refineTransitionsState.status === 'running' || refineTitlesState.status === 'running';
    const isAnyProcessRunning = isMasterRunning || isVideoGenRunning || isSecondaryRunning;

    const renderMasterUI = () => {
        const missingAssetsCount = Math.max(scenesWithoutPromptsCount, scenesWithoutVideoCount, scenesWithoutImageCount);
        let disabledTooltip = '';
        if (isVeoKeySelected === false) disabledTooltip = 'Please select an API key to enable generation.';
        else if (missingAssetsCount === 0) disabledTooltip = 'All scenes have generated assets.';
        else if (isAnyProcessRunning) disabledTooltip = 'Another generation process is running.';
        const isDisabled = !isVeoKeySelected || missingAssetsCount === 0 || isAnyProcessRunning;

        if (isMasterRunning) {
            const isGeneratingPrompts = masterState.status === 'generating_prompts';
            const isGeneratingVideos = masterState.status === 'generating_videos';
            const isGeneratingImages = masterState.status === 'generating_images';
            
            let title = '';
            if (isGeneratingPrompts) title = 'Phase 1: Generating Prompts';
            else if (isGeneratingVideos) title = 'Phase 2: Generating Videos';
            else if (isGeneratingImages) title = 'Phase 3: Generating Image Previews';
            
            const description = `Processing scene ${masterState.progress.current} of ${masterState.progress.total}...`;
            const progressPercentage = masterState.progress.total > 0 ? (masterState.progress.current / masterState.progress.total) * 100 : 0;
            return (
                <div className="w-full h-full p-4 bg-indigo-500/20 rounded-2xl border border-violet-500/30 animate-fade-in text-center flex flex-col justify-center">
                    <h4 className="font-bold text-text-primary">{title}</h4>
                    <p className="text-sm text-text-secondary my-2">{description}</p>
                    <div className="w-full bg-black/30 rounded-full h-2.5 my-3 overflow-hidden">
                        <div className="bg-primary-action-gradient h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <button onClick={() => { playSound(); onCancelAll(); }} className="btn-glass bg-white/5 text-text-primary font-semibold py-2 px-4 rounded-full text-sm self-center border border-white/10">Cancel</button>
                </div>
            );
        }

        if (masterState.status === 'error') {
            return (
                 <div className="w-full h-full p-4 bg-red-900/40 rounded-2xl border border-red-500/50 animate-fade-in text-center flex flex-col justify-center">
                    <h4 className="font-bold text-red-200">Generation Paused</h4>
                    <p className="text-sm text-red-300 my-2">{masterState.error}</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => { playSound(); onDismissAllError(); }} className="btn-glass bg-white/5 text-white font-semibold py-1 px-3 rounded-full text-xs">Dismiss</button>
                        <button onClick={() => { playSound(); onGenerateAll(); }} className="btn-glow bg-red-500/20 text-white font-semibold py-1 px-3 rounded-full text-xs border border-red-500/50">Retry</button>
                    </div>
                </div>
            );
        }

        return (
             <div className="w-full h-full p-6 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 rounded-2xl border border-white/10 text-center flex flex-col justify-center items-center gap-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary-action-gradient opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">Master Generate</h3>
                    <p className="text-sm text-text-secondary mb-4 max-w-xs mx-auto">Automatically regenerate prompts and create videos & images for all scenes.</p>
                    <button
                        onClick={() => { playSound(); onGenerateAll(); }}
                        disabled={isDisabled}
                        title={disabledTooltip}
                        className="btn-glow bg-primary-action-gradient text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-violet-500/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <span className="flex items-center gap-2">
                            <SparklesIcon /> Generate All Assets
                        </span>
                    </button>
                    {missingAssetsCount > 0 && <p className="text-xs text-text-secondary mt-2">{missingAssetsCount} assets pending</p>}
                 </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
            <div className="md:col-span-1 min-h-[200px]">
                {renderMasterUI()}
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                 {/* Video Generation Control */}
                 <div className="panel-glass p-4 rounded-xl flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-text-primary text-sm mb-1 flex items-center gap-2"><VideoIcon /> Batch Video</h4>
                        <p className="text-xs text-text-secondary mb-3">Generate videos for {scenesReadyForVideoCount} ready scenes.</p>
                     </div>
                     {videoGenState.status === 'generating_videos' ? (
                         <div className="text-center">
                             <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                             <span className="text-xs text-text-secondary">Processing {videoGenState.progress.current}/{videoGenState.progress.total}</span>
                             <button onClick={onCancelVideosOnly} className="block w-full text-xs text-red-300 hover:text-red-200 mt-2">Cancel</button>
                         </div>
                     ) : (
                         <button
                            onClick={() => { playSound(); onGenerateVideosOnly(); }}
                            disabled={!isVeoKeySelected || scenesReadyForVideoCount === 0 || isAnyProcessRunning}
                            className="btn-glass w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg border border-white/10 disabled:opacity-50"
                         >
                            Generate Videos
                         </button>
                     )}
                 </div>

                 {/* Preview Images Control */}
                  <div className="panel-glass p-4 rounded-xl flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-text-primary text-sm mb-1 flex items-center gap-2"><ImageIcon /> Batch Previews</h4>
                        <p className="text-xs text-text-secondary mb-3">Create preview images for {scenesWithoutImageCount} scenes.</p>
                     </div>
                      {previewGenState.status === 'running' ? (
                         <div className="text-center">
                             <div className="animate-spin h-5 w-5 border-2 border-cyan border-t-transparent rounded-full mx-auto mb-2"></div>
                             <span className="text-xs text-text-secondary">Generating...</span>
                         </div>
                     ) : (
                        <button
                            onClick={() => { playSound(); onGenerateAllPreviews(); }}
                            disabled={scenesWithoutImageCount === 0 || isAnyProcessRunning}
                            className="btn-glass w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg border border-white/10 disabled:opacity-50"
                        >
                            Generate Images
                        </button>
                     )}
                 </div>

                 {/* Refine Prompts */}
                 <div className="panel-glass p-4 rounded-xl flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">Refine Prompts</h4>
                        <p className="text-xs text-text-secondary mb-3">AI-optimize prompts for better results.</p>
                     </div>
                      {refinePromptsState.status === 'running' ? (
                         <div className="text-center">
                             <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                             <span className="text-xs text-text-secondary">Refining...</span>
                         </div>
                     ) : (
                         <button
                            onClick={() => { playSound(); onRefineAllPrompts(); }}
                            disabled={isAnyProcessRunning}
                            className="btn-glass w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg border border-white/10 disabled:opacity-50"
                         >
                            Optimize All Prompts
                         </button>
                     )}
                 </div>

                 {/* Refine Titles */}
                 <div className="panel-glass p-4 rounded-xl flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">Refine Titles</h4>
                        <p className="text-xs text-text-secondary mb-3">Generate evocative titles.</p>
                     </div>
                      {refineTitlesState.status === 'running' ? (
                         <div className="text-center">
                             <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                             <span className="text-xs text-text-secondary">Refining...</span>
                         </div>
                     ) : (
                         <button
                            onClick={() => { playSound(); onRefineTitles(); }}
                            disabled={isAnyProcessRunning}
                            className="btn-glass w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg border border-white/10 disabled:opacity-50"
                         >
                            Refine Titles
                         </button>
                     )}
                 </div>

                 {/* Refine Transitions */}
                 <div className="panel-glass p-4 rounded-xl flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">Smooth Edits</h4>
                        <p className="text-xs text-text-secondary mb-3">AI-rewrite transitions for flow.</p>
                     </div>
                      {refineTransitionsState.status === 'running' ? (
                         <div className="text-center">
                             <div className="animate-spin h-5 w-5 border-2 border-cyan border-t-transparent rounded-full mx-auto mb-2"></div>
                             <span className="text-xs text-text-secondary">Smoothing...</span>
                         </div>
                     ) : (
                        <button
                            onClick={() => { playSound(); onRefineAllTransitions(); }}
                            disabled={isAnyProcessRunning}
                            className="btn-glass w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg border border-white/10 disabled:opacity-50"
                        >
                            Refine Transitions
                        </button>
                     )}
                 </div>
            </div>
        </div>
    );
}

export const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({
  outline, characters, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError
}) => {
    const [localOutline, setLocalOutline] = useState<Scene[]>(outline);
    const outlineRef = useRef<Scene[]>(outline);
    const { status, save } = useAutosave({ onSave });
    const [generatingVideos, setGeneratingVideos] = useState<Set<string>>(new Set());
    const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
    const [regeneratingPrompts, setRegeneratingPrompts] = useState<Set<string>>(new Set());
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('All');

    // Bulk States
    const [masterState, setMasterState] = useState<MasterBulkState>({ status: 'idle', progress: { current: 0, total: 0 } });
    const [videoGenState, setVideoGenState] = useState<MasterBulkState>({ status: 'idle', progress: { current: 0, total: 0 } });
    const [promptGenState, setPromptGenState] = useState<{ status: BulkStatus, error?: string }>({ status: 'idle' });
    const [refinePromptsState, setRefinePromptsState] = useState<{ status: BulkStatus, error?: string }>({ status: 'idle' });
    const [refineTitlesState, setRefineTitlesState] = useState<{ status: BulkStatus, error?: string }>({ status: 'idle' });
    const [refineTransitionsState, setRefineTransitionsState] = useState<{ status: BulkStatus, error?: string }>({ status: 'idle' });
    const [previewGenState, setPreviewGenState] = useState<{ status: BulkStatus, error?: string }>({ status: 'idle' });
    
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        setLocalOutline(outline);
        outlineRef.current = outline;
    }, [outline]);
    
    // Filter Logic
    const uniqueLocations = useMemo(() => {
        const locs = new Set(localOutline.map(s => s.location));
        return ['All', ...Array.from(locs).sort()];
    }, [localOutline]);
    
    const filteredScenes = useMemo(() => {
        return localOutline.filter(scene => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                scene.title.toLowerCase().includes(query) ||
                scene.charactersInScene.toLowerCase().includes(query) ||
                scene.location.toLowerCase().includes(query);
            
            const matchesLocation = locationFilter === 'All' || scene.location === locationFilter;
            
            return matchesSearch && matchesLocation;
        });
    }, [localOutline, searchQuery, locationFilter]);

    const handleSceneUpdate = useCallback((updatedScene: Scene) => {
        setLocalOutline(prev => {
            const newOutline = prev.map(s => s.id === updatedScene.id ? updatedScene : s);
            outlineRef.current = newOutline;
            save(newOutline);
            return newOutline;
        });
    }, [save]);

    const handleGenerateVideo = async (scene: Scene) => {
        if (!isVeoKeySelected) {
            onSelectKey();
            return;
        }
        setGeneratingVideos(prev => new Set(prev).add(scene.id));
        try {
            const videoUrl = await generateVideoForScene(scene);
            const updatedScene = { ...scene, videoUrl };
            handleSceneUpdate(updatedScene);
            onVideoSave(updatedScene);
        } catch (e) {
            console.error("Video generation failed", e);
            const { userMessage, isApiKeyError } = parseVideoGenerationError(e);
            if (isApiKeyError) onInvalidKeyError();
            alert(`Video generation failed: ${userMessage}`);
        } finally {
            setGeneratingVideos(prev => {
                const next = new Set(prev);
                next.delete(scene.id);
                return next;
            });
        }
    };

    const handleGenerateImage = async (scene: Scene) => {
        setGeneratingImages(prev => new Set(prev).add(scene.id));
        try {
            const imageUrl = await generateImageForScene(scene, visualStyle);
            const updatedScene = { ...scene, imageUrl };
            handleSceneUpdate(updatedScene);
        } catch (e) {
             console.error("Image generation failed", e);
        } finally {
            setGeneratingImages(prev => {
                const next = new Set(prev);
                next.delete(scene.id);
                return next;
            });
        }
    }

    const hasAttemptedHeroGeneration = useRef(false);

    // Auto-generate the first scene's image as a hero preview
    useEffect(() => {
        if (!hasAttemptedHeroGeneration.current && localOutline.length > 0) {
            const firstScene = localOutline[0];
            if (firstScene && !firstScene.imageUrl && firstScene.imagePrompt) {
                hasAttemptedHeroGeneration.current = true;
                // Add a small delay to ensure UI renders first
                setTimeout(() => {
                    handleGenerateImage(firstScene);
                }, 1000);
            }
        }
    }, [localOutline]);

    const handleRegenerateVideoPrompt = async (scene: Scene) => {
        setRegeneratingPrompts(prev => new Set(prev).add(scene.id));
        try {
            const videoPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
            const updatedScene = { ...scene, videoPrompt };
            handleSceneUpdate(updatedScene);
        } catch(e) {
            console.error(e);
        } finally {
            setRegeneratingPrompts(prev => {
                const next = new Set(prev);
                next.delete(scene.id);
                return next;
            });
        }
    };
    
    const handleRegenerateImagePrompt = async (scene: Scene) => {
        setRegeneratingPrompts(prev => new Set(prev).add(scene.id));
        try {
            const imagePrompt = await regenerateImagePromptForScene(scene, visualStyle);
            const updatedScene = { ...scene, imagePrompt };
            handleSceneUpdate(updatedScene);
        } catch(e) {
            console.error(e);
        } finally {
            setRegeneratingPrompts(prev => {
                const next = new Set(prev);
                next.delete(scene.id);
                return next;
            });
        }
    };

    // --- Bulk Operations ---

    const cancelAllOperations = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setMasterState(prev => ({ ...prev, status: 'idle' }));
        setVideoGenState(prev => ({ ...prev, status: 'idle' }));
        setPreviewGenState(prev => ({ ...prev, status: 'idle' }));
        setRefinePromptsState(prev => ({ ...prev, status: 'idle' }));
        setRefineTransitionsState(prev => ({ ...prev, status: 'idle' }));
        setRefineTitlesState(prev => ({ ...prev, status: 'idle' }));
    };

    // Counts
    const scenesWithoutPrompts = localOutline.filter(s => !s.videoPrompt || s.videoPrompt.trim() === '');
    const scenesWithoutVideo = localOutline.filter(s => !s.videoUrl);
    const scenesReadyForVideo = localOutline.filter(s => !s.videoUrl && s.videoPrompt && s.videoPrompt.trim() !== '');
    const scenesWithoutImage = localOutline.filter(s => !s.imageUrl);

    const handleGenerateAllPreviews = async () => {
        const scenesToProcess = outlineRef.current.filter(s => !s.imageUrl);
        if (scenesToProcess.length === 0) return;

        setPreviewGenState({ status: 'running' });
        try {
             await processInBatches<Scene, void>(scenesToProcess, async (scene) => {
                 let currentScene = outlineRef.current.find(s => s.id === scene.id) || scene;
                 if (currentScene.imageUrl) return;

                 if (!currentScene.imagePrompt || currentScene.imagePrompt.trim() === '') {
                    try {
                        const imagePrompt = await regenerateImagePromptForScene(currentScene, visualStyle);
                        currentScene = { ...currentScene, imagePrompt };
                        handleSceneUpdate(currentScene);
                    } catch (e) {
                        console.error("Failed to generate prompt for image preview", e);
                    }
                 }
                 await handleGenerateImage(currentScene);
             }, 2, 1000);
             setPreviewGenState({ status: 'complete' });
        } catch (e) {
            setPreviewGenState({ status: 'error', error: 'Batch preview generation failed.' });
        } finally {
            setTimeout(() => setPreviewGenState({ status: 'idle' }), 3000);
        }
    };
    
    const handleRefineAllTransitions = async () => {
        setRefineTransitionsState({ status: 'running' });
        try {
            const transitions = await refineSceneTransitions(localOutline, visualStyle);
            const newOutline = localOutline.map(scene => {
                const t = transitions.find(tr => tr.id === scene.id);
                return t ? { ...scene, transition: t.transition } : scene;
            });
            setLocalOutline(newOutline);
            outlineRef.current = newOutline;
            save(newOutline);
            setRefineTransitionsState({ status: 'complete' });
        } catch (e) {
            setRefineTransitionsState({ status: 'error', error: 'Failed to refine transitions.' });
        } finally {
            setTimeout(() => setRefineTransitionsState({ status: 'idle' }), 3000);
        }
    };
    
    const handleRefineTitles = async () => {
        setRefineTitlesState({ status: 'running' });
        try {
             await processInBatches<Scene, void>(localOutline, async (item) => {
                 const freshScene = outlineRef.current.find(s => s.id === item.id) || item;
                 const title = await regenerateTitleForScene(freshScene);
                 
                 setLocalOutline(prev => {
                    const newOutline = prev.map(s => s.id === item.id ? { ...s, title } : s);
                    outlineRef.current = newOutline;
                    save(newOutline);
                    return newOutline;
                 });
            }, 3, 500);
             setRefineTitlesState({ status: 'complete' });
        } catch (e) {
            setRefineTitlesState({ status: 'error', error: 'Failed to refine titles.' });
        } finally {
            setTimeout(() => setRefineTitlesState({ status: 'idle' }), 3000);
        }
    };
    
    const handleRefineAllPrompts = async () => {
        setRefinePromptsState({ status: 'running' });
        try {
            // Iterate over localOutline IDs but fetch fresh scenes to ensure updates are caught
            await processInBatches<Scene, void>(localOutline, async (item) => {
                 const freshScene = outlineRef.current.find(s => s.id === item.id) || item;
                 
                 // Regenerate BOTH prompts to align with "Optimize All Prompts" button intent
                 // The service has been updated to produce cinematic and evocative video prompts.
                 const [videoPrompt, imagePrompt] = await Promise.all([
                     regenerateVideoPromptForScene(freshScene, visualStyle),
                     regenerateImagePromptForScene(freshScene, visualStyle)
                 ]);
                 
                 setLocalOutline(prev => {
                    const newOutline = prev.map(s => s.id === item.id ? { ...s, videoPrompt, imagePrompt } : s);
                    outlineRef.current = newOutline;
                    save(newOutline);
                    return newOutline;
                 });
            }, 3, 500);
             setRefinePromptsState({ status: 'complete' });
        } catch (e) {
            setRefinePromptsState({ status: 'error', error: 'Failed to refine prompts.' });
        } finally {
            setTimeout(() => setRefinePromptsState({ status: 'idle' }), 3000);
        }
    };

    const handleGenerateVideosOnly = async () => {
        if (!isVeoKeySelected) return;
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        const scenesToProcess = outlineRef.current.filter(s => !s.videoUrl && s.videoPrompt && s.videoPrompt.trim() !== '');
        setVideoGenState({ status: 'generating_videos', progress: { current: 0, total: scenesToProcess.length } });
        
        try {
            for (let i = 0; i < scenesToProcess.length; i++) {
                if (signal.aborted) break;
                let scene = scenesToProcess[i];
                const freshScene = outlineRef.current.find(s => s.id === scene.id);
                if (freshScene) scene = freshScene;
                if (scene.videoUrl) continue;
                
                setVideoGenState(prev => ({ ...prev, progress: { ...prev.progress, current: i + 1 } }));
                setGeneratingVideos(prev => new Set(prev).add(scene.id));
                try {
                    const videoUrl = await generateVideoForScene(scene, signal);
                    const updatedScene = { ...scene, videoUrl };
                    handleSceneUpdate(updatedScene);
                    onVideoSave(updatedScene);
                } catch (e) {
                    if (signal.aborted) break;
                    const { isApiKeyError } = parseVideoGenerationError(e);
                    if (isApiKeyError) {
                        onInvalidKeyError();
                        throw e;
                    }
                } finally {
                    setGeneratingVideos(prev => {
                        const next = new Set(prev);
                        next.delete(scene.id);
                        return next;
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            if (!signal.aborted) setVideoGenState(prev => ({ ...prev, status: 'complete' }));
        } catch (e) {
             if (!signal.aborted) setVideoGenState(prev => ({ ...prev, status: 'error', error: (e instanceof Error ? e.message : 'Batch failed') }));
        } finally {
             abortControllerRef.current = null;
             if (!signal.aborted) setTimeout(() => setVideoGenState(prev => ({ ...prev, status: 'idle' })), 3000);
         }
    };

    const handleGenerateAll = async () => {
         if (!isVeoKeySelected) return;
         abortControllerRef.current = new AbortController();
         const signal = abortControllerRef.current.signal;

         const scenesNeedingVideoPrompts = outlineRef.current.filter(s => !s.videoPrompt || s.videoPrompt.trim() === '');
         const scenesNeedingImagePrompts = outlineRef.current.filter(s => !s.imagePrompt || s.imagePrompt.trim() === '');
         const totalPrompts = scenesNeedingVideoPrompts.length + scenesNeedingImagePrompts.length;
         
         if (totalPrompts > 0) {
             setMasterState({ status: 'generating_prompts', progress: { current: 0, total: totalPrompts } });
             let processed = 0;
             try {
                 for (const scene of scenesNeedingVideoPrompts) {
                     if (signal.aborted) break;
                     processed++;
                     setMasterState(prev => ({ ...prev, progress: { ...prev.progress, current: processed } }));
                     const freshScene = outlineRef.current.find(s => s.id === scene.id) || scene;
                     const videoPrompt = await regenerateVideoPromptForScene(freshScene, visualStyle);
                     handleSceneUpdate({ ...freshScene, videoPrompt });
                 }
                 for (const scene of scenesNeedingImagePrompts) {
                     if (signal.aborted) break;
                     processed++;
                     setMasterState(prev => ({ ...prev, progress: { ...prev.progress, current: processed } }));
                     const freshScene = outlineRef.current.find(s => s.id === scene.id) || scene;
                     const imagePrompt = await regenerateImagePromptForScene(freshScene, visualStyle);
                     handleSceneUpdate({ ...freshScene, imagePrompt });
                 }
             } catch (e) {
                 if (!signal.aborted) {
                    setMasterState({ status: 'error', progress: { current: 0, total: 0 }, error: "Failed during prompt generation phase." });
                    return;
                 }
             }
         }
         
         if (signal.aborted) return;
         const scenesForVideo = outlineRef.current.filter(s => !s.videoUrl);
         
         if (scenesForVideo.length > 0) {
             setMasterState({ status: 'generating_videos', progress: { current: 0, total: scenesForVideo.length } });
             try {
                 for (let i = 0; i < scenesForVideo.length; i++) {
                     if (signal.aborted) break;
                     let scene = scenesForVideo[i];
                     const freshScene = outlineRef.current.find(s => s.id === scene.id);
                     if (freshScene) scene = freshScene;
                     if (!scene.videoPrompt) {
                          const videoPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
                          scene = { ...scene, videoPrompt };
                          handleSceneUpdate(scene);
                     }
                     setMasterState(prev => ({ ...prev, progress: { ...prev.progress, current: i + 1 } }));
                     setGeneratingVideos(prev => new Set(prev).add(scene.id));
                     try {
                         const videoUrl = await generateVideoForScene(scene, signal);
                         const updatedScene = { ...scene, videoUrl };
                         handleSceneUpdate(updatedScene);
                         onVideoSave(updatedScene);
                     } catch (e) {
                         if (signal.aborted) break;
                         const { isApiKeyError } = parseVideoGenerationError(e);
                         if (isApiKeyError) {
                             onInvalidKeyError();
                             throw e;
                         }
                     } finally {
                         setGeneratingVideos(prev => {
                            const next = new Set(prev);
                            next.delete(scene.id);
                            return next;
                        });
                     }
                     await new Promise(resolve => setTimeout(resolve, 2000));
                 }
             } catch (e) {
                 if (!signal.aborted) setMasterState(prev => ({ ...prev, status: 'error', error: (e instanceof Error ? e.message : 'Batch failed') }));
                 return;
             }
         }
         
         if (signal.aborted) return;
         const scenesForImages = outlineRef.current.filter(s => !s.imageUrl);
         
         if (scenesForImages.length > 0) {
             setMasterState(prev => ({ ...prev, status: 'generating_images', progress: { current: 0, total: scenesForImages.length } }));
             try {
                 await processInBatches<Scene, void>(scenesForImages, async (scene) => {
                     if (signal.aborted) return;
                     let currentScene = outlineRef.current.find(s => s.id === scene.id) || scene;
                     if (currentScene.imageUrl) return;
                     if (!currentScene.imagePrompt || currentScene.imagePrompt.trim() === '') {
                        try {
                            const imagePrompt = await regenerateImagePromptForScene(currentScene, visualStyle);
                            currentScene = { ...currentScene, imagePrompt };
                            handleSceneUpdate(currentScene);
                        } catch (e) {
                             console.error("Failed to generate prompt for image in master batch", e);
                        }
                     }
                     setMasterState(prev => ({ ...prev, progress: { ...prev.progress, current: prev.progress.current + 1 } }));
                     await handleGenerateImage(currentScene);
                 }, 2, 1000);
             } catch (e) {
                 console.error("Batch image generation failed", e);
             }
         }
         if (!signal.aborted) setMasterState(prev => ({ ...prev, status: 'complete' }));
         abortControllerRef.current = null;
         if (!signal.aborted) setTimeout(() => setMasterState(prev => ({ ...prev, status: 'idle' })), 3000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-stagger" style={{ animationDelay: '200ms' }}>
            
            <div className="flex justify-between items-end mb-4 px-2">
                <div>
                     <h3 className="text-xl font-bold text-white">Scene List</h3>
                     <p className="text-sm text-text-secondary">Review and generate assets for each scene.</p>
                </div>
                <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={status} />
                </div>
            </div>

            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />

            <BulkGenerationControls 
                masterState={masterState}
                onGenerateAll={handleGenerateAll}
                onCancelAll={cancelAllOperations}
                onDismissAllError={() => setMasterState(prev => ({...prev, status: 'idle'}))}
                
                videoGenState={videoGenState}
                onGenerateVideosOnly={handleGenerateVideosOnly}
                onCancelVideosOnly={cancelAllOperations}
                onDismissVideoGenError={() => setVideoGenState(prev => ({...prev, status: 'idle'}))}

                promptGenState={promptGenState}
                onRegeneratePrompts={() => {}}
                onDismissPromptGenError={() => setPromptGenState(prev => ({...prev, status: 'idle'}))}
                
                refinePromptsState={refinePromptsState}
                onRefineAllPrompts={handleRefineAllPrompts}
                onDismissRefinePromptsError={() => setRefinePromptsState(prev => ({...prev, status: 'idle'}))}

                refineTitlesState={refineTitlesState}
                onRefineTitles={handleRefineTitles}
                onDismissRefineTitlesError={() => setRefineTitlesState(prev => ({...prev, status: 'idle'}))}

                refineTransitionsState={refineTransitionsState}
                onRefineAllTransitions={handleRefineAllTransitions}
                onDismissRefineTransitionsError={() => setRefineTransitionsState(prev => ({...prev, status: 'idle'}))}
                
                previewGenState={previewGenState}
                onGenerateAllPreviews={handleGenerateAllPreviews}
                onDismissPreviewGenError={() => setPreviewGenState(prev => ({...prev, status: 'idle'}))}

                isVeoKeySelected={isVeoKeySelected}
                scenesWithoutPromptsCount={scenesWithoutPrompts.length}
                scenesWithoutVideoCount={scenesWithoutVideo.length}
                scenesReadyForVideoCount={scenesReadyForVideo.length}
                scenesWithoutImageCount={scenesWithoutImage.length}
            />

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 pl-10 pr-4 py-3 rounded-xl text-sm border border-white/10 focus:border-violet-500/50 focus:ring-0 text-white placeholder-slate-500 transition-colors shadow-inner"
                        placeholder="Search scenes by title, character, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <FilterIcon />
                    </div>
                    <select
                        className="w-full bg-slate-900/50 pl-10 pr-4 py-3 rounded-xl text-sm border border-white/10 focus:border-violet-500/50 focus:ring-0 text-white appearance-none cursor-pointer shadow-inner"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                    >
                         {uniqueLocations.map(loc => (
                             <option key={loc} value={loc} className="bg-slate-900 text-white">{loc === 'All' ? 'All Locations' : loc}</option>
                         ))}
                    </select>
                </div>
            </div>
            <div className="text-xs text-text-secondary px-2 mb-6">
                Showing {filteredScenes.length} of {localOutline.length} scenes
            </div>

            <div className="space-y-6">
                {filteredScenes.length > 0 ? (
                    filteredScenes.map((scene) => (
                        <CinematicSceneCard
                            key={scene.id}
                            scene={scene}
                            characters={characters}
                            visualStyle={visualStyle}
                            onUpdate={handleSceneUpdate}
                            onGenerateVideo={handleGenerateVideo}
                            onGenerateImage={handleGenerateImage}
                            onRegenerateVideoPrompt={handleRegenerateVideoPrompt}
                            onRegenerateImagePrompt={handleRegenerateImagePrompt}
                            isVideoGenerating={generatingVideos.has(scene.id)}
                            isImageGenerating={generatingImages.has(scene.id)}
                            isPromptRegenerating={regeneratingPrompts.has(scene.id)}
                            isVeoKeySelected={isVeoKeySelected}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p>No scenes found matching your filters.</p>
                        <button onClick={() => { setSearchQuery(''); setLocationFilter('All'); }} className="mt-2 text-violet-400 hover:text-white underline text-sm">Clear filters</button>
                    </div>
                )}
            </div>
        </div>
    );
};
