import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GeneratedAssets, ScriptBlock, Character } from '../types';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void;
  onOutlineSave: (newOutline: string) => void;
  onBtsSave: (newBtsDoc: string) => void;
  isLoading: boolean;
}

type Tab = 'script' | 'outline' | 'images' | 'bts';
type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved';


// --- START: useHistory Hook ---
// Custom hook to manage state history for undo/redo functionality
const useHistory = <T extends unknown>(initialState: T) => {
  const [history, setHistory] = useState([JSON.stringify(initialState)]);
  const [pointer, setPointer] = useState(0);

  const state: T = useMemo(() => JSON.parse(history[pointer]), [history, pointer]);

  const setState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
    const newState = typeof newStateOrFn === 'function' 
        // @ts-ignore
        ? newStateOrFn(state) 
        : newStateOrFn;

    const newStringifiedState = JSON.stringify(newState);
    if (newStringifiedState === history[pointer]) {
      return; // No change, do nothing
    }
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(newStringifiedState);
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
  }, [history, pointer, state]);

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

  useEffect(() => {
    setHistory([JSON.stringify(initialState)]);
    setPointer(0);
  }, [initialState]);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo };
};
// --- END: useHistory Hook ---


// --- START: ScriptEditor Component ---
interface ScriptEditorProps {
    initialScript: ScriptBlock[];
    initialCharacters: Character[];
    onSave: (script: ScriptBlock[], characters: Character[]) => void;
    isLoading: boolean;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ initialScript, initialCharacters, onSave, isLoading }) => {
    const { state: script, setState: setScript, undo, redo, canUndo, canRedo } = useHistory(initialScript);
    const [characters, setCharacters] = useState<Character[]>(initialCharacters);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('clean');

    useEffect(() => {
        setCharacters(initialCharacters);
    }, [initialCharacters]);

    const handleContentChange = (blockId: string, newContent: string) => {
        setScript(prev => prev.map(block => block.id === blockId ? { ...block, content: newContent } : block));
        setSaveStatus('dirty');
    };
    
    const handleCharacterChange = (blockId: string, newCharId: string) => {
        setScript(prev => prev.map(block => block.id === blockId ? { ...block, characterId: newCharId } : block));
        setSaveStatus('dirty');
    }
    
    const toggleBlockType = (blockId: string) => {
        setScript(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const isDialogue = block.type === 'dialogue';
            return { 
                ...block, 
                type: isDialogue ? 'narration' : 'dialogue',
                characterId: isDialogue ? undefined : (characters[0]?.id || undefined)
            };
        }));
        setSaveStatus('dirty');
    }

    const addCharacter = () => {
        const name = window.prompt("Enter new character name:");
        if (name) {
            const newChar = { id: `char_${Math.random().toString(36).substring(2, 9)}`, name };
            setCharacters(prev => [...prev, newChar]);
            setSaveStatus('dirty');
        }
    }
    
    const renameCharacter = (charId: string) => {
        const char = characters.find(c => c.id === charId);
        const newName = window.prompt(`Rename character "${char?.name}":`, char?.name);
        if (newName) {
            setCharacters(prev => prev.map(c => c.id === charId ? { ...c, name: newName } : c));
            setSaveStatus('dirty');
        }
    }
    
    const deleteCharacter = (charId: string) => {
        if (window.confirm("Are you sure you want to delete this character? All their dialogue will be unassigned.")) {
            setCharacters(prev => prev.filter(c => c.id !== charId));
            setScript(prev => prev.map(block => block.characterId === charId ? { ...block, characterId: undefined } : block));
            setSaveStatus('dirty');
        }
    }
    
    useEffect(() => {
        if (saveStatus !== 'dirty') return;
        const handler = setTimeout(() => {
            setSaveStatus('saving');
            onSave(script, characters);
            setTimeout(() => setSaveStatus('saved'), 500);
        }, 2500);
        return () => clearTimeout(handler);
    }, [script, characters, saveStatus, onSave]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey;
        const isRedo = (e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));
        if (isUndo) { e.preventDefault(); undo(); }
        if (isRedo) { e.preventDefault(); redo(); }
    };
    
    return (
        <div onKeyDown={handleKeyDown}>
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <SaveStatusIndicator status={saveStatus} />
                <div className="flex items-center gap-2">
                      <button onClick={undo} disabled={!canUndo || isLoading} className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)" aria-label="Undo script change">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 016 6v3" /></svg>
                      </button>
                      <button onClick={redo} disabled={!canRedo || isLoading} className="p-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)" aria-label="Redo script change">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" /></svg>
                      </button>
                </div>
            </div>
            <div className="flex gap-6 p-6 h-[70vh]">
                <div className="w-1/3 md:w-1/4 flex flex-col gap-4 border-r border-slate-700 pr-6">
                    <h3 className="text-base font-semibold text-cyan-400">Characters</h3>
                    <ul className="space-y-2 flex-grow overflow-y-auto">
                        {characters.map(char => (
                            <li key={char.id} className="group flex items-center justify-between p-2 rounded-md bg-slate-900/50 hover:bg-slate-800">
                                <span className="text-sm font-medium text-slate-200">{char.name}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => renameCharacter(char.id)} title="Rename" className="p-1 hover:bg-slate-700 rounded"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => deleteCharacter(char.id)} title="Delete" className="p-1 hover:bg-slate-700 rounded"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <button onClick={addCharacter} className="w-full text-sm py-2 px-3 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 rounded-md transition-colors">+ Add Character</button>
                </div>
                <div className="w-2/3 md:w-3/4 flex-grow overflow-y-auto space-y-4 pr-2">
                    {script.map(block => (
                        <div key={block.id} className="bg-slate-900/70 p-3 rounded-md border border-slate-700">
                            {block.type === 'dialogue' && (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                         <select 
                                            value={block.characterId || ''} 
                                            onChange={e => handleCharacterChange(block.id, e.target.value)}
                                            className="text-xs font-bold uppercase bg-slate-800 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                            <option value="" disabled>Unassigned</option>
                                            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                         </select>
                                          <button onClick={() => toggleBlockType(block.id)} title="Change to Narration" className="text-xs text-slate-400 hover:text-white">[Narration]</button>
                                    </div>
                                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wider ml-1 mb-1">
                                        {characters.find(c => c.id === block.characterId)?.name || 'UNASSIGNED'}
                                    </div>
                                </>
                            )}
                             {block.type === 'narration' && (
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-cyan-400 uppercase">Narration</span>
                                    <button onClick={() => toggleBlockType(block.id)} title="Change to Dialogue" className="text-xs text-slate-400 hover:text-white">[Dialogue]</button>
                                 </div>
                             )}
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleContentChange(block.id, e.currentTarget.innerText)}
                                className="w-full bg-transparent font-sans text-slate-200 focus:outline-none prose prose-invert prose-sm max-w-none"
                            >
                                {block.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// --- END: ScriptEditor Component ---


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
    .replace(
      /(\*\*(?:Scene Number & Title|Scene Description|Key Visual Elements|Visuals|Transition|Pacing & Emotion):\*\*)/g,
      '<span class="text-yellow-400">$1</span>'
    )
    .replace(
      /^\s*-\s(.*)/gm,
      '<span class="text-slate-500">- </span><span class="text-slate-200">$1</span>'
    );
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedAssets, onScriptSave, onOutlineSave, onBtsSave, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('script');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const [editedOutline, setEditedOutline] = useState(generatedAssets.visualOutline);
  const [editedBts, setEditedBts] = useState(generatedAssets.btsDocument);
  
  const [outlineSaveStatus, setOutlineSaveStatus] = useState<SaveStatus>('clean');
  const [btsSaveStatus, setBtsSaveStatus] = useState<SaveStatus>('clean');

  const outlineTextareaRef = useRef<HTMLTextAreaElement>(null);
  const outlinePreRef = useRef<HTMLPreElement>(null);

  const handleOutlineChange = useCallback((value: string) => {
    setEditedOutline(value);
    setOutlineSaveStatus('dirty');
  }, []);

  const handleBtsChange = useCallback((html: string) => {
    setEditedBts(html);
    setBtsSaveStatus('dirty');
  }, []);
  
  // Auto-save outline
  useEffect(() => {
    if (outlineSaveStatus !== 'dirty') return;
    const handler = setTimeout(() => {
      setOutlineSaveStatus('saving');
      onOutlineSave(editedOutline);
      setTimeout(() => setOutlineSaveStatus('saved'), 500);
    }, 2500);
    return () => clearTimeout(handler);
  }, [editedOutline, outlineSaveStatus, onOutlineSave]);

  // Auto-save BTS
  useEffect(() => {
    if (btsSaveStatus !== 'dirty') return;
    const handler = setTimeout(() => {
      setBtsSaveStatus('saving');
      onBtsSave(editedBts);
      setTimeout(() => setBtsSaveStatus('saved'), 500);
    }, 2500);
    return () => clearTimeout(handler);
  }, [editedBts, btsSaveStatus, onBtsSave]);

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

  useEffect(() => {
    setEditedOutline(generatedAssets.visualOutline);
    setOutlineSaveStatus('clean');
    setEditedBts(generatedAssets.btsDocument);
    setBtsSaveStatus('clean');
  }, [generatedAssets.visualOutline, generatedAssets.btsDocument]);


  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const outlineContainerRef = useRef<HTMLDivElement>(null);

  const parsedScenes = useMemo(() => {
    if (!editedOutline) return [];
    const sceneRegex = /(\*\*(?:Scene Number & Title):\*\*(?:.|\n)*?)(?=\*\*Scene Number & Title:\*\*|$)/g;
    const matches = [...editedOutline.matchAll(sceneRegex)];
    return matches.map((match, index) => {
        const content = match[1].trim();
        const titleLine = content.split('\n')[0];
        const title = titleLine.replace('**Scene Number & Title:**', '').trim();
        const id = `scene-${index}-${title.replace(/\s+/g, '-')}`; // More robust ID
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
        }, { root: outlineContainerRef.current, rootMargin: '0px 0px -80% 0px', threshold: 0 }
    );
    const sceneElements = parsedScenes.map(scene => document.getElementById(scene.id)).filter((el): el is HTMLElement => el !== null);
    sceneElements.forEach(el => observer.observe(el));
    if (!activeSceneId && sceneElements.length > 0) setActiveSceneId(sceneElements[0].id);
    return () => sceneElements.forEach(el => observer.unobserve(el));
  }, [activeTab, parsedScenes, activeSceneId]);

  const handleCopy = useCallback(() => {
    if (activeTab === 'images') return;
    let contentToCopy;
    switch (activeTab) {
      case 'script':
        const { script, characters } = generatedAssets;
        contentToCopy = script.map(block => {
            if (block.type === 'narration') return block.content;
            const charName = characters.find(c => c.id === block.characterId)?.name || 'UNASSIGNED';
            return `${charName.toUpperCase()}\n    ${block.content}`;
        }).join('\n\n');
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
  }, [activeTab, generatedAssets, editedOutline, editedBts]);

  const handleExportPackage = useCallback(() => {
    const { script, characters } = generatedAssets;
    const scriptHtml = script.map(block => {
        if (block.type === 'narration') {
            return `<div style="margin-top: 1em;">${block.content.replace(/\n/g, '<br>')}</div>`;
        }
        const charName = characters.find(c => c.id === block.characterId)?.name || 'UNASSIGNED';
        return `<div style="margin-top: 1em;">
                    <div style="font-weight: bold; text-transform: uppercase;">${charName}</div>
                    <div style="padding-left: 2em;">${block.content.replace(/\n/g, '<br>')}</div>
                </div>`;
    }).join('');

    const outlineHtml = editedOutline.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- (.*)$/gm, '<ul><li>$1</li></ul>').replace(/<\/ul>\s*<ul>/g, '').replace(/\n/g, '<br>');
    const btsHtml = editedBts;

    const content = `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>1 Billion Followers - Submission Package</title>
      <style>body{font-family:sans-serif;line-height:1.6;color:#333;max-width:800px;margin:40px auto;padding:20px;}h1,h2{color:#111;}h1{border-bottom:2px solid #eee;padding-bottom:10px;}@media print{.no-print{display:none;}}.page-break{page-break-before:always;}</style></head>
      <body><div class="no-print" style="background-color:#f0f8ff;border:1px solid #b0e0e6;padding:15px;margin-bottom:20px;border-radius:8px;"><p><strong>To save as PDF:</strong> Use Print (Ctrl/Cmd+P) and select "Save as PDF".</p></div>
      <h1>Project: 1 Billion Followers</h1><div class="page-break"></div><h2>Narration Script</h2>${scriptHtml}
      <div class="page-break"></div><h2>Visual Outline</h2>${outlineHtml}
      <div class="page-break"></div><h2>Behind the Scenes Document</h2>${btsHtml}</body></html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [generatedAssets, editedOutline, editedBts]);

  const handleAddNewScene = useCallback(() => {
    const title = window.prompt("Enter the title for the new scene:");
    if (title && title.trim() !== '') {
      const sceneCount = parsedScenes.length + 1;
      const newSceneTemplate = `\n\n**Scene Number & Title:** Scene ${sceneCount}: ${title.trim()}\n\n**Scene Description:** \n\n**Key Visual Elements:**\n- \n\n**Visuals:** \n\n**Transition:** \n\n**Pacing & Emotion:** `;
      handleOutlineChange(editedOutline + newSceneTemplate);
    }
  }, [parsedScenes.length, editedOutline, handleOutlineChange]);

  const handleSceneJump = (sceneId: string) => {
    const sceneElement = document.getElementById(sceneId);
    sceneElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, sceneId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sceneId);
    setDraggedSceneId(sceneId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedSceneId(null);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLIElement>, targetSceneId: string) => {
    e.preventDefault();
    const sourceSceneId = e.dataTransfer.getData('text/plain');
    if (!sourceSceneId || sourceSceneId === targetSceneId) {
      setDraggedSceneId(null);
      return;
    }
    
    const scenes = parsedScenes;
    const sourceIndex = scenes.findIndex(s => s.id === sourceSceneId);
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newScenes = [...scenes];
    const [draggedItem] = newScenes.splice(sourceIndex, 1);
    newScenes.splice(targetIndex, 0, draggedItem);
    
    const newOutline = newScenes.map(s => s.content).join('\n\n');
    handleOutlineChange(newOutline);
    setDraggedSceneId(null);
  }, [parsedScenes, handleOutlineChange]);

  const handleDeleteScene = useCallback((sceneId: string) => {
    if (window.confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
      const newScenes = parsedScenes.filter(s => s.id !== sceneId);
      const newOutline = newScenes.map(s => s.content).join('\n\n');
      handleOutlineChange(newOutline);
    }
  }, [parsedScenes, handleOutlineChange]);

  const handleBtsFormat = (command: string) => document.execCommand(command, false);

  const TabButton = ({ tab, label }: { tab: Tab; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
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
             <button onClick={handleExportPackage} className="px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 bg-yellow-600 text-white hover:bg-yellow-500" title="Compile and export all text assets for submission">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm.5 3.5a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5zM5 9.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5zm.5 2.5a.5.5 0 000 1h8a.5.5 0 000-1h-8z" /></svg>
              Export Package
            </button>
        </div>
        
        {activeTab !== 'script' && (
            <div className="p-4 border-b border-slate-700">
                {activeTab === 'outline' && (
                   <div className="flex items-center gap-4">
                     <SaveStatusIndicator status={outlineSaveStatus} />
                     <button onClick={handleAddNewScene} className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2 ml-auto" title="Add a new scene to the outline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Scene
                      </button>
                   </div>
                )}
                 {activeTab === 'bts' && <SaveStatusIndicator status={btsSaveStatus} />}
            </div>
        )}

        <div>
            {activeTab === 'script' && (
                <ScriptEditor 
                    initialScript={generatedAssets.script}
                    initialCharacters={generatedAssets.characters}
                    onSave={onScriptSave}
                    isLoading={isLoading}
                />
            )}
            {activeTab === 'outline' && (
              <div className="flex gap-6 p-6">
                <nav className="w-1/3 md:w-1/4 h-[65vh] overflow-y-auto pr-4 border-r border-slate-600">
                  <h3 className="text-base font-semibold mb-3 text-cyan-400 sticky top-0 bg-slate-800/80 backdrop-blur-sm pb-2 z-10">Scenes</h3>
                  <ul className="space-y-1">
                    {parsedScenes.map(scene => (
                      <li 
                        key={scene.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, scene.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, scene.id)}
                        onDragEnd={handleDragEnd}
                        className={`group w-full text-left p-2 rounded-md transition-all duration-150 relative cursor-move ${activeSceneId === scene.id ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'} ${draggedSceneId === scene.id ? 'opacity-50' : ''}`}>
                        <button onClick={() => handleSceneJump(scene.id)} className="w-full h-full text-left text-xs pr-6" style={{pointerEvents: draggedSceneId ? 'none' : 'auto'}}>
                          {scene.title}
                        </button>
                        <button 
                          onClick={() => handleDeleteScene(scene.id)} 
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-red-900/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Scene"
                          aria-label={`Delete scene: ${scene.title}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div ref={outlineContainerRef} className="w-2/3 md:w-3/4 h-[65vh] overflow-y-auto prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0">
                  <div className="w-full h-full relative">
                      <pre ref={outlinePreRef} aria-hidden="true" className="absolute inset-0 m-0 p-4 rounded-md font-mono text-slate-200 whitespace-pre-wrap break-words overflow-auto pointer-events-none">
                        <code dangerouslySetInnerHTML={{ __html: highlightedOutline }} />
                      </pre>
                      <textarea ref={outlineTextareaRef} value={editedOutline} onChange={(e) => handleOutlineChange(e.target.value)} onScroll={handleOutlineScroll} className="absolute inset-0 w-full h-full bg-transparent p-4 rounded-md font-mono text-transparent caret-cyan-400 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow whitespace-pre-wrap break-words resize-none" spellCheck="false" aria-label="Editable visual outline"/>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'images' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-6">
                {generatedAssets.referenceImages.map((image) => (
                  <div key={image.title} className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <img src={image.imageUrl} alt={image.title} className="rounded-md w-full aspect-video object-cover" />
                    <h4 className="text-md font-semibold text-cyan-400 text-center">{image.title}</h4>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'bts' && (
               <div className="flex flex-col h-[70vh] p-6">
                 <div className="bg-slate-900/70 border border-slate-700 rounded-t-md p-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleBtsFormat('bold')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Bold (Ctrl+B)"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.25 4.5h4.5a3.25 3.25 0 010 6.5H5.25V4.5zm0 2.5v1.5h4.5a.75.75 0 000-1.5H5.25zM5.25 12h5.5a3.25 3.25 0 010 6.5H5.25V12zm0 2.5v1.5h5.5a.75.75 0 000-1.5H5.25z" /></svg></button>
                        <button onClick={() => handleBtsFormat('italic')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Italic (Ctrl+I)"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7.75 4.5a.75.75 0 000 1.5h1.259l-2.25 7.5H5.5a.75.75 0 000 1.5h5a.75.75 0 000-1.5H9.241l2.25-7.5H12.5a.75.75 0 000-1.5h-5z" /></svg></button>
                        <button onClick={() => handleBtsFormat('insertUnorderedList')} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Bulleted List"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5.75A.75.75 0 012.75 5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 4.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg></button>
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