
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Scene, VisualStyle } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene, generateImageForScene, regenerateImagePromptForScene, generateStyleGuideImages } from '../../services/geminiService';
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
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>;

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
      <div className="bg-cyan/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 text-center animate-fade-in mb-8 flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-text-secondary">Verifying API key status...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-cyan/10 backdrop-blur-xl p-6 rounded-2xl border border-violet/50 text-center animate-fade-in mb-8 shadow-soft">
      <h4 className="text-lg font-bold text-text-primary mb-2">Enable Video Generation</h4>
      <p className="text-text-secondary text-sm max-w-xl mx-auto mb-3">
          To generate cinematic clips with Google's Veo model, a billed API key is required. This ensures access to the necessary computational resources.
      </p>
      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan hover:underline mb-4 block">Learn more about billing</a>
      <button onClick={onSelectKey} className="btn-glow flex items-center justify-center gap-2 mx-auto bg-violet-glow-gradient text-white font-bold py-2 px-5 rounded-full text-sm shadow-glow-violet">
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
      <label htmlFor={id} className="block text-text-secondary font-semibold mb-1 text-sm">{label}</label>
      <input
        id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} list={datalistId}
        className="w-full bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed"
        placeholder={placeholder} disabled={disabled}
      />
      <datalist id={datalistId}>{options.map(option => (<option key={option} value={option} />))}</datalist>
    </div>
  );
};

type BulkStatus = 'idle' | 'running' | 'error' | 'complete';
type MasterBulkStatus = 'idle' | 'generating_prompts' | 'generating_videos' | 'error' | 'complete';
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
    
    promptGenState: { status: BulkStatus; error?: string; };
    onRegeneratePrompts: () => void;
    onDismissPromptGenError: () => void;

    refinePromptsState: { status: BulkStatus; error?: string; };
    onRefineAllPrompts: () => void;
    onDismissRefinePromptsError: () => void;
    
    sceneCount: number;

    isVeoKeySelected: boolean | null;
    scenesWithoutPromptsCount: number;
    scenesWithoutVideoCount: number;
}


const BulkGenerationControls: React.FC<BulkGenerationControlsProps> = ({
    masterState, onGenerateAll, onCancelAll, onDismissAllError,
    promptGenState, onRegeneratePrompts, onDismissPromptGenError,
    refinePromptsState, onRefineAllPrompts, onDismissRefinePromptsError,
    sceneCount,
    isVeoKeySelected, scenesWithoutPromptsCount, scenesWithoutVideoCount
}) => {
    const isAnySecondaryRunning = promptGenState.status === 'running' || refinePromptsState.status === 'running';
    const isMasterRunning = masterState.status === 'generating_prompts' || masterState.status === 'generating_videos';
    const missingAssetsCount = Math.max(scenesWithoutPromptsCount, scenesWithoutVideoCount);
    let masterDisabledTooltip = '';
    if (isVeoKeySelected === false) masterDisabledTooltip = 'Please select an API key to enable generation.';
    else if (missingAssetsCount === 0) masterDisabledTooltip = 'All scenes have generated videos.';
    const isMasterDisabled = !isVeoKeySelected || missingAssetsCount === 0 || isMasterRunning || isAnySecondaryRunning;
    
    const renderMasterUI = () => {
        if (isMasterRunning) {
            const isGeneratingPrompts = masterState.status === 'generating_prompts';
            const title = isGeneratingPrompts ? 'Phase 1: Regenerating Prompts' : 'Phase 2: Generating Videos';
            const description = `Processing scene ${masterState.progress.current} of ${masterState.progress.total}...`;
            const progressPercentage = masterState.progress.total > 0 ? (masterState.progress.current / masterState.progress.total) * 100 : 0;
            return (
                <div className="w-full h-full p-4 bg-azure/20 rounded-2xl border border-violet/30 animate-fade-in text-center flex flex-col justify-center">
                    <h4 className="font-bold text-text-primary">{title}</h4>
                    <p className="text-sm text-text-secondary my-2">{description}</p>
                    <div className="w-full bg-black/30 rounded-full h-2.5 my-3 overflow-hidden">
                        <div className="bg-violet-glow-gradient h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <button onClick={onCancelAll} className="btn-glass bg-white/5 text-text-primary font-semibold py-2 px-4 rounded-full text-sm self-center border border-white/10">Cancel</button>
                </div>
            );
        }

        if (masterState.status === 'error') {
            return (
                 <div className="w-full h-full p-4 bg-red-900/40 rounded-2xl border border-red-500/50 animate-fade-in text-center flex flex-col justify-center">
                    <h4 className="font-bold text-white">Generation Failed</h4>
                    <p className="text-sm text-red-200 my-2 font-mono break-all">{masterState.error}</p>
                    <div className="flex justify-center gap-4 mt-3">
                        <button onClick={onDismissAllError} className="btn-glass bg-white/5 text-text-primary font-semibold py-2 px-4 rounded-full text-sm border border-white/10">Dismiss</button>
                    </div>
                </div>
            );
        }
        
        if (masterState.status === 'complete') {
             return (
                 <div className="w-full h-full p-4 bg-green-900/40 rounded-2xl border border-green-500/50 animate-fade-in text-center flex flex-col justify-center">
                    <h4 className="font-bold text-white">Full Sequence Generation Complete!</h4>
                    <p className="text-sm text-green-200 my-2">All {masterState.progress.total} scenes processed successfully.</p>
                </div>
            );
        }

        return (
            <button 
                onClick={onGenerateAll} 
                disabled={isMasterDisabled}
                title={masterDisabledTooltip}
                className="btn-glow w-full h-full flex flex-col items-center justify-center gap-1 bg-violet-glow-gradient text-white font-bold py-3 px-5 rounded-2xl text-sm shadow-glow-violet disabled:bg-gray-600 disabled:shadow-none disabled:text-gray-300"
            >
                <div className="flex items-center gap-2 text-base">
                    <VideoIcon />
                    <span>Generate Full Film Sequence ({missingAssetsCount})</span>
                </div>
                <span className="text-xs font-semibold text-white/80 italic opacity-80 mt-1">Primary Workflow</span>
            </button>
        );
    };

    const renderPromptGenUI = () => {
        const isRunning = isAnySecondaryRunning || isMasterRunning;
        const disabled = isRunning || scenesWithoutPromptsCount === 0;
        const tooltip = disabled
            ? scenesWithoutPromptsCount === 0
                ? "All scenes that need a video already have a generated prompt."
                : "Another generation process is running."
            : "Use AI to write detailed video prompts for all scenes missing one.";
    
        if (promptGenState.status === 'running') {
            return (
                <div className="w-full h-full text-center p-3 bg-azure/20 rounded-2xl border border-violet/20 animate-pulse flex flex-col justify-center">
                    <p className="font-semibold text-text-primary">Regenerating Prompts...</p>
                    <p className="text-sm text-text-secondary">This should be quick.</p>
                </div>
            );
        }
    
        if (promptGenState.status === 'error') {
            return (
                <div className="w-full h-full p-3 bg-red-900/40 rounded-2xl border border-red-500/50 animate-fade-in text-center flex flex-col justify-center">
                    <h5 className="font-bold text-white text-sm">Prompt Generation Failed</h5>
                    <p className="text-xs text-red-200 my-1 font-mono break-all">{promptGenState.error}</p>
                    <button onClick={onDismissPromptGenError} className="text-xs btn-glass bg-white/5 font-semibold py-1 px-3 rounded-full mt-1 self-center border border-white/10">Dismiss</button>
                </div>
            );
        }
    
        if (promptGenState.status === 'complete') {
            return (
                <div className="w-full h-full text-center p-3 bg-green-900/40 rounded-2xl border border-green-500/50 animate-fade-in flex flex-col justify-center">
                    <h5 className="font-bold text-white text-sm">Prompts Generated!</h5>
                    <p className="text-xs text-green-200">All missing prompts have been created.</p>
                </div>
            );
        }
    
        return (
            <button
                onClick={onRegeneratePrompts}
                disabled={disabled}
                title={tooltip}
                className="btn-glass w-full h-full flex flex-col items-center justify-center gap-1 bg-white/5 text-text-primary font-semibold py-3 px-5 rounded-2xl text-sm disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed border border-white/10"
            >
                <div className="flex items-center gap-2 text-base">
                    <SparklesIcon />
                    <span>Generate Missing Prompts ({scenesWithoutPromptsCount})</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary italic opacity-80 mt-1">Optional First Step</span>
            </button>
        );
    };

    const renderRefinePromptsUI = () => {
        const isRunning = isAnySecondaryRunning || isMasterRunning;
        const disabled = isRunning || sceneCount === 0;
        const tooltip = disabled
            ? sceneCount === 0
                ? "There are no scenes to refine."
                : "Another generation process is running."
            : "Use AI to rewrite and improve all video prompts for better cinematic quality.";
    
        if (refinePromptsState.status === 'running') {
            return (
                <div className="w-full h-full text-center p-3 bg-azure/20 rounded-2xl border border-violet/20 animate-pulse flex flex-col justify-center">
                    <p className="font-semibold text-text-primary">Refining Prompts...</p>
                    <p className="text-sm text-text-secondary">This may take a moment.</p>
                </div>
            );
        }
    
        if (refinePromptsState.status === 'error') {
            return (
                <div className="w-full h-full p-3 bg-red-900/40 rounded-2xl border border-red-500/50 animate-fade-in text-center flex flex-col justify-center">
                    <h5 className="font-bold text-white text-sm">Prompt Refinement Failed</h5>
                    <p className="text-xs text-red-200 my-1 font-mono break-all">{refinePromptsState.error}</p>
                    <button onClick={onDismissRefinePromptsError} className="text-xs btn-glass bg-white/5 font-semibold py-1 px-3 rounded-full mt-1 self-center border border-white/10">Dismiss</button>
                </div>
            );
        }
    
        if (refinePromptsState.status === 'complete') {
            return (
                <div className="w-full h-full text-center p-3 bg-green-900/40 rounded-2xl border border-green-500/50 animate-fade-in flex flex-col justify-center">
                    <h5 className="font-bold text-white text-sm">Prompts Refined!</h5>
                    <p className="text-xs text-green-200">All prompts have been updated.</p>
                </div>
            );
        }
    
        return (
            <button
                onClick={onRefineAllPrompts}
                disabled={disabled}
                title={tooltip}
                className="btn-glass w-full h-full flex flex-col items-center justify-center gap-1 bg-white/5 text-text-primary font-semibold py-3 px-5 rounded-2xl text-sm disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed border border-white/10"
            >
                <div className="flex items-center gap-2 text-base">
                    <SparklesIcon />
                    <span>Refine All Video Prompts ({sceneCount})</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary italic opacity-80 mt-1">Optional Enhancement</span>
            </button>
        );
    };

    return (
        <div className="bg-cyan/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center animate-fade-in mb-8 shadow-soft">
            <h4 className="text-xl font-bold text-text-primary mb-2">Bulk Asset Generation</h4>
            <p className="text-text-secondary text-sm max-w-3xl mx-auto mb-6">
                Generate the final film sequence, or use the optional steps to prepare your prompts first. This process can take several minutes.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderMasterUI()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderPromptGenUI()}
                    {renderRefinePromptsUI()}
                </div>
            </div>
        </div>
    );
};

interface StyleGuideImage {
  url: string;
  prompt: string;
}

const VisualStyleGuide: React.FC<{ visualStyle: VisualStyle }> = ({ visualStyle }) => {
  const [guideImages, setGuideImages] = useState<StyleGuideImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchGuideImages = async () => {
      setIsLoading(true);
      setError(null);
      setGuideImages([]);

      try {
        const images = await generateStyleGuideImages(visualStyle); 
        setGuideImages(images);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load style guide.";
        setError(errorMessage);
        console.error("Error generating style guide images:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideImages();
  }, [visualStyle]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-black/20 rounded-2xl animate-pulse">
                <div className="aspect-video bg-white/5 rounded-t-2xl"></div>
                <div className="p-4 space-y-2"><div className="h-3 bg-white/5 rounded w-5/6"></div><div className="h-3 bg-white/5 rounded w-3/4"></div></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/30 border border-red-600/50 p-4 rounded-xl text-center">
          <h5 className="font-semibold text-white">Could not load style guide</h5>
          <p className="text-sm text-red-200 mt-1">{error}</p>
        </div>
      );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guideImages.map(({ url, prompt }, i) => (
                <div key={i} className="bg-black/20 rounded-2xl overflow-hidden border border-white/10">
                    <img src={url} alt={prompt} className="w-full h-auto object-cover aspect-video" />
                    <p className="text-xs text-text-secondary p-4 italic">"{prompt}"</p>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="bg-cyan/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center animate-fade-in mb-8 shadow-soft">
        <h4 className="text-xl font-bold text-text-primary mb-1">Visual Style Guide: <span className="capitalize text-violet">{visualStyle}</span></h4>
        <p className="text-text-secondary text-sm max-w-2xl mx-auto mb-6">Reference images to illustrate the selected visual aesthetic.</p>
        {renderContent()}
    </div>
  );
};


export const VisualOutlineSection: React.FC<VisualOutlineSectionProps> = ({ 
  outline, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError 
}) => {
    const [editedOutline, setEditedOutline] = useState<Scene[]>(outline);
    const { status, save } = useAutosave({ onSave });
    const [searchTerm, setSearchTerm] = useState('');
    
    const [masterBulkState, setMasterBulkState] = useState<MasterBulkState>({ status: 'idle', progress: { current: 0, total: 0 } });
    const masterAbortController = useRef<AbortController | null>(null);

    const [promptGenState, setPromptGenState] = useState<{status: BulkStatus, error?: string}>({status: 'idle'});
    const [refinePromptsState, setRefinePromptsState] = useState<{status: BulkStatus, error?: string}>({status: 'idle'});
     
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
        if (dragItem.current !== index) e.currentTarget.classList.add('bg-violet/10');
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => e.currentTarget.classList.remove('bg-violet/10');
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-violet/10');
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const reorderedOutline = [...editedOutline];
            const draggedItemContent = reorderedOutline.splice(dragItem.current, 1)[0];
            reorderedOutline.splice(dragOverItem.current, 0, draggedItemContent);
            // Re-calculate scene numbers after any reordering to maintain sequential integrity.
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

    const runBulkVideoGeneration = async (
      signal: AbortSignal, 
      setState: (state: MasterBulkState) => void,
      initialOutline: Scene[]
    ): Promise<void> => {
        let currentOutline = initialOutline;
        let scenesToProcess = currentOutline.filter(scene => !scene.videoUrl);
        const totalScenesToProcess = scenesToProcess.length;
        if (totalScenesToProcess === 0) return Promise.resolve();
    
        setState({ status: 'generating_videos', progress: { current: 0, total: totalScenesToProcess } });
    
        let completedInThisRun = new Set<string>(currentOutline.filter(s => !!s.videoUrl).map(s => s.id));
        let totalGeneratedCount = 0;
        let lastLoopSceneCount = scenesToProcess.length + 1;
    
        while (scenesToProcess.length > 0) {
            if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
    
            if (scenesToProcess.length === lastLoopSceneCount) {
                const remainingSceneNumbers = scenesToProcess.map(s => `#${s.sceneNumber}`).join(', ');
                throw new Error(`Deadlock detected. Check for circular dependencies among scenes: ${remainingSceneNumbers}`);
            }
            lastLoopSceneCount = scenesToProcess.length;
    
            const generatableScenes = scenesToProcess.filter(scene =>
                (scene.dependsOn ?? []).every(depId => completedInThisRun.has(depId))
            );
    
            for (const scene of generatableScenes) {
                if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                
                totalGeneratedCount++;
                setState({ status: 'generating_videos', progress: { current: totalGeneratedCount, total: totalScenesToProcess } });
    
                try {
                    let currentSceneState = currentOutline.find(s => s.id === scene.id)!;
                    const downloadLink = await generateVideoForScene(currentSceneState, signal);
                    const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
                    const updatedScene = { ...currentSceneState, videoUrl: finalUrl };
                    
                    onVideoSave(updatedScene); // Propagate single update up
                    
                    // Update local state for this loop
                    currentOutline = currentOutline.map(s => s.id === updatedScene.id ? updatedScene : s);
                    setEditedOutline(currentOutline); // Update UI state
                    completedInThisRun.add(scene.id);
    
                } catch (error) {
                    if (error instanceof DOMException && error.name === 'AbortError') {
                      throw error;
                    }
                    const { userMessage, isApiKeyError } = parseVideoGenerationError(error);
                    if (isApiKeyError) onInvalidKeyError();
                    throw new Error(`Failed on Scene ${scene.sceneNumber}: ${userMessage}`);
                }
            }
            scenesToProcess = scenesToProcess.filter(scene => !completedInThisRun.has(scene.id));
        }
    };

    const handleGenerateAll = async () => {
        masterAbortController.current = new AbortController();
        const signal = masterAbortController.current.signal;

        // Phase 1: Generate missing prompts
        const scenesMissingPrompts = editedOutline.filter(s => !s.videoUrl && (!s.videoPrompt || s.videoPrompt.trim() === ''));
        if (scenesMissingPrompts.length > 0) {
            setMasterBulkState({ status: 'generating_prompts', progress: { current: 0, total: scenesMissingPrompts.length } });
            const successfulUpdates: Scene[] = [];
            try {
                for (let i = 0; i < scenesMissingPrompts.length; i++) {
                    if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
                    const scene = scenesMissingPrompts[i];
                    setMasterBulkState(p => ({ ...p, progress: { ...p.progress, current: i + 1 } }));
                    const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
                    successfulUpdates.push({ ...scene, videoPrompt: newPrompt });
                }
                // Apply all successful prompt updates at once
                const updatedOutlineForVideoGen = editedOutline.map(originalScene => successfulUpdates.find(u => u.id === originalScene.id) || originalScene);
                setEditedOutline(updatedOutlineForVideoGen);
                save(updatedOutlineForVideoGen);

                // Phase 2: Generate videos
                await runBulkVideoGeneration(signal, setMasterBulkState, updatedOutlineForVideoGen);

            } catch (error) {
                 if (error instanceof DOMException && error.name === 'AbortError') {
                    setMasterBulkState({ status: 'idle', progress: { current: 0, total: 0 } });
                } else {
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    setMasterBulkState({ status: 'error', progress: masterBulkState.progress, error: errorMessage });
                }
                return; // Stop on error
            }
        } else {
            // No prompts to generate, go straight to video
            try {
                 await runBulkVideoGeneration(signal, setMasterBulkState, editedOutline);
            } catch (error) {
                 if (error instanceof DOMException && error.name === 'AbortError') {
                    setMasterBulkState({ status: 'idle', progress: { current: 0, total: 0 } });
                } else {
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    setMasterBulkState({ status: 'error', progress: masterBulkState.progress, error: errorMessage });
                }
                return; // Stop on error
            }
        }

        if (!signal.aborted) {
            setMasterBulkState(p => ({ ...p, status: 'complete', progress: { current: p.progress.total, total: p.progress.total } }));
            setTimeout(() => setMasterBulkState({ status: 'idle', progress: { current: 0, total: 0 } }), 5000);
        }
    };
    
    const handleBulkRegeneratePrompts = async () => {
        setPromptGenState({ status: 'running' });
    
        const scenesToUpdate = editedOutline.filter(s => !s.videoUrl && (!s.videoPrompt || s.videoPrompt.trim() === ''));
        if (scenesToUpdate.length === 0) {
            setPromptGenState({ status: 'complete' });
            setTimeout(() => setPromptGenState({ status: 'idle' }), 3000);
            return;
        }
    
        try {
            const promises = scenesToUpdate.map(scene => 
                regenerateVideoPromptForScene(scene, visualStyle).then(newPrompt => ({
                    id: scene.id, videoPrompt: newPrompt,
                }))
            );
            const results = await Promise.all(promises);
            const updatesMap = new Map(results.map(r => [r.id, r.videoPrompt]));
            const newOutline = editedOutline.map(scene => 
                updatesMap.has(scene.id) ? { ...scene, videoPrompt: updatesMap.get(scene.id)! } : scene
            );
    
            setEditedOutline(newOutline);
            save(newOutline);
    
            setPromptGenState({ status: 'complete' });
            setTimeout(() => setPromptGenState({ status: 'idle' }), 3000);
    
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setPromptGenState({ status: 'error', error: errorMessage });
        }
    };
    
    const handleRefineAllPrompts = async () => {
        setRefinePromptsState({ status: 'running' });
    
        try {
            const promises = editedOutline.map(scene => 
                regenerateVideoPromptForScene(scene, visualStyle).then(newPrompt => ({
                    id: scene.id,
                    videoPrompt: newPrompt,
                }))
            );
            const results = await Promise.all(promises);
            const updatesMap = new Map(results.map(r => [r.id, r.videoPrompt]));
            const newOutline = editedOutline.map(scene => 
                updatesMap.has(scene.id) ? { ...scene, videoPrompt: updatesMap.get(scene.id)! } : scene
            );
    
            setEditedOutline(newOutline);
            save(newOutline);
    
            setRefinePromptsState({ status: 'complete' });
            setTimeout(() => setRefinePromptsState({ status: 'idle' }), 3000);
    
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during prompt refinement.";
            setRefinePromptsState({ status: 'error', error: errorMessage });
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
    const scenesWithoutPromptsCount = useMemo(() => editedOutline.filter(s => !s.videoUrl && (!s.videoPrompt || s.videoPrompt.trim() === '')).length, [editedOutline]);
    const scenesWithoutVideoCount = useMemo(() => editedOutline.filter(s => !s.videoUrl).length, [editedOutline]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-end items-center mb-4 px-1"><SaveStatusIndicator status={status} /></div>
            <VisualStyleGuide visualStyle={visualStyle} />
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><SearchIcon /></div>
                <input
                    type="text" placeholder="Search scenes by title, description, or location..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-cyan/10 backdrop-blur-xl border border-white/20 rounded-full py-3 pl-12 pr-12 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-violet"
                />
                {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center" aria-label="Clear search"><ClearIcon /></button>)}
            </div>
            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />
            <BulkGenerationControls
                masterState={masterBulkState}
                onGenerateAll={handleGenerateAll}
                onCancelAll={() => masterAbortController.current?.abort()}
                onDismissAllError={() => setMasterBulkState({ status: 'idle', progress: { current: 0, total: 0 }})}
                
                promptGenState={promptGenState}
                onRegeneratePrompts={handleBulkRegeneratePrompts}
                onDismissPromptGenError={() => setPromptGenState({ status: 'idle' })}
                
                refinePromptsState={refinePromptsState}
                onRefineAllPrompts={handleRefineAllPrompts}
                onDismissRefinePromptsError={() => setRefinePromptsState({ status: 'idle' })}
                
                sceneCount={editedOutline.length}

                isVeoKeySelected={isVeoKeySelected}
                scenesWithoutPromptsCount={scenesWithoutPromptsCount}
                scenesWithoutVideoCount={scenesWithoutVideoCount}
            />
            <div className="space-y-6">
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
                    <div className="text-center py-16 px-6 bg-cyan/10 backdrop-blur-xl rounded-2xl border border-white/20 animate-fade-in">
                        <h4 className="text-xl font-semibold text-text-primary">No Scenes Found</h4>
                        <p className="text-text-secondary mt-2">Your search for "{searchTerm}" did not match any scenes.</p>
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

const videoGenerationMessages = [
    "Preparing the digital film set...",
    "The AI director is calling 'action'...",
    "This can take a few minutes, good things take time.",
    "Rendering cinematic atoms...",
    "Polishing pixels into a masterpiece...",
    "Please wait, generating your scene...",
];

const VideoGenerationControls: React.FC<VideoGenerationControlsProps> = ({ statusInfo, onGenerate, onCancel, isVeoKeySelected, onSelectKey, hasVideo, disabled = false }) => {
    const [progressMessage, setProgressMessage] = useState(videoGenerationMessages[0]);

    useEffect(() => {
        let interval: number;
        if (statusInfo.status === 'loading') {
            interval = window.setInterval(() => {
                setProgressMessage(prev => {
                    const currentIndex = videoGenerationMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % videoGenerationMessages.length;
                    return videoGenerationMessages[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [statusInfo.status]);
    
    if (statusInfo.status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-2 animate-fade-in w-full p-2 bg-black/20 rounded-xl border border-violet/20">
                <p className="text-sm font-semibold text-text-secondary transition-opacity duration-500">{progressMessage}</p>
                <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden relative mt-1">
                    <div className="absolute inset-0 bg-violet-glow-gradient h-full w-1/2 rounded-full animate-progress-indeterminate"></div>
                </div>
                <button onClick={onCancel} className="text-xs btn-glass bg-white/5 text-text-primary font-semibold py-1 px-3 rounded-full mt-2 border border-white/10">
                    Cancel
                </button>
            </div>
        );
    }
    
    if (statusInfo.status === 'error') {
      return (
          <div className="bg-red-900/30 border border-red-600/50 p-3 rounded-xl animate-fade-in w-full text-left">
              <h5 className="font-semibold text-white text-sm mb-2">Generation Error</h5>
              <p className="text-xs font-mono p-2 bg-black/20 rounded text-red-200/80 mb-3 break-words">{statusInfo.error || 'An unknown error occurred.'}</p>
              <div className="flex justify-end gap-2">
                <button onClick={onGenerate} className="flex items-center gap-1.5 text-xs btn-glow bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-full">
                    <RegenerateIcon />
                    Retry
                </button>
              </div>
          </div>
      );
    }

    if (isVeoKeySelected === null) {
        return (
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary h-10 bg-black/20 rounded-xl">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Verifying API Key...</span>
            </div>
        );
    }

    if (isVeoKeySelected === false || disabled) {
        const buttonText = hasVideo ? 'Regenerate Video' : 'Generate Video';
        const Icon = hasVideo ? RegenerateIcon : VideoIcon;
        const title = disabled ? "Prerequisites not met. Generate videos for dependent scenes first." : "Please select an API Key above to enable video generation.";
        return (
            <button disabled title={title} className="btn-glow flex items-center justify-center gap-2 w-full bg-white/10 text-text-secondary/50 font-bold py-2 px-4 rounded-full cursor-not-allowed text-sm">
                <Icon /> {buttonText}
            </button>
        );
    }
    
    const baseClasses = "flex items-center justify-center gap-2 w-full font-bold py-2 px-4 rounded-full text-sm";
    
    if (hasVideo) {
        return (
            <button onClick={onGenerate} className={`${baseClasses} btn-glass bg-white/5 hover:bg-white/10 text-white border border-white/10`}>
                <RegenerateIcon /> Regenerate Video
            </button>
        );
    } else {
        return (
            <button onClick={onGenerate} className={`${baseClasses} btn-glow bg-violet-glow-gradient text-white shadow-glow-violet`}>
                <VideoIcon /> Generate Video
            </button>
        );
    }
};

interface ImageGenerationControlsProps { statusInfo: { status: 'idle' | 'loading' | 'error', error?: string }; onGenerate: () => void; hasImage: boolean; disabled?: boolean; }
const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({ statusInfo, onGenerate, hasImage, disabled = false }) => {
    if (statusInfo.status === 'loading') {
        return (<div className="flex flex-col items-center justify-center gap-2 animate-fade-in w-full text-sm"><p className="text-text-secondary">Generating Preview...</p><div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden relative"><div className="absolute inset-0 bg-cyan-glow-gradient h-full w-1/2 rounded-full animate-progress-indeterminate"></div></div></div>);
    }
    if (statusInfo.status === 'error') {
      return (<div className="bg-red-900/30 border border-red-600/50 p-3 rounded-xl animate-fade-in w-full text-left h-full flex flex-col justify-between"><div><h5 className="font-semibold text-white text-sm mb-1">Image Error</h5><p className="text-xs text-red-200/80 mb-2 break-words">{statusInfo.error || 'An unknown error occurred.'}</p></div><div className="flex justify-end"><button onClick={onGenerate} className="text-xs btn-glow bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-full">Retry</button></div></div>);
    }
    const buttonText = hasImage ? 'Regenerate Preview' : 'Generate Preview'; const Icon = hasImage ? RegenerateIcon : ImageIcon;
    return (<button onClick={onGenerate} disabled={disabled} title={disabled ? "Prerequisites not met." : ""} className="btn-glow flex items-center justify-center gap-2 w-full bg-cyan-glow-gradient text-azure font-bold py-2 px-4 rounded-full text-sm disabled:bg-white/10 disabled:text-text-secondary/50 disabled:cursor-not-allowed"><Icon /> {buttonText}</button>);
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
                <button onClick={() => setIsOpen(!isOpen)} disabled={disabled} className="w-full text-left bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition flex justify-between items-center disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed">
                    <span className="text-sm font-semibold text-text-secondary">Manage Prerequisites</span><svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isOpen && (<div className="absolute z-20 top-full mt-1 w-full bg-[#1A2D42] border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">{availableScenes.map(scene => (<label key={scene.id} className="flex items-center gap-3 p-2 hover:bg-violet/10 cursor-pointer"><input type="checkbox" checked={dependencies.includes(scene.id)} onChange={() => handleToggleDependency(scene.id)} className="h-4 w-4 rounded bg-azure/20 border-cyan/50 text-violet focus:ring-violet" /><span className="text-sm text-text-primary/90"><span className="font-mono text-text-secondary/70 mr-2">{String(scene.sceneNumber).padStart(2, '0')}</span>{scene.title}</span></label>))}</div>)}
            </div>
             {dependencyScenes.length > 0 && (<div className="flex flex-wrap gap-2 pt-1">{dependencyScenes.map(depScene => (<div key={depScene.id} className="flex items-center gap-1 bg-azure/30 text-xs text-cyan font-semibold px-2 py-1 rounded-full"><span>#{depScene.sceneNumber}</span>{!disabled && (<button onClick={() => handleToggleDependency(depScene.id)} className="text-text-secondary hover:text-white" aria-label={`Remove dependency on scene ${depScene.sceneNumber}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}</div>))}</div>)}
        </div>
    );
};

interface VideoSettingsControlsProps {
  scene: Scene;
  onFieldChange: (field: keyof Scene, value: any) => void;
  disabled: boolean;
}

const VideoSettingSelect: React.FC<{
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean; children: React.ReactNode;
}> = ({ label, id, value, onChange, disabled, children }) => (
  <div>
    <label htmlFor={id} className="block text-text-secondary font-semibold mb-1 text-sm">{label}</label>
    <select id={id} value={value} onChange={onChange} disabled={disabled}
      className="w-full bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </div>
);

const VideoSettingsControls: React.FC<VideoSettingsControlsProps> = ({ scene, onFieldChange, disabled }) => {
  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-3">
        <h5 className="text-base font-bold text-text-primary mb-2">Video Generation Settings</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <VideoSettingSelect label="Model" id={`model-${scene.id}`} value={scene.videoModel || 'veo-3.1-fast-generate-preview'} onChange={(e) => onFieldChange('videoModel', e.target.value)} disabled={disabled}>
                <option value="veo-3.1-fast-generate-preview">Veo Fast</option>
                <option value="veo-3.1-generate-preview">Veo HD</option>
            </VideoSettingSelect>
            <VideoSettingSelect label="Resolution" id={`resolution-${scene.id}`} value={scene.resolution || '720p'} onChange={(e) => onFieldChange('resolution', e.target.value)} disabled={disabled}>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
            </VideoSettingSelect>
            <VideoSettingSelect label="Aspect Ratio" id={`aspect-${scene.id}`} value={scene.aspectRatio || '16:9'} onChange={(e) => onFieldChange('aspectRatio', e.target.value)} disabled={disabled}>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
            </VideoSettingSelect>
        </div>
    </div>
  );
};


const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, onFieldChange, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError, allScenes, completedSceneIds
}) => {
    const [videoGenerationStatus, setVideoGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const [imageGenerationStatus, setImageGenerationStatus] = useState<{ status: 'idle' | 'loading' | 'error', error?: string }>({ status: 'idle' });
    const generationController = useRef<AbortController | null>(null);
    const [isRegeneratingVideoPrompt, setIsRegeneratingVideoPrompt] = useState(false);
    const [videoPromptError, setVideoPromptError] = useState<string | null>(null);
    const [isRegeneratingImagePrompt, setIsRegeneratingImagePrompt] = useState(false);
    const [imagePromptError, setImagePromptError] = useState<string | null>(null);
    const [isDurationValid, setIsDurationValid] = useState(true);

    const unmetDependencies = useMemo(() => (scene.dependsOn ?? []).filter(depId => !completedSceneIds.has(depId)).map(depId => allScenes.find(s => s.id === depId)).filter((s): s is Scene => !!s), [scene.dependsOn, allScenes, completedSceneIds]);
    const isLocked = unmetDependencies.length > 0;

    const validateDuration = (value: string) => /^\d+\s*s$/i.test(value.trim());
    useEffect(() => { setIsDurationValid(validateDuration(scene.duration)); }, [scene.duration]);

    const handleGenerateVideo = async () => {
        if (isLocked) return;
        generationController.current = new AbortController();
        setVideoGenerationStatus({ status: 'loading' });
        try {
            const downloadLink = await generateVideoForScene(scene, generationController.current.signal);
            const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            onVideoSave({ ...scene, videoUrl: finalUrl });
            setVideoGenerationStatus({ status: 'idle' });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setVideoGenerationStatus({ status: 'idle' });
                return;
            }
            const { userMessage, isApiKeyError } = parseVideoGenerationError(error);
            setVideoGenerationStatus({ status: 'error', error: userMessage });
            if (isApiKeyError) {
                onInvalidKeyError();
            }
        }
    };
    const handleGenerateImage = async () => {
        if (isLocked) return; setImageGenerationStatus({ status: 'loading' });
        try { const imageUrl = await generateImageForScene(scene, visualStyle); onVideoSave({ ...scene, imageUrl }); setImageGenerationStatus({ status: 'idle' });
        } catch (error) { const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."; setImageGenerationStatus({ status: 'error', error: errorMessage.split('Reason: ')[1] || errorMessage });}
    };
    const handleRegenerateVideoPrompt = async () => {
        if (isLocked) return; setIsRegeneratingVideoPrompt(true); setVideoPromptError(null);
        try { const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle); onFieldChange('videoPrompt', newPrompt);
        } catch (error) { console.error("Failed to regenerate prompt:", error); const errorMessage = error instanceof Error ? error.message : "Failed to regenerate prompt."; setVideoPromptError(errorMessage); setTimeout(() => setVideoPromptError(null), 5000);
        } finally { setIsRegeneratingVideoPrompt(false); }
    };
     const handleRegenerateImagePrompt = async () => {
        if (isLocked) return;
        setIsRegeneratingImagePrompt(true);
        setImagePromptError(null);
        try {
            const newPrompt = await regenerateImagePromptForScene(scene, visualStyle);
            onFieldChange('imagePrompt', newPrompt);
        } catch (error) {
            console.error("Failed to regenerate image prompt:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to regenerate prompt.";
            setImagePromptError(errorMessage);
            setTimeout(() => setImagePromptError(null), 5000);
        } finally {
            setIsRegeneratingImagePrompt(false);
        }
    };
    const handleCancelGeneration = () => { generationController.current?.abort(); };

    const EditableField: React.FC<{ label: string; id: string; value: string; field: keyof Scene; isTextarea?: boolean; placeholder?: string; rows?: number; }> = ({ label, id, value, field, isTextarea, placeholder, rows = 4 }) => {
        const commonClasses = "w-full bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition disabled:bg-white/5 disabled:text-text-secondary/50 disabled:cursor-not-allowed";
        return (<div><label htmlFor={id} className="block text-text-secondary font-semibold mb-1 text-sm">{label}</label>{isTextarea ? (<textarea id={id} value={value} onChange={(e) => onFieldChange(field, e.target.value)} rows={rows} className={`${commonClasses} resize-y`} placeholder={placeholder} disabled={isLocked} />) : (<input id={id} type="text" value={value} onChange={(e) => onFieldChange(field, e.target.value)} className={commonClasses} placeholder={placeholder} disabled={isLocked} />)}</div>);
    };

    return (
        <div className="relative bg-cyan/10 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 border border-white/20 shadow-soft">
            {isLocked && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl text-center p-4">
                    <LockIcon /><p className="mt-2 font-bold text-text-primary">Scene Locked</p>
                    <p className="text-sm text-text-secondary">Waiting for prerequisite scene{unmetDependencies.length > 1 ? 's' : ''}:<span className="font-semibold text-violet ml-1">{unmetDependencies.map(d => `#${d.sceneNumber}`).join(', ')}</span></p>
                </div>
            )}
            <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-mono font-bold text-cyan/60 select-none">{String(scene.sceneNumber).padStart(2, '0')}</span>
                <input type="text" value={scene.title} onChange={(e) => onFieldChange('title', e.target.value)} aria-label="Scene Title" className="text-2xl font-bold text-text-primary bg-transparent focus:bg-white/5 focus:ring-1 focus:ring-violet rounded-lg p-1 -m-1 w-full disabled:text-text-secondary/50" disabled={isLocked} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black/30 rounded-xl flex items-center justify-center relative border border-white/10 overflow-hidden">
                        {scene.videoUrl && (
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-green-900/80 text-white text-xs font-bold py-1 px-2 rounded-full backdrop-blur-sm border border-green-500/50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span>Generated</span>
                            </div>
                        )}
                        {videoGenerationStatus.status === 'loading' ? (<div className="p-4 text-center text-sm text-text-secondary">Generating video...</div>) : scene.videoUrl ? (<video key={scene.videoUrl} src={scene.videoUrl} controls className="w-full h-full object-cover"></video>) : imageGenerationStatus.status === 'loading' ? (<div className="p-4 text-center text-sm text-text-secondary">Generating image...</div>) : scene.imageUrl ? (<img src={scene.imageUrl} alt={`Preview for ${scene.title}`} className="w-full h-full object-cover" />) : (<div className="text-center text-text-secondary p-4"><PlaceholderImageIcon /><p className="mt-2 text-sm font-semibold">No Preview</p></div>)}
                    </div>
                    <VideoSettingsControls scene={scene} onFieldChange={onFieldChange} disabled={isLocked} />
                    <ImageGenerationControls statusInfo={imageGenerationStatus} onGenerate={handleGenerateImage} hasImage={!!scene.imageUrl} disabled={isLocked} />
                    <VideoGenerationControls 
                        statusInfo={videoGenerationStatus} 
                        onGenerate={handleGenerateVideo} 
                        onCancel={handleCancelGeneration} 
                        isVeoKeySelected={isVeoKeySelected} 
                        onSelectKey={onSelectKey} 
                        hasVideo={!!scene.videoUrl} 
                        disabled={isLocked}
                    />
                     {scene.videoUrl && (<a href={scene.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-glass flex items-center justify-center gap-2 bg-white/5 text-text-primary font-semibold py-2 px-4 rounded-full text-sm w-full border border-white/10"><DownloadIcon /><span>Download Video</span></a>)}
                </div>
                <div className="lg:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditableField label="Location" id={`loc-${scene.id}`} value={scene.location} field="location" />
                        <EditableField label="Time of Day" id={`time-${scene.id}`} value={scene.timeOfDay} field="timeOfDay" />
                        <DatalistInput label="Atmosphere" id={`atmos-${scene.id}`} value={scene.atmosphere} onChange={(value) => onFieldChange('atmosphere', value)} options={atmosphereOptions} placeholder="e.g., Serene, Stormy..." disabled={isLocked} />
                        <div>
                            <label htmlFor={`duration-${scene.id}`} className="block text-text-secondary font-semibold mb-1 text-sm">Duration</label>
                            <div className="relative pb-4">
                                <input id={`duration-${scene.id}`} type="text" value={scene.duration} onChange={(e) => onFieldChange('duration', e.target.value)} className={`w-full bg-white/5 p-2 rounded-lg text-text-primary border transition disabled:bg-white/5 disabled:text-text-secondary/50 ${isDurationValid ? 'border-transparent hover:border-white/20 focus:border-violet' : 'border-red-500/70 focus:border-red-500'}`} placeholder="e.g., 10s" disabled={isLocked} />
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
                        <label htmlFor={`img-prompt-${scene.id}`} className="block text-text-secondary font-semibold mb-1 text-sm">Image Generation Prompt</label>
                        <div className="relative group">
                            <textarea
                                id={`img-prompt-${scene.id}`} value={scene.imagePrompt || ''} onChange={(e) => onFieldChange('imagePrompt', e.target.value)}
                                className="w-full bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition h-28 pr-28 resize-y disabled:bg-white/5 disabled:text-text-secondary/50"
                                placeholder="A detailed, cinematic prompt for a still image..." disabled={isLocked}
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <button
                                    onClick={handleRegenerateImagePrompt} disabled={isRegeneratingImagePrompt || isLocked} title="Refine image prompt with AI"
                                    className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all focus:outline-none focus:ring-2 focus:ring-violet disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isRegeneratingImagePrompt 
                                        ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                        : <SparklesIcon />}
                                </button>
                                <CopyButton textToCopy={scene.imagePrompt || ''}/>
                            </div>
                        </div>
                        {imagePromptError && (<p className="text-xs text-red-400 mt-1 animate-fade-in">{imagePromptError}</p>)}
                    </div>
                    <div>
                        <label htmlFor={`prompt-${scene.id}`} className="block text-text-secondary font-semibold mb-1 text-sm">Video Generation Prompt</label>
                        <div className="relative group">
                            <textarea id={`prompt-${scene.id}`} value={scene.videoPrompt || ''} onChange={(e) => onFieldChange('videoPrompt', e.target.value)} className="w-full bg-white/5 p-2 rounded-lg text-text-primary border border-transparent hover:border-white/20 focus:border-violet focus:bg-white/10 transition h-28 pr-28 resize-y disabled:bg-white/5 disabled:text-text-secondary/50" placeholder="A detailed, cinematic prompt..." disabled={isLocked} />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <button onClick={handleRegenerateVideoPrompt} disabled={isRegeneratingVideoPrompt || isLocked} title="Regenerate prompt with AI" className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all focus:outline-none focus:ring-2 focus:ring-violet disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isRegeneratingVideoPrompt ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SparklesIcon />}
                                </button>
                                <CopyButton textToCopy={scene.videoPrompt || ''}/>
                            </div>
                        </div>
                        {videoPromptError && (<p className="text-xs text-red-400 mt-1 animate-fade-in">{videoPromptError}</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};
