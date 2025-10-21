import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GeneratedAssets } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: string) => void;
  onOutlineSave: (newOutline: string) => void;
  onBtsSave: (newBtsDoc: string) => void;
  onReviseScript: (feedback: string) => void;
  isLoading: boolean;
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

const getPlainText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

const highlightSyntax = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Highlight keywords like **Scene Number & Title:**
    .replace(
      /(\*\*(?:Scene Number & Title|Scene Description|Key Visual Elements|Visuals|Transition|Pacing & Emotion):\*\*)/g,
      '<span class="text-yellow-400">$1</span>'
    )
    // Highlight bullet points
    .replace(
      /^\s*-\s(.*)/gm,
      '<span class="text-slate-500">- </span><span class="text-slate-200">$1</span>'
    );
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedAssets, onScriptSave, onOutlineSave, onBtsSave, onReviseScript, isLoading }) => {
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
  const [revisionFeedback, setRevisionFeedback] = useState('');
  
  const [scriptSaveStatus, setScriptSaveStatus] = useState<SaveStatus>('clean');
  const [outlineSaveStatus, setOutlineSaveStatus] = useState<SaveStatus>('clean');
  const [btsSaveStatus, setBtsSaveStatus] = useState<SaveStatus>('clean');

  const outlineTextareaRef = useRef<HTMLTextAreaElement>(null);
  const outlinePreRef = useRef<HTMLPreElement>(null);
  
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

  const handleBtsChange = (html: string) => {
    setEditedBts(html);
    setBtsSaveStatus('dirty');
  }
  
  const highlightedOutline = useMemo(() => highlightSyntax(editedOutline), [editedOutline]);
  
  const handleOutlineScroll = () => {
    if (outlinePreRef.current && outlineTextareaRef.current) {
      outlinePreRef.current.scrollTop = outlineTextareaRef.current.scrollTop;
      outlinePreRef.current.scrollLeft = outlineTextareaRef.current.scrollLeft;
    }
  };

  const btsWordCount = useMemo(() => {
    const text = getPlainText(editedBts);
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }, [editedBts]);

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
        contentToCopy = getPlainText(editedBts);
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

  const handleExportPackage = useCallback(() => {
    const scriptHtml = `<pre style="white-space: pre-wrap; font-family: sans-serif; font-size: 1rem;">${editedScript}</pre>`;
    const outlineHtml = editedOutline
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)$/gm, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent lists
      .replace(/\n/g, '<br>');
    const btsHtml = editedBts; // It's already HTML

    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>1 Billion Followers - Submission Package</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
          h1, h2, h3 { color: #111; line-height: 1.2; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
          @media print {
            body { margin: 20px; padding: 0; }
            .no-print { display: none; }
          }
          .page-break { page-break-before: always; }
          .info-box { background-color: #f0f8ff; border: 1px solid #b0e0e6; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="info-box no-print">
          <p><strong>To save as a PDF:</strong> Open the print dialog (Ctrl/Cmd + P) and select "Save as PDF" as the destination.</p>
          <p><strong>Note:</strong> This package contains your text documents. Please remember to download your Reference Images separately from the main application.</p>
        </div>
        
        <h1>Project: 1 Billion Followers</h1>
        
        <div class="page-break"></div>
        <h2>Narration Script</h2>
        ${scriptHtml}

        <div class="page-break"></div>
        <h2>Visual Outline</h2>
        ${outlineHtml}

        <div class="page-break"></div>
        <h2>Behind the Scenes Document</h2>
        ${btsHtml}

      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
        newWindow.onload = () => {
            URL.revokeObjectURL(url);
        };
    }
  }, [editedScript, editedOutline, editedBts]);

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

  const handleBtsFormat = (command: string) => {
    document.execCommand(command, false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey;
    const isRedo = (e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));

    if (isUndo) {
      e.preventDefault();
      if (canUndo) undo();
    } else if (isRedo) {
      e.preventDefault();
      if (canRedo) redo();
    }
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
        <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-wrap gap-4">
            <div className="flex space-x-2">
                <TabButton tab="script" label="Narration Script" />
                <TabButton tab="outline" label="Visual Outline" />
                <TabButton tab="images" label="Reference Images" />
                <TabButton tab="bts" label="BTS Document" />
            </div>
             <button
              onClick={handleExportPackage}
              className="px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 bg-yellow-600 text-white hover:bg-yellow-500"
              title="Compile and export all text assets for submission"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm.5 3.5a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5zM5 9.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5zm.5 2.5a.5.5 0 000 1h8a.5.5 0 000-1h-8z" />
              </svg>
              Export Package for Submission
            </button>
        </div>
        <div className="p-4 border-b border-slate-700">
             {activeTab === 'script' && (
                  <div className="flex items-center gap-4">
                    <SaveStatusIndicator status={scriptSaveStatus} />
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={undo}
                        disabled={!canUndo || isLoading}
                        className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo script change"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 016 6v3" />
                        </svg>
                      </button>
                      <button
                        onClick={redo}
                        disabled={!canRedo || isLoading}
                        className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo script change"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === 'outline' && (
                   <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={outlineSaveStatus} />
                     <button
                        onClick={handleAddNewScene}
                        className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2 ml-auto"
                        title="Add a new scene to the outline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Scene
                      </button>
                   </div>
                )}
                 {activeTab === 'bts' && (
                   <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={btsSaveStatus} />
                   </div>
                )}
        </div>

        <div className="p-6">
            {activeTab === 'script' && (
               <div className="flex flex-col h-[70vh]">
                 <div className="prose prose-invert prose-sm md:prose-base max-w-none flex-grow">
                   <textarea
                     value={editedScript}
                     onChange={(e) => handleScriptChange(e.target.value)}
                     onKeyDown={handleKeyDown}
                     className="w-full h-full bg-slate-900/70 p-4 rounded-md font-sans text-slate-200 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                     aria-label="Editable script area"
                     disabled={isLoading}
                   />
                 </div>
                 <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <h3 className="text-md font-semibold text-cyan-400 mb-2">Script Revision</h3>
                    <p className="text-xs text-slate-400 mb-3">Provide specific feedback on what you'd like to change in the script above. The AI will rewrite it based on your instructions.</p>
                    <textarea
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      className="w-full h-24 bg-slate-800 p-2 rounded-md font-sans text-slate-200 border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow resize-y"
                      aria-label="Script revision feedback"
                      placeholder="e.g., 'Make the tone more urgent in the middle section.' or 'Can we rephrase the final line to be more impactful?'"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => {
                        onReviseScript(revisionFeedback);
                        setRevisionFeedback('');
                      }}
                      disabled={isLoading || !revisionFeedback.trim()}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      <SparklesIcon />
                      Revise Script
                    </button>
                 </div>
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
                  <div className="w-full h-full relative">
                      <pre
                        ref={outlinePreRef}
                        aria-hidden="true"
                        className="absolute inset-0 m-0 p-4 rounded-md font-mono text-slate-200 whitespace-pre-wrap break-words overflow-auto pointer-events-none"
                      >
                        <code dangerouslySetInnerHTML={{ __html: highlightedOutline }} />
                      </pre>
                      <textarea
                        ref={outlineTextareaRef}
                        value={editedOutline}
                        onChange={(e) => handleOutlineChange(e.target.value)}
                        onScroll={handleOutlineScroll}
                        className="absolute inset-0 w-full h-full bg-transparent p-4 rounded-md font-mono text-transparent caret-cyan-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow whitespace-pre-wrap break-words resize-none"
                        spellCheck="false"
                        aria-label="Editable visual outline"
                      />
                  </div>
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
               <div className="flex flex-col h-[70vh]">
                 <div className="bg-slate-900/70 border border-slate-700 rounded-t-md p-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleBtsFormat('bold')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Bold (Ctrl+B)">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5.25 4.5h4.5a3.25 3.25 0 010 6.5H5.25V4.5zm0 2.5v1.5h4.5a.75.75 0 000-1.5H5.25zM5.25 12h5.5a3.25 3.25 0 010 6.5H5.25V12zm0 2.5v1.5h5.5a.75.75 0 000-1.5H5.25z" />
                            </svg>
                        </button>
                         <button onClick={() => handleBtsFormat('italic')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Italic (Ctrl+I)">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.75 4.5a.75.75 0 000 1.5h1.259l-2.25 7.5H5.5a.75.75 0 000 1.5h5a.75.75 0 000-1.5H9.241l2.25-7.5H12.5a.75.75 0 000-1.5h-5z" />
                            </svg>
                        </button>
                        <button onClick={() => handleBtsFormat('insertUnorderedList')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Bulleted List">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2 5.75A.75.75 0 012.75 5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 4.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="w-px h-5 bg-slate-600 mx-2"></div>
                    <div className="text-xs text-slate-400">{btsWordCount} words</div>
                 </div>
                 <div
                   contentEditable
                   onInput={(e: React.FormEvent<HTMLDivElement>) => handleBtsChange(e.currentTarget.innerHTML)}
                   dangerouslySetInnerHTML={{ __html: editedBts }}
                   className="w-full flex-grow bg-slate-900/70 p-4 rounded-b-md font-sans text-slate-200 border-x border-b border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow prose prose-invert prose-sm md:prose-base max-w-none prose-ul:list-disc prose-ul:ml-6"
                   aria-label="Editable Behind-the-Scenes document"
                 />
               </div>
            )}
        </div>
    </div>
  );
};
