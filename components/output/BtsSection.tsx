
import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';
import { useSound } from '../hooks/useSound';

interface BtsSectionProps {
    document: string;
    onSave: (newDoc: string) => void;
    onRegenerate: () => void;
    isRegenerating: boolean;
}

// Helper components for status indicator
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-cyan">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Document updated.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300 text-right">{content}</div>;
};

export const BtsSection: React.FC<BtsSectionProps> = ({ document, onSave, onRegenerate, isRegenerating }) => {
    const [editedDoc, setEditedDoc] = useState(document);
    const playSound = useSound();
    const { status, save } = useAutosave({ onSave, onSuccess: () => playSound('success') });
    
    useEffect(() => {
        setEditedDoc(document);
    }, [document]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedDoc(e.target.value);
        save(e.target.value);
    };

    return (
         <div className="relative panel-glass p-8 md:p-12 rounded-2xl max-w-4xl mx-auto text-text-primary/90 space-y-4 leading-relaxed">
            <div className="absolute top-3 right-3 flex gap-2 z-10">
                 <button
                    onClick={onRegenerate}
                    disabled={isRegenerating}
                    className="btn-glass flex items-center gap-2 text-xs font-semibold py-1 px-3 rounded-full border border-white/10 hover:border-violet-400 text-text-secondary hover:text-white transition-all disabled:opacity-50"
                >
                    {isRegenerating ? (
                         <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                    )}
                    {isRegenerating ? 'Updating...' : 'Update Context'}
                </button>
                <CopyButton textToCopy={editedDoc} className="" />
            </div>
            <div className="flex justify-end items-center">
                <SaveStatusIndicator status={status} />
            </div>
            <textarea
                value={editedDoc}
                onChange={handleChange}
                className="w-full bg-transparent p-1 -m-1 rounded-md focus:bg-black/30 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors duration-200"
                style={{ minHeight: '600px', whiteSpace: 'pre-wrap' }}
                aria-label="Behind The Scenes Document"
            />
        </div>
    );
};
