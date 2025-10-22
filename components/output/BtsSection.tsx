import React from 'react';
import { CopyButton } from '../ui/CopyButton';

interface BtsSectionProps {
    document: string;
    onSave: (newDoc: string) => void;
}

export const BtsSection: React.FC<BtsSectionProps> = ({ document, onSave }) => {
    return (
         <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 p-6 md:p-10 rounded-2xl max-w-4xl mx-auto text-gray-300 space-y-6 shadow-2xl leading-relaxed">
            <CopyButton textToCopy={document} />
            <p style={{ whiteSpace: 'pre-wrap' }}>{document}</p>
        </div>
    );
};
