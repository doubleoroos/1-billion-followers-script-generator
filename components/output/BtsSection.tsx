import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { useAutosave, SaveStatus } from '../hooks/useAutosave';

interface BtsSectionProps {
    document: string;
    onSave: (newDoc: string) => void;
}

// Helper components for status indicator
const CheckmarkIcon = () => <svg className="h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path className="animate-draw-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} /></svg>;

const SaveStatusIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
    let content: React.ReactNode = null;
    if (status === 'dirty') content = <span className="text-mint-glow">Unsaved changes...</span>;
    else if (status === 'saving') content = <span className="text-cyan-lum flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
    else if (status === 'saved') content = <span className="text-green-400 flex items-center gap-2"><CheckmarkIcon />Document updated.</span>;
    else return <div className="h-5"></div>;
    return <div className="h-5 text-sm transition-opacity duration-300 text-right">{content}</div>;
};

export const BtsSection: React.FC<BtsSectionProps> = ({ document, onSave }) => {
    const [editedDoc, setEditedDoc] = useState(document);
    const { status, save } = useAutosave({ onSave });
    
    useEffect(() => {
        setEditedDoc(document);
    }, [document]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedDoc(e.target.value);
        save(e.target.value);
    };

    return (
         <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 p-6 md:p-10 rounded-2xl max-w-4xl mx-auto text-gray-300 space-y-4 shadow-2xl leading-relaxed">
            <CopyButton textToCopy={editedDoc} />
            <div className="flex justify-end items-center">
                <SaveStatusIndicator status={status} />
            </div>
            <textarea
                value={editedDoc}
                onChange={handleChange}
                className="w-full bg-transparent p-1 -m-1 rounded-md focus:bg-gray-900/50 focus:outline-none focus:ring-1 focus:ring-violet-glow transition-colors duration-200"
                style={{ minHeight: '600px', whiteSpace: 'pre-wrap' }}
                aria-label="Behind The Scenes Document"
            />
        </div>
    );
};
