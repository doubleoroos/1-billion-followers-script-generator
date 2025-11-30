import React, { useState } from 'react';
import type { ScriptBlock, Character } from '../../types';
import { useSound } from '../hooks/useSound';

// Keep existing imports for audio/autosave but simplified for display focus
// ...

export const ScriptSection: React.FC<any> = ({ script, characters, onSave }) => {
    const playSound = useSound();
    const [editedScript, setEditedScript] = useState(script);

    // This mimics "Final Draft Night Mode"
    // Background: #2d2d2d (Dark Grey)
    // Text: #e6e6e6 (Off-white)
    // Font: Courier Prime (Monospace)
    
    return (
        <div className="relative w-full max-w-4xl mx-auto pb-20">
            {/* Sticky Studio Toolbar */}
            <div className="sticky top-[70px] z-30 flex justify-between items-center bg-gunmetal border border-white/10 border-b-0 rounded-t-sm p-3 shadow-xl">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Screenplay_Final_Draft.fdx</span>
                 </div>
                 <div className="flex gap-2">
                     <button className="text-[10px] font-bold uppercase text-slate-500 hover:text-cyan-400 px-3 py-1 border border-transparent hover:border-cyan-500/30 transition-all rounded-sm">Export PDF</button>
                     <button className="text-[10px] font-bold uppercase text-slate-500 hover:text-cyan-400 px-3 py-1 border border-transparent hover:border-cyan-500/30 transition-all rounded-sm">Format</button>
                 </div>
            </div>

            {/* The Page */}
            <div className="bg-[#222] text-[#eee] font-mono text-base shadow-2xl border-x border-b border-white/5 min-h-[800px] p-8 md:p-16 relative">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]"></div>
                
                <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                     {editedScript.map((block: any) => (
                         <div key={block.id} className="group hover:bg-white/5 transition-colors rounded p-2 -mx-2">
                             {block.type === 'narration' ? (
                                 <div className="text-[#bbb] mb-2 uppercase tracking-wide leading-relaxed">
                                     {block.content}
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center mb-2">
                                     <div className="font-bold text-white mb-0.5 tracking-wider">
                                         {characters.find((c: any) => c.id === block.characterId)?.name.toUpperCase() || 'UNKNOWN'}
                                     </div>
                                     <div className="text-[#e6e6e6] text-center w-3/4 leading-relaxed">
                                         {block.content}
                                     </div>
                                 </div>
                             )}
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};