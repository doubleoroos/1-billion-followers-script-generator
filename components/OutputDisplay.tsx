import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GeneratedAssets } from '../types';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: string) => void;
  onOutlineSave: (newOutline: string) => void;
  onBtsSave: (newBtsDoc: string) => void;
}

type Tab = 'script' | 'outline' | 'images' | 'bts';
type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';

// Custom hook to manage state history for undo/redo functionality
const useHistory = (initialState: string) => {
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const state = history[pointer];

  const setState = useCallback((newState: string, fromHistory = false) => {
    if (newState === state) {
      return; // No change, do nothing
    }
    if (fromHistory) {
      // This is just a pointer move, not a new state
      const newPointer = history.indexOf(newState);
      if (newPointer !== -1) setPointer(newPointer);
      return;
    }
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
  }, [state, history, pointer]);

  const undo = () => {
    if (pointer > 0) {
      setPointer(pointer - 1);
    }
  };

  const redo = () => {
    if (pointer < history.length - 1) {
      setPointer(pointer + 1);
    }
  };

  // Reset history when the initial state prop changes (e.g., new script generation)
  useEffect(() => {
    setHistory([initialState]);
    setPointer(0);
  }, [initialState]);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo };
};

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    switch (status) {
        case 'dirty':
            return <span className="text-xs text-yellow-400/90 font-medium">Unsaved changes</span>;
        case 'saving':
            return <span className="text-xs text-cyan-400/90 font-medium">Saving...</span>;
        case 'saved':
        case 'clean':
            return <span className="text-xs text-green-400/90 font-medium">All changes saved</span>;
        default:
            return null;
    }
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedAssets, onScriptSave, onOutlineSave, onBtsSave }) => {
  const [activeTab, setActiveTab] = useState<Tab>('script');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const { 
    state: editedScript, 
    setState: setEditedScript, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory(generatedAssets.script);

  const [editedOutline, setEditedOutline] = useState(generatedAssets.visualOutline);
  const [editedBts, setEditedBts] = useState(generatedAssets.btsDocument);
  
  const [scriptSaveStatus, setScriptSaveStatus] = useState<SaveStatus>('clean');
  const [outlineSaveStatus, setOutlineSaveStatus] = useState<SaveStatus>('clean');
  const [btsSaveStatus, setBtsSaveStatus] = useState<SaveStatus>('clean');
  
  // Restore from localStorage on load or when new assets are generated
  useEffect(() => {
    const savedScript = localStorage.getItem('script-autosave');
    if (savedScript && savedScript !== generatedAssets.script) {
        if (window.confirm("Unsaved script changes found from a previous session. Would you like to restore them?")) {
            setEditedScript(savedScript);
            setScriptSaveStatus('dirty');
        } else {
             localStorage.removeItem('script-autosave');
        }
    }
    const savedOutline = localStorage.getItem('outline-autosave');
    if (savedOutline && savedOutline !== generatedAssets.visualOutline) {
        if (window.confirm("Unsaved visual outline changes found from a previous session. Would you like to restore them?")) {
            setEditedOutline(savedOutline);
            setOutlineSaveStatus('dirty');
        } else {
            localStorage.removeItem('outline-autosave');
        }
    }
    const savedBts = localStorage.getItem('bts-autosave');
    if (savedBts && savedBts !== generatedAssets.btsDocument) {
        if (window.confirm("Unsaved BTS document changes found from a previous session. Would you like to restore them?")) {
            setEditedBts(savedBts);
            setBtsSaveStatus('dirty');
        } else {
             localStorage.removeItem('bts-autosave');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedAssets.script, generatedAssets.visualOutline, generatedAssets.btsDocument]);

  // Auto-save script
  useEffect(() => {
    if (scriptSaveStatus !== 'dirty') return;
    const handler = setTimeout(() => {
      setScriptSaveStatus('saving');
      localStorage.setItem('script-autosave', editedScript);
      setTimeout(() => setScriptSaveStatus('saved'), 500);
    }, 2500);
    return () => clearTimeout(handler);
  }, [editedScript, scriptSaveStatus]);
  
  // Auto-save outline
  useEffect(() => {
    if (outlineSaveStatus !== 'dirty') return;
    const handler = setTimeout(() => {
      setOutlineSaveStatus('saving');
      localStorage.setItem('outline-autosave', editedOutline);
      setTimeout(() => setOutlineSaveStatus('saved'), 500);
    }, 2500);
    return () => clearTimeout(handler);
  }, [editedOutline, outlineSaveStatus]);

  // Auto-save BTS
  useEffect(() => {
    if (btsSaveStatus !== 'dirty') return;
    const handler = setTimeout(() => {
      setBtsSaveStatus('saving');
      localStorage.setItem('bts-autosave', editedBts);
      setTimeout(() => setBtsSaveStatus('saved'), 500);
    }, 2500);
    return () => clearTimeout(handler);
  }, [editedBts, btsSaveStatus]);


  const handleScriptChange = (value: string) => {
    setEditedScript(value);
    setScriptSaveStatus('dirty');
  }

  const handleOutlineChange = (value: string) => {
    setEditedOutline(value);
    setOutlineSaveStatus('dirty');
  }

  const handleBtsChange = (value: string) => {
    setEditedBts(value);
    setBtsSaveStatus('dirty');
  }

  // When new assets are generated, reset the editors' states
  useEffect(() => {
    setEditedOutline(generatedAssets.visualOutline);
    setOutlineSaveStatus('clean');
    setEditedBts(generatedAssets.btsDocument);
    setBtsSaveStatus('clean');
    setScriptSaveStatus('clean');
  }, [generatedAssets.visualOutline, generatedAssets.btsDocument]);


  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const outlineContainerRef = useRef<HTMLDivElement>(null);

  const parsedScenes = useMemo(() => {
    if (!editedOutline) return [];
    
    const sceneRegex = /(\*\*Scene Number & Title:\*\*(?:.|\n)*?)(?=\*\*Scene Number & Title:\*\*|$)/g;
    const matches = [...editedOutline.matchAll(sceneRegex)];

    return matches.map((match, index) => {
        const content = match[1].trim();
        const titleLine = content.split('\n')[0];
        const title = titleLine.replace('**Scene Number & Title:**', '').trim();
        const id = `scene-${index}`;
        
        return { id, title, content };
    });
  }, [editedOutline]);

  useEffect(() => {
    if (activeTab !== 'outline' || parsedScenes.length === 0 || !outlineContainerRef.current) return;

    const observer = new IntersectionObserver(
        (entries) => {
            const intersectingEntries = entries.filter(e => e.isIntersecting);
            if (intersectingEntries.length > 0) {
                intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                setActiveSceneId(intersectingEntries[0].target.id);
            }
        },
        { 
            root: outlineContainerRef.current,
            rootMargin: '0px 0px -80% 0px',
            threshold: 0,
        }
    );
    
    const sceneElements = parsedScenes.map(scene => document.getElementById(scene.id)).filter((el): el is HTMLElement => el !== null);
    sceneElements.forEach(el => observer.observe(el));
    
    if (!activeSceneId && sceneElements.length > 0) {
        setActiveSceneId(sceneElements[0].id);
    }
    
    return () => {
        sceneElements.forEach(el => observer.unobserve(el));
        observer.disconnect();
    };
  }, [activeTab, parsedScenes, activeSceneId]);


  const handleCopy = useCallback(() => {
    if (activeTab === 'images') return;
    let contentToCopy;
    switch (activeTab) {
      case 'script':
        contentToCopy = editedScript;
        break;
      case 'outline':
        contentToCopy = editedOutline;
        break;
      case 'bts':
        contentToCopy = editedBts;
        break;
      default:
        contentToCopy = '';
    }

    navigator.clipboard.writeText(contentToCopy).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  }, [activeTab, editedScript, editedOutline, editedBts]);
  
  const handleSaveScript = useCallback(() => {
    onScriptSave(editedScript);
    localStorage.setItem('script-autosave', editedScript);
    setScriptSaveStatus('saving');
    setTimeout(() => setScriptSaveStatus('saved'), 500);
  }, [editedScript, onScriptSave]);
  
  const handleSaveOutline = useCallback(() => {
    onOutlineSave(editedOutline);
    localStorage.setItem('outline-autosave', editedOutline);
    setOutlineSaveStatus('saving');
    setTimeout(() => setOutlineSaveStatus('saved'), 500);
  }, [editedOutline, onOutlineSave]);
  
  const handleSaveBts = useCallback(() => {
    onBtsSave(editedBts);
    localStorage.setItem('bts-autosave', editedBts);
    setBtsSaveStatus('saving');
    setTimeout(() => setBtsSaveStatus('saved'), 500);
  }, [editedBts, onBtsSave]);

  const handleExportMarkdown = useCallback(() => {
    if (!editedOutline) return;
    
    const blob = new Blob([editedOutline], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-outline.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedOutline]);
  
  const handleExportTxt = useCallback(() => {
    if (!editedBts) return;
    const blob = new Blob([editedBts], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'behind-the-scenes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedBts]);

  const handleAddNewScene = useCallback(() => {
    const title = window.prompt("Enter the title for the new scene:");
    if (title && title.trim() !== '') {
      const sceneCount = parsedScenes.length + 1;
      const newSceneTemplate = `
  
**Scene Number & Title:** Scene ${sceneCount}: ${title.trim()}

**Scene Description:** [Describe the scene, key actions, and mood here.]

**Key Visual Elements:**
- [Element 1]
- [Element 2]
- [Element 3]

**Visuals:** [Describe camera angles, lighting, composition.]

**Transition:** [Describe the transition to the next scene.]

**Pacing & Emotion:** [Describe the intended emotion and pacing for this scene.]
`;
      const newOutline = (editedOutline || '').trim() + '\n' + newSceneTemplate.trim();
      handleOutlineChange(newOutline);
    }
  }, [parsedScenes.length, editedOutline]);

  const handleSceneJump = (sceneId: string) => {
    const sceneElement = document.getElementById(sceneId);
    sceneElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab 
          ? 'bg-cyan-600 text-white' 
          : 'text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700 animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <div className="flex space-x-2">
                <TabButton tab="script" label="Narration Script" />
                <TabButton tab="outline" label="Visual Outline" />
                <TabButton tab="images" label="Reference Images" />
                <TabButton tab="bts" label="BTS Document" />
            </div>
            
            <div className="flex items-center gap-2">
                {activeTab === 'script' && (
                  <div className="flex items-center gap-4">
                    <SaveStatusIndicator status={scriptSaveStatus} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo"
                        aria-label="Undo script change"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 016 6v3" />
                        </svg>
                      </button>
                      <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo"
                        aria-label="Redo script change"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
                        </svg>
                      </button>
                      <div className="w-px h-6 bg-slate-600 mx-1"></div>
                      <button
                        onClick={handleSaveScript}
                        disabled={scriptSaveStatus === 'clean' || scriptSaveStatus === 'saving' || scriptSaveStatus === 'saved'}
                        className="px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 bg-cyan-700 text-slate-300 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6.101a2 2 0 011.414.586l4.899 4.899A2 2 0 0120 8.899V18a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm7 1a1 1 0 00-1 1v5a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Save Script
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'outline' && (
                  <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={outlineSaveStatus} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddNewScene}
                        className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2"
                        title="Add a new scene to the outline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Scene
                      </button>
                      <button
                        onClick={handleSaveOutline}
                        disabled={outlineSaveStatus === 'clean' || outlineSaveStatus === 'saving' || outlineSaveStatus === 'saved'}
                         className="px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 bg-cyan-700 text-slate-300 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
                      >
                        Save Outline
                      </button>
                      <div className="w-px h-6 bg-slate-600 mx-1"></div>
                      <button
                        onClick={handleExportMarkdown}
                        className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export .md
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'bts' && (
                  <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={btsSaveStatus} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveBts}
                        disabled={btsSaveStatus === 'clean' || btsSaveStatus === 'saving' || btsSaveStatus === 'saved'}
                         className="px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 bg-cyan-700 text-slate-300 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
                      >
                        Save Document
                      </button>
                      <div className="w-px h-6 bg-slate-600 mx-1"></div>
                      <button
                        onClick={handleExportTxt}
                        className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export .txt
                      </button>
                    </div>
                  </div>
                )}
                {activeTab !== 'images' && (
                  <button
                      onClick={handleCopy}
                      className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2"
                  >
                      {copyStatus === 'copied' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                  </button>
                )}
            </div>
            
        </div>

        <div className="p-6">
            {activeTab === 'script' && (
               <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                 <textarea
                   value={editedScript}
                   onChange={(e) => handleScriptChange(e.target.value)}
                   className="w-full min-h-[65vh] bg-slate-900/70 p-4 rounded-md font-sans text-slate-200 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                   aria-label="Editable script area"
                 />
               </div>
            )}
            {activeTab === 'outline' && (
              <div className="flex gap-6">
                <nav className="w-1/3 md:w-1/4 h-[65vh] overflow-y-auto pr-4 border-r border-slate-600">
                  <h3 className="text-base font-semibold mb-3 text-cyan-400 sticky top-0 bg-slate-800/80 backdrop-blur-sm pb-2 z-10">Scenes</h3>
                  <ul className="space-y-1">
                    {parsedScenes.map(scene => (
                      <li key={scene.id}>
                        <button
                          onClick={() => handleSceneJump(scene.id)}
                          className={`w-full text-left text-xs p-2 rounded-md transition-colors ${
                            activeSceneId === scene.id
                              ? 'bg-cyan-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {scene.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div ref={outlineContainerRef} className="w-2/3 md:w-3/4 h-[65vh] overflow-y-auto prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0">
                    <textarea
                      value={editedOutline}
                      onChange={(e) => handleOutlineChange(e.target.value)}
                      className="w-full min-h-[65vh] bg-slate-900/70 p-4 rounded-md font-sans text-slate-200 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow whitespace-pre-wrap"
                      aria-label="Editable visual outline"
                    />
                </div>
              </div>
            )}
            {activeTab === 'images' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {generatedAssets.referenceImages.map((image) => (
                  <div key={image.title} className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <img 
                      src={image.imageUrl} 
                      alt={image.title} 
                      className="rounded-md w-full aspect-video object-cover" 
                    />
                    <h4 className="text-md font-semibold text-cyan-400 text-center">{image.title}</h4>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'bts' && (
               <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                 <textarea
                   value={editedBts}
                   onChange={(e) => handleBtsChange(e.target.value)}
                   className="w-full min-h-[65vh] bg-slate-900/70 p-4 rounded-md font-sans text-slate-200 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                   aria-label="Editable Behind-the-Scenes document"
                   placeholder="Your Behind-the-Scenes document will appear here..."
                 />
               </div>
            )}
        </div>
    </div>
  );
};