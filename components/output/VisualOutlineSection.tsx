
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
    <div className="absolute inset-0 bg-black flex flex-col justify-center items-center overflow-hidden">
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

const CinematicSceneCard: React.FC<any> = ({
  scene, characters, onUpdate, onGenerateVideo, onGenerateImage, onRegenerateVideoPrompt, onRegenerateImagePrompt,
  isVideoGenerating, isImageGenerating, isVeoKeySelected
}) => {
    const [activeTab, setActiveTab] = useState<'video' | 'image'>(scene.videoUrl ? 'video' : 'image');
    const playSound = useSound();

    const getCharacterChip = (charName: string) => {
        const character = characters.find((c: Character) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase()));
        if (!character) return <span className="text-slate-500">{charName}</span>;
        
        return (
            <a 
                href={`#character-card-${character.id}`}
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`character-card-${character.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center gap-1 bg-white/5 hover:bg-cyan-500/20 px-2 py-0.5 rounded-full border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer group"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:animate-pulse"></span>
                <span className="text-slate-300 group-hover:text-cyan-200">{charName}</span>
            </a>
        );
    };

    const parsedCharacters = scene.charactersInScene ? scene.charactersInScene.split(',').map((c: string) => c.trim()) : [];

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
                    <button onClick={() => setActiveTab('video')} className={`px-4 py-1 text-[10px] font-bold uppercase font-mono transition-all rounded-sm ${activeTab === 'video' ? 'bg-slate-200 text-black shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Video</button>
                    <button onClick={() => setActiveTab('image')} className={`px-4 py-1 text-[10px] font-bold uppercase font-mono transition-all rounded-sm ${activeTab === 'image' ? 'bg-slate-200 text-black shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Image</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                {/* Viewport */}
                <div className="lg:col-span-8 bg-black relative border-r border-white/10 flex items-center justify-center overflow-hidden">
                     {/* HUD */}
                     <div className="absolute top-4 left-4 text-[8px] font-mono text-cyan-500/50 pointer-events-none z-20 leading-tight">
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
                <div className="lg:col-span-4 bg-gunmetal p-5 flex flex-col justify-between border-t lg:border-t-0 border-white/10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                             <div className="flex flex-wrap gap-2 mb-4">
                                {parsedCharacters.map((char: string, idx: number) => (
                                    <React.Fragment key={idx}>{getCharacterChip(char)}</React.Fragment>
                                ))}
                             </div>

                            <label className="text-[9px] font-mono text-cyan-500 font-bold uppercase tracking-wider">Action Description</label>
                            <textarea
                                value={scene.description}
                                onChange={(e) => onUpdate({ ...scene, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 text-slate-300 font-mono text-xs p-3 focus:border-cyan-500 outline-none resize-none h-32 rounded-sm"
                            />
                        </div>
                        
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] font-mono text-cyan-500 font-bold uppercase tracking-wider">Prompt Engineer</label>
                                <button onClick={() => activeTab === 'video' ? onRegenerateVideoPrompt(scene) : onRegenerateImagePrompt(scene)} className="text-[9px] font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                                    <SparklesIcon /> AI Refine
                                </button>
                            </div>
                            <textarea
                                value={activeTab === 'video' ? (scene.videoPrompt || '') : (scene.imagePrompt || '')}
                                onChange={(e) => onUpdate({ ...scene, [activeTab === 'video' ? 'videoPrompt' : 'imagePrompt']: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 text-slate-400 font-mono text-[10px] p-3 focus:border-cyan-500 outline-none resize-none h-32 rounded-sm leading-relaxed"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono text-cyan-500 font-bold uppercase tracking-wider">Transition</label>
                            <input
                                type="text"
                                value={scene.transition || ''}
                                onChange={(e) => onUpdate({ ...scene, transition: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 text-slate-300 font-mono text-xs p-2 focus:border-cyan-500 outline-none rounded-sm"
                                placeholder="Cut to..."
                            />
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
            if (e.message.toLowerCase().includes("api key")) onInvalidKeyError();
            alert(`Video Failed: ${e.message}`);
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
            alert("Image Failed.");
        } finally {
            setGeneratingImageId(null);
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

    const handleOptimizeAllPrompts = async () => {
        setMasterBulkStatus('optimizing');
        playSound();
        
        try {
            // Use explicit generic types <Scene, Scene> to prevent inference errors
            const updatedOutline = await processInBatches<Scene, Scene>(outline, async (scene: Scene) => {
                try {
                    const [vidPrompt, imgPrompt] = await Promise.all([
                        regenerateVideoPromptForScene(scene, visualStyle),
                        regenerateImagePromptForScene(scene, visualStyle)
                    ]);
                    return { ...scene, videoPrompt: vidPrompt, imagePrompt: imgPrompt };
                } catch (e) {
                    console.error(`Failed prompt refine for scene ${scene.id}`, e);
                    return scene;
                }
            }, 3, 500);

            onSave(updatedOutline);
            setMasterBulkStatus(null);
            playSound('success');
        } catch (e) {
             console.error("Bulk optimization failed", e);
             setMasterBulkStatus(null);
             alert("Optimization sequence interrupted.");
        }
    };
    
    const handleRefineTransitions = async () => {
        setMasterBulkStatus('refining_transitions');
        playSound();
        
        try {
            const transitions = await refineSceneTransitions(outline, visualStyle);
            const updatedOutline = outline.map(scene => {
                const t = transitions.find(tr => tr.id === scene.id);
                return t ? { ...scene, transition: t.transition } : scene;
            });

            onSave(updatedOutline);
            setMasterBulkStatus(null);
            playSound('success');
        } catch (e) {
            console.error(e);
            setMasterBulkStatus(null);
            alert("Transition refinement interrupted.");
        }
    };

    const handleFillMissingPrompts = async () => {
        setMasterBulkStatus('filling_prompts');
        playSound();

        try {
            const scenesWithMissingPrompts = outline.filter(s => !s.imagePrompt || !s.videoPrompt);
            
            if (scenesWithMissingPrompts.length === 0) {
                 setMasterBulkStatus(null);
                 alert("All prompts are already populated.");
                 return;
            }

            const updatedScenes = await processInBatches<Scene, Scene>(scenesWithMissingPrompts, async (scene: Scene) => {
                const updates: Partial<Scene> = {};
                if (!scene.videoPrompt) {
                     try { updates.videoPrompt = await regenerateVideoPromptForScene(scene, visualStyle); } catch (e) {}
                }
                if (!scene.imagePrompt) {
                     try { updates.imagePrompt = await regenerateImagePromptForScene(scene, visualStyle); } catch (e) {}
                }
                return { ...scene, ...updates };
            }, 3, 500);

            const newOutline = outline.map(s => {
                const updated = updatedScenes.find(us => us.id === s.id);
                return updated ? updated : s;
            });

            onSave(newOutline);
            setMasterBulkStatus(null);
            playSound('success');
        } catch (e) {
            console.error(e);
            setMasterBulkStatus(null);
            alert("Fill operation interrupted.");
        }
    };

    const handleRefineTitles = async () => {
        setMasterBulkStatus('refining_titles');
        playSound();
        
        try {
            const updatedOutline = await processInBatches<Scene, Scene>(outline, async (scene: Scene) => {
                const newTitle = await regenerateTitleForScene(scene);
                return { ...scene, title: newTitle };
            }, 5, 200);

            onSave(updatedOutline);
            setMasterBulkStatus(null);
            playSound('success');
        } catch (e) {
            setMasterBulkStatus(null);
        }
    };

    const handleRefineDescriptions = async () => {
        setMasterBulkStatus('refining_descriptions');
        playSound();
        
        try {
            const updatedOutline = await processInBatches<Scene, Scene>(outline, async (scene: Scene) => {
                const newDesc = await regenerateDescriptionForScene(scene, visualStyle);
                return { ...scene, description: newDesc };
            }, 5, 200);

            onSave(updatedOutline);
            setMasterBulkStatus(null);
            playSound('success');
        } catch (e) {
            console.error(e);
            setMasterBulkStatus(null);
            alert("Description refinement interrupted.");
        }
    };

    const handleGenerateAllPreviews = async () => {
        setMasterBulkStatus('generating_images');
        playSound();
        const missing = outline.filter(s => !s.imageUrl);
        if (missing.length === 0) {
            alert("All previews already exist.");
            setMasterBulkStatus(null);
            return;
        }

        const completedScenes = await processInBatches<Scene, Scene>(missing, async (scene: Scene) => {
            try {
                const imageUrl = await generateImageForScene(scene, visualStyle);
                return { ...scene, imageUrl };
            } catch { return scene; }
        }, 2, 1000);
        
        const newOutline = outline.map(s => completedScenes.find(cs => cs.id === s.id) || s);
        onSave(newOutline);
        setMasterBulkStatus(null);
        playSound('success');
    };

    // Filter Logic
    const locations = Array.from(new Set(outline.map(s => s.location)));
    const filteredScenes = outline.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = locationFilter === 'ALL' || s.location === locationFilter;
        return matchesSearch && matchesLocation;
    });

    const hasRunAutoGenerate = useRef(false);
    useEffect(() => {
        if (!hasRunAutoGenerate.current && outline.length > 0) {
            const firstScene = outline[0];
            if (!firstScene.imageUrl && !generatingImageId) {
                hasRunAutoGenerate.current = true;
                handleGenerateImage(firstScene);
            }
        }
    }, [outline]); 

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-6 gap-6">
                <div>
                    <h2 className="font-display text-3xl font-bold uppercase text-white tracking-widest">
                        Visual <span className="text-cyan-400">Manifest</span>
                    </h2>
                    <p className="text-slate-500 font-mono text-xs mt-1">
                        {outline.length} Scenes | {outline.filter(s => s.videoUrl).length} Videos Rendered
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                     <button 
                        onClick={handleOptimizeAllPrompts} 
                        disabled={!!masterBulkStatus}
                        className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {masterBulkStatus === 'optimizing' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <SparklesIcon />}
                        Refine Prompts
                    </button>
                    <button 
                        onClick={handleFillMissingPrompts} 
                        disabled={!!masterBulkStatus}
                        className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50 text-cyan-400 border-cyan-500/30"
                    >
                        {masterBulkStatus === 'filling_prompts' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <MagicWandIcon />}
                        Fill Missing Prompts
                    </button>
                    <button 
                        onClick={handleRefineTitles} 
                        disabled={!!masterBulkStatus}
                        className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {masterBulkStatus === 'refining_titles' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <TextIcon />}
                        Refine Titles
                    </button>
                    <button 
                        onClick={handleRefineDescriptions} 
                        disabled={!!masterBulkStatus}
                        className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {masterBulkStatus === 'refining_descriptions' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <TextIcon />}
                        Refine Descriptions
                    </button>
                    <button 
                        onClick={handleRefineTransitions} 
                        disabled={!!masterBulkStatus}
                        className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {masterBulkStatus === 'refining_transitions' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <ArrowsExpandIcon />}
                        Refine Transitions
                    </button>
                    <button 
                        onClick={handleGenerateAllPreviews}
                        disabled={!!masterBulkStatus}
                         className="btn-tactical px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 disabled:opacity-50 text-cyan-400 border-cyan-500/30"
                    >
                         {masterBulkStatus === 'generating_images' ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : <ImageIcon />}
                        Generate Previews
                    </button>
                    <SaveStatusIndicator status={status} />
                </div>
            </div>

            <ApiKeyManager isVeoKeySelected={isVeoKeySelected} onSelectKey={onSelectKey} />

            {/* Filter Bar */}
            <div className="bg-gunmetal p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-center shadow-lg rounded-sm">
                <div className="relative flex-grow w-full">
                    <div className="absolute left-3 top-2.5 pointer-events-none"><SearchIcon /></div>
                    <input 
                        type="text" 
                        placeholder="Search scenes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-sm py-2 pl-10 pr-4 text-sm text-white focus:border-cyan-400 outline-none transition-colors"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <select 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-sm py-2 px-4 text-sm text-white focus:border-cyan-400 outline-none appearance-none cursor-pointer"
                    >
                        <option value="ALL">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500"><FilterIcon /></div>
                </div>
            </div>
            
            <div className="space-y-12">
                {filteredScenes.length > 0 ? (
                    filteredScenes.map(scene => (
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
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-500 font-mono border border-dashed border-white/10 rounded-lg">
                        No scenes found. Adjust filters to proceed.
                    </div>
                )}
            </div>
        </div>
    );
};
