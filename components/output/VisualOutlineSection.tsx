import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Scene, VisualStyle, Character } from '../../types';
import { generateVideoForScene, regenerateVideoPromptForScene, generateImageForScene, regenerateImagePromptForScene, refineSceneTransitions, processInBatches, regenerateTitleForScene, regenerateDescriptionForScene } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { useSound } from '../hooks/useSound';

// Icons
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CheckmarkIcon = () => <svg className="h-3 w-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const SearchIcon = () => <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const MagicWandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ArrowsExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;

const StaticNoise = () => (
    <div className="absolute inset-0 bg-black flex flex-col justify-center items-center overflow-hidden pointer-events-none">
        {/* CSS-only SVG Noise Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             filter: 'contrast(150%) brightness(100%)',
        }}></div>
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)50%,rgba(0,0,0,0.25)50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        <span className="relative z-10 text-cyan-900 font-mono text-xs tracking-[0.3em] font-bold animate-pulse">NO SIGNAL</span>
    </div>
);

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    if (status === 'dirty') return <span className="text-cyan-400 text-[10px] font-mono uppercase">Saving...</span>;
    if (status === 'saving') return <span className="text-cyan-400 text-[10px] font-mono uppercase flex items-center gap-1"><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sync</span>;
    if (status === 'saved') return <span className="text-slate-500 text-[10px] font-mono uppercase flex items-center gap-1"><CheckmarkIcon />Synced</span>;
    return <div className="h-4"></div>;
};

const ApiKeyManager: React.FC<{ isVeoKeySelected: boolean | null; onSelectKey: () => Promise<void>; }> = ({ isVeoKeySelected, onSelectKey }) => {
  const playSound = useSound();
  if (isVeoKeySelected === true) return null;
  if (isVeoKeySelected === null) return <div className="p-4 text-center font-mono text-xs text-slate-500">Checking studio credentials...</div>;
  
  return (
    <div className="bg-gunmetal border border-cyan-500/30 p-6 text-center mb-8 shadow-[0_0_20px_rgba(6,182,212,0.1)] rounded-sm">
      <h4 className="text-cyan-400 font-display uppercase tracking-widest mb-2 text-sm">Video Generation Locked</h4>
      <button onClick={() => { playSound(); onSelectKey(); }} className="btn-gold px-6 py-2 rounded-sm text-xs uppercase tracking-wider flex items-center gap-2 mx-auto">
          <KeyIcon /> Authenticate Veo Module
      </button>
    </div>
  );
};

// Common Labels
const LABEL_STYLE = "font-mono text-[9px] uppercase tracking-[0.15em] text-cyan-600 font-bold mb-1 block";

const CinematicSceneCard: React.FC<any> = ({
  scene, characters, onUpdate, onGenerateVideo, onGenerateImage, onRegenerateVideoPrompt, onRegenerateImagePrompt,
  isVideoGenerating, isImageGenerating, isVeoKeySelected
}) => {
    const [activeTab, setActiveTab] = useState<'video' | 'image'>(scene.videoUrl ? 'video' : 'image');
    const playSound = useSound();

    const getCharacterChip = (charName: string) => {
        const character = characters.find((c: Character) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase()));
        if (!character) return <span className="text-slate-500 text-[9px] uppercase tracking-wider border border-transparent px-1">{charName}</span>;
        
        return (
            <a 
                href={`#character-card-${character.id}`}
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`character-card-${character.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-cyan-500/20 pr-2 pl-1 py-0.5 rounded-full border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer group"
                title={`View ${character.name}'s Profile`}
            >
                {character.imageUrl ? (
                    <img src={character.imageUrl} alt={character.name} className="w-4 h-4 rounded-full object-cover border border-white/20" />
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:animate-pulse ml-1"></span>
                )}
                <span className="text-[9px] text-slate-300 group-hover:text-cyan-200 uppercase tracking-wide font-bold">{character.name}</span>
            </a>
        );
    };

    const parsedCharacters = scene.charactersInScene ? scene.charactersInScene.split(',').map((c: string) => c.trim()) : [];

    // Cartridge Input Wrapper - Darker, tighter, specific studio feel
    const cartridgeStyle = "bg-black/40 border border-white/5 p-1 rounded-sm relative group-focus-within:border-cyan-500/30 transition-colors";

    return (
        <div className="bg-gunmetal border border-white/10 shadow-lg relative group overflow-hidden rounded-sm transition-all hover:border-cyan-500/20">
            {/* Monitor Header */}
            <div className="bg-black/80 border-b border-white/10 p-3 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-grow">
                    <div className="font-mono text-cyan-400 text-xl font-bold border-r border-white/10 pr-4">
                        {String(scene.sceneNumber).padStart(2, '0')}
                    </div>
                    <div className="flex-grow max-w-xl">
                        {/* Editable Title */}
                        <input
                            type="text"
                            value={scene.title}
                            onChange={(e) => onUpdate({ ...scene, title: e.target.value })}
                            className="bg-transparent border-b border-transparent focus:border-cyan-500 text-white font-display uppercase tracking-wider text-sm w-full outline-none placeholder-slate-700 transition-colors"
                            placeholder="SCENE TITLE"
                        />
                        {/* Editable Metadata */}
                        <div className="font-mono text-[9px] text-slate-500 mt-1 flex items-center gap-2">
                             <input
                                type="text"
                                value={scene.location}
                                onChange={(e) => onUpdate({ ...scene, location: e.target.value })}
                                className="bg-transparent uppercase hover:text-slate-300 focus:text-cyan-400 outline-none w-auto min-w-[60px] max-w-[120px] placeholder-slate-700"
                                placeholder="LOCATION"
                            />
                             <span className="text-cyan-500">///</span>
                             <input
                                type="text"
                                value={scene.timeOfDay}
                                onChange={(e) => onUpdate({ ...scene, timeOfDay: e.target.value })}
                                className="bg-transparent uppercase hover:text-slate-300 focus:text-cyan-400 outline-none w-auto min-w-[40px] max-w-[80px] placeholder-slate-700"
                                placeholder="TIME"
                            />
                             <span className="text-cyan-500">///</span>
                             <input
                                type="text"
                                value={scene.duration || ''}
                                onChange={(e) => onUpdate({ ...scene, duration: e.target.value })}
                                className="bg-transparent uppercase hover:text-slate-300 focus:text-cyan-400 outline-none w-16 placeholder-slate-700"
                                placeholder="0:00"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Hardware Toggle Switch */}
                <div className="flex bg-black p-0.5 rounded-sm border border-white/20 ml-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('video')} 
                        className={`px-4 py-1 text-[10px] font-bold uppercase font-mono transition-all rounded-sm 
                        ${activeTab === 'video' ? 'bg-slate-800 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-600 hover:text-slate-400 opacity-50'}`}
                    >Video</button>
                    <button 
                        onClick={() => setActiveTab('image')} 
                        className={`px-4 py-1 text-[10px] font-bold uppercase font-mono transition-all rounded-sm 
                        ${activeTab === 'image' ? 'bg-slate-800 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-600 hover:text-slate-400 opacity-50'}`}
                    >Image</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                {/* Viewport */}
                <div className="lg:col-span-8 bg-black relative border-r border-white/10 flex items-center justify-center overflow-hidden">
                     {/* CRT Vignette Effect */}
                     <div className="absolute inset-0 z-20 shadow-[inset_0_0_50px_rgba(0,0,0,1)] pointer-events-none"></div>

                     {/* HUD */}
                     <div className="absolute top-4 left-4 text-[8px] font-mono text-cyan-500/50 pointer-events-none z-30 leading-tight">
                         MODE: {activeTab.toUpperCase()}<br/>
                         ASPECT: 16:9<br/>
                         CODEC: H.264
                     </div>

                     {/* Display Area */}
                     <div className="relative z-10 w-full h-full flex items-center justify-center bg-black">
                        {activeTab === 'video' ? (
                             scene.videoUrl ? (
                                <video src={scene.videoUrl} controls className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center w-full h-full relative flex flex-col items-center justify-center">
                                    <StaticNoise />
                                    <div className="relative z-20">
                                        <button 
                                            onClick={() => { playSound(); onGenerateVideo(scene); }}
                                            disabled={isVideoGenerating || isVeoKeySelected === null}
                                            className="btn-gold px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                        >
                                            {isVideoGenerating ? 'Rendering Clip...' : 'Generate Video'}
                                        </button>
                                        {(isVeoKeySelected === false || isVeoKeySelected === null) && (
                                            <div className="text-[10px] text-red-400 mt-2 font-mono bg-black/50 px-2 rounded">
                                                Locked: Auth Required
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            scene.imageUrl ? (
                                <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                                <div className="text-center w-full h-full relative flex flex-col items-center justify-center">
                                    <StaticNoise />
                                    <div className="relative z-20">
                                        <button 
                                            onClick={() => { playSound(); onGenerateImage(scene); }}
                                            disabled={isImageGenerating}
                                            className="btn-tactical px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-wider text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                                        >
                                            {isImageGenerating ? 'Developing...' : 'Generate Preview'}
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                     </div>
                </div>

                {/* Data Panel */}
                <div className="lg:col-span-4 bg-gunmetal p-4 flex flex-col justify-between border-t lg:border-t-0 border-white/10">
                    <div className="flex flex-col gap-1"> {/* Tight gap for 'Studio Grid' feel */}
                         
                         {/* Characters */}
                         <div className="flex flex-wrap gap-2 mb-2 p-1">
                            {parsedCharacters.map((char: string, idx: number) => (
                                <React.Fragment key={idx}>{getCharacterChip(char)}</React.Fragment>
                            ))}
                         </div>

                        {/* Description Cartridge */}
                        <div>
                            <label className={LABEL_STYLE}>Action Description</label>
                            <div className={cartridgeStyle}>
                                <textarea
                                    value={scene.description}
                                    onChange={(e) => onUpdate({ ...scene, description: e.target.value })}
                                    className="w-full bg-transparent text-slate-300 font-mono text-xs focus:outline-none resize-none h-28 p-1"
                                />
                            </div>
                        </div>
                        
                        {/* Prompt Cartridge */}
                         <div className="mt-2">
                            <div className="flex justify-between items-center">
                                <label className={LABEL_STYLE}>Prompt Engineer</label>
                                <button onClick={() => activeTab === 'video' ? onRegenerateVideoPrompt(scene) : onRegenerateImagePrompt(scene)} className="text-[9px] font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                                    <SparklesIcon /> AI Refine
                                </button>
                            </div>
                            <div className={cartridgeStyle}>
                                <textarea
                                    value={activeTab === 'video' ? (scene.videoPrompt || '') : (scene.imagePrompt || '')}
                                    onChange={(e) => onUpdate({ ...scene, [activeTab === 'video' ? 'videoPrompt' : 'imagePrompt']: e.target.value })}
                                    className="w-full bg-transparent text-slate-400 font-mono text-[10px] focus:outline-none resize-none h-24 leading-relaxed p-1"
                                />
                            </div>
                        </div>
                        
                        {/* Transition Cartridge */}
                        <div className="mt-2">
                            <label className={LABEL_STYLE}>Transition</label>
                            <div className={cartridgeStyle}>
                                <input
                                    type="text"
                                    value={scene.transition || ''}
                                    onChange={(e) => onUpdate({ ...scene, transition: e.target.value })}
                                    className="w-full bg-transparent text-slate-300 font-mono text-xs focus:outline-none p-1"
                                    placeholder="Cut to..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VisualOutlineSection: React.FC<{
  outline: Scene[];
  characters: Character[];
  onSave: (newOutline: Scene[]) => void;
  onVideoSave: (scene: Scene) => void;
  visualStyle: VisualStyle;
  isVeoKeySelected: boolean | null;
  onSelectKey: () => Promise<void>;
  onInvalidKeyError: () => void;
}> = ({ outline, characters, onSave, onVideoSave, visualStyle, isVeoKeySelected, onSelectKey, onInvalidKeyError }) => {
    const playSound = useSound();
    const { status, save } = useAutosave({ onSave, onSuccess: () => playSound('success') });
    
    // UI State
    const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
    const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
    const [masterBulkStatus, setMasterBulkStatus] = useState<string | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('ALL');

    // Auto-generate first preview on load
    useEffect(() => {
        if (outline.length > 0 && !outline[0].imageUrl && !generatingImageId) {
             handleGenerateImage(outline[0]);
        }
    }, []);

    const handleSceneUpdate = useCallback((updatedScene: Scene) => {
        const newOutline = outline.map(s => s.id === updatedScene.id ? updatedScene : s);
        onSave(newOutline);
        save(newOutline);
    }, [outline, onSave, save]);

    const handleGenerateVideo = async (scene: Scene) => {
        setGeneratingVideoId(scene.id);
        playSound();
        try {
            const videoUrl = await generateVideoForScene(scene);
            const updatedScene = { ...scene, videoUrl };
            handleSceneUpdate(updatedScene);
            onVideoSave(updatedScene);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('API key') || e.message?.includes('403')) {
                onInvalidKeyError();
            } else {
                alert(`Video generation failed: ${e.message}`);
            }
        } finally {
            setGeneratingVideoId(null);
        }
    };

    const handleGenerateImage = async (scene: Scene) => {
        setGeneratingImageId(scene.id);
        playSound();
        try {
            const imageUrl = await generateImageForScene(scene, visualStyle);
            const updatedScene = { ...scene, imageUrl };
            handleSceneUpdate(updatedScene);
        } catch (e) {
            console.error(e);
            alert("Image generation failed.");
        } finally {
            setGeneratingImageId(null);
        }
    };

    // Bulk Actions using fresh ref to avoid stale state
    const outlineRef = useRef(outline);
    useEffect(() => { outlineRef.current = outline; }, [outline]);

    const handleOptimizeAllPrompts = async () => {
        setMasterBulkStatus('Enhancing Prompts...');
        playSound();
        
        try {
            // 1. Refine Image Prompts
            const withImages = await processInBatches<Scene, Scene>(outlineRef.current, async (s) => {
                try {
                    const imagePrompt = await regenerateImagePromptForScene(s, visualStyle);
                    return { ...s, imagePrompt };
                } catch { return s; }
            }, 3, 100);
            
            // 2. Refine Video Prompts
            const finalOutline = await processInBatches<Scene, Scene>(withImages, async (s) => {
                 try {
                    const videoPrompt = await regenerateVideoPromptForScene(s, visualStyle);
                    return { ...s, videoPrompt };
                } catch { return s; }
            }, 3, 100);

            onSave(finalOutline);
            save(finalOutline);
        } catch (e) {
            console.error(e);
            alert("Bulk refinement failed.");
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleRefineTransitions = async () => {
        setMasterBulkStatus('Analyzing Flow...');
        playSound();
        try {
            const updates = await refineSceneTransitions(outlineRef.current, visualStyle);
            const newOutline = outlineRef.current.map(scene => {
                const update = updates.find(u => u.id === scene.id);
                return update ? { ...scene, transition: update.transition } : scene;
            });
            onSave(newOutline);
            save(newOutline);
        } catch (e) {
            console.error(e);
            alert("Transition refinement failed.");
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleRefineDescriptions = async () => {
        setMasterBulkStatus('Deepening Narrative...');
        playSound();
        try {
            const newOutline = await processInBatches<Scene, Scene>(outlineRef.current, async (s) => {
                try {
                    const description = await regenerateDescriptionForScene(s, visualStyle);
                    return { ...s, description };
                } catch { return s; }
            }, 3, 100);
            onSave(newOutline);
            save(newOutline);
        } catch (e) {
            console.error(e);
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleRefineTitles = async () => {
        setMasterBulkStatus('Refining Titles...');
        playSound();
        try {
             const newOutline = await processInBatches<Scene, Scene>(outlineRef.current, async (s) => {
                try {
                    const title = await regenerateTitleForScene(s);
                    return { ...s, title };
                } catch { return s; }
            }, 4, 50);
            onSave(newOutline);
            save(newOutline);
        } catch (e) {
            console.error(e);
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleFillMissingPrompts = async () => {
        setMasterBulkStatus('Filling Gaps...');
        playSound();
        try {
            const missingPrompts = outlineRef.current.filter(s => !s.imagePrompt || !s.videoPrompt);
            if (missingPrompts.length === 0) return;

            const updatedScenes = await processInBatches<Scene, Scene>(missingPrompts, async (s) => {
                let updated = { ...s };
                if (!updated.imagePrompt) updated.imagePrompt = await regenerateImagePromptForScene(s, visualStyle);
                if (!updated.videoPrompt) updated.videoPrompt = await regenerateVideoPromptForScene(s, visualStyle);
                return updated;
            }, 3, 100);

            const newOutline = outlineRef.current.map(s => {
                const update = updatedScenes.find(u => u.id === s.id);
                return update || s;
            });
            
            onSave(newOutline);
            save(newOutline);
        } catch (e) {
             console.error(e);
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleGenerateAllPreviews = async () => {
        const scenesMissingImages = outlineRef.current.filter(s => !s.imageUrl);
        if (scenesMissingImages.length === 0) {
            alert("All scenes already have preview images.");
            return;
        }
        
        setMasterBulkStatus(`Developing ${scenesMissingImages.length} Previews...`);
        playSound();

        try {
             const results = await processInBatches<Scene, Scene>(scenesMissingImages, async (scene) => {
                 try {
                     const imageUrl = await generateImageForScene(scene, visualStyle);
                     return { ...scene, imageUrl };
                 } catch (e) {
                     console.error(`Failed to generate image for scene ${scene.id}`, e);
                     return scene;
                 }
             }, 3, 500);

             const newOutline = outlineRef.current.map(s => {
                 const updated = results.find(r => r.id === s.id);
                 return updated || s;
             });

             onSave(newOutline);
             save(newOutline);
             playSound('success');
        } catch (e) {
            console.error(e);
            alert("Bulk preview generation failed.");
        } finally {
            setMasterBulkStatus(null);
        }
    };

    const handleRegenerateVideoPrompt = async (scene: Scene) => {
        playSound();
        try {
            const newPrompt = await regenerateVideoPromptForScene(scene, visualStyle);
            handleSceneUpdate({ ...scene, videoPrompt: newPrompt });
        } catch (e) { console.error(e); }
    };
    const handleRegenerateImagePrompt = async (scene: Scene) => {
        playSound();
        try {
            const newPrompt = await regenerateImagePromptForScene(scene, visualStyle);
            handleSceneUpdate({ ...scene, imagePrompt: newPrompt });
        } catch (e) { console.error(e); }
    };

    // Filter Logic
    const uniqueLocations = Array.from(new Set(outline.map(s => s.location))).filter(Boolean);
    const filteredScenes = outline.filter(scene => {
        const matchesSearch = 
            scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scene.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scene.charactersInScene.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = locationFilter === 'ALL' || scene.location === locationFilter;
        return matchesSearch && matchesLocation;
    });

    return (
        <div className="space-y-8 animate-fade-in relative z-10">
            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />

            {/* Studio Toolbar */}
            <div className="bg-gunmetal border-y border-white/10 p-4 sticky top-16 z-30 shadow-2xl backdrop-blur-md bg-opacity-95 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <SearchIcon />
                        <input 
                            type="text" 
                            placeholder="Search Scenes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="absolute inset-0 pl-8 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                            style={{ width: '100%', height: '100%' }}
                        />
                         <div className="pl-8 py-2 pr-4 bg-black/40 border border-white/10 rounded-sm text-xs w-[200px] h-[34px]"></div>
                    </div>
                    
                    <div className="relative">
                        <FilterIcon />
                        <select 
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="absolute inset-0 pl-8 bg-transparent text-xs text-white appearance-none focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">All Locations</option>
                            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                         <div className="pl-8 py-2 pr-8 bg-black/40 border border-white/10 rounded-sm text-xs min-w-[140px] h-[34px] flex items-center">
                             <span className="truncate">{locationFilter === 'ALL' ? 'Location Filter' : locationFilter}</span>
                         </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                    {/* Magic Wand: Fill Gaps */}
                    <button onClick={handleFillMissingPrompts} disabled={!!masterBulkStatus} className="btn-tactical px-3 py-1.5 text-[10px] flex items-center gap-1.5 rounded-sm" title="Auto-Fill Missing Prompts">
                        <MagicWandIcon /> Auto-Fill
                    </button>

                    {/* Refine Content */}
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                    <button onClick={handleRefineTitles} disabled={!!masterBulkStatus} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase px-2">Titles</button>
                    <button onClick={handleRefineDescriptions} disabled={!!masterBulkStatus} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase px-2">Descriptions</button>
                    <button onClick={handleRefineTransitions} disabled={!!masterBulkStatus} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase px-2">Transitions</button>
                    
                    {/* Optimize Prompts */}
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                    <button onClick={handleOptimizeAllPrompts} disabled={!!masterBulkStatus} className="btn-tactical px-3 py-1.5 text-[10px] flex items-center gap-1.5 rounded-sm text-cyan-400 border-cyan-500/30">
                        <SparklesIcon /> Upgrade Prompts
                    </button>

                    {/* Bulk Generate */}
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                     <button onClick={handleGenerateAllPreviews} disabled={!!masterBulkStatus} className="btn-gold px-4 py-1.5 text-[10px] flex items-center gap-1.5 rounded-sm">
                        <ImageIcon /> Render All Images
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center px-4 -mt-4">
                 <div className="text-[10px] font-mono text-slate-500 uppercase">
                     Total Scenes: {outline.length} | Filtered: {filteredScenes.length}
                 </div>
                 <div className="flex items-center gap-4">
                    {masterBulkStatus && (
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase animate-pulse">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            {masterBulkStatus}
                        </div>
                    )}
                    <SaveStatusIndicator status={status} />
                 </div>
            </div>

            {/* Scene Grid */}
            <div className="grid grid-cols-1 gap-12">
                {filteredScenes.map((scene) => (
                    <CinematicSceneCard 
                        key={scene.id} 
                        scene={scene} 
                        characters={characters}
                        onUpdate={handleSceneUpdate}
                        onGenerateVideo={handleGenerateVideo}
                        onGenerateImage={handleGenerateImage}
                        onRegenerateVideoPrompt={handleRegenerateVideoPrompt}
                        onRegenerateImagePrompt={handleRegenerateImagePrompt}
                        isVideoGenerating={generatingVideoId === scene.id}
                        isImageGenerating={generatingImageId === scene.id}
                        isVeoKeySelected={isVeoKeySelected}
                    />
                ))}
            </div>
            
            {filteredScenes.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-sm">
                    <p className="text-slate-500 font-mono text-sm">No scenes found matching parameters.</p>
                </div>
            )}
        </div>
    );
};