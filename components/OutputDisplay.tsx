import React, { useState, useCallback, useEffect } from 'react';
import type { GeneratedAssets } from '../types';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: string) => void;
}

type Tab = 'script' | 'outline' | 'images';

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedAssets, onScriptSave }) => {
  const [activeTab, setActiveTab] = useState<Tab>('script');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [editedScript, setEditedScript] = useState<string>(generatedAssets.script);

  useEffect(() => {
    setEditedScript(generatedAssets.script);
  }, [generatedAssets.script]);

  const handleCopy = useCallback(() => {
    if (activeTab === 'images') return;
    const contentToCopy = activeTab === 'script' ? editedScript : generatedAssets.visualOutline;
    navigator.clipboard.writeText(contentToCopy).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  }, [activeTab, editedScript, generatedAssets.visualOutline]);
  
  const handleSave = useCallback(() => {
    onScriptSave(editedScript);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [editedScript, onScriptSave]);
  
  const handleExportMarkdown = useCallback(() => {
    if (!generatedAssets.visualOutline) return;
    
    const blob = new Blob([generatedAssets.visualOutline], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-outline.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedAssets.visualOutline]);

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
            </div>
            {activeTab !== 'images' && (
              <div className="flex items-center gap-2">
                {activeTab === 'script' && (
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors flex items-center gap-2"
                  >
                    {saveStatus === 'saved' ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6.101a2 2 0 011.414.586l4.899 4.899A2 2 0 0120 8.899V18a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm7 1a1 1 0 00-1 1v5a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Save Script
                      </>
                    )}
                  </button>
                )}
                {activeTab === 'outline' && (
                   <button
                    onClick={handleExportMarkdown}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                    Export .md
                  </button>
                )}
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
              </div>
            )}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
            {activeTab === 'script' && (
               <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                 <textarea
                   value={editedScript}
                   onChange={(e) => setEditedScript(e.target.value)}
                   className="w-full min-h-[55vh] bg-slate-900/70 p-4 rounded-md font-sans text-slate-200 border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                   aria-label="Editable script area"
                 />
               </div>
            )}
            {activeTab === 'outline' && (
              <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-md">
                  <pre className="whitespace-pre-wrap font-sans">{generatedAssets.visualOutline}</pre>
              </div>
            )}
            {activeTab === 'images' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
    </div>
  );
};