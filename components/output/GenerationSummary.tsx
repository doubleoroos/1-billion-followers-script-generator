
import React from 'react';
import type { RewriteTomorrowTheme, EmotionalArcIntensity, VisualStyle, NarrativeTone } from '../../types';

interface GenerationSummaryProps {
    choices: {
        theme: RewriteTomorrowTheme;
        arc: EmotionalArcIntensity;
        style: VisualStyle;
        tone: NarrativeTone;
    }
}

const SummaryItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex-1 text-center bg-cyan/10 p-4 rounded-lg border border-white/10 min-w-[120px]">
        <p className="text-sm text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="font-bold text-violet text-lg capitalize">{value}</p>
    </div>
);

export const GenerationSummary: React.FC<GenerationSummaryProps> = ({ choices }) => {
    return (
        <section className="max-w-4xl mx-auto animate-fade-in-stagger" style={{ animationDelay: '50ms' }}>
            <h3 className="font-semibold text-text-primary mb-4 text-center text-lg">Your Creative Direction</h3>
            <div className="flex flex-wrap justify-center gap-4">
                <SummaryItem label="Theme" value={choices.theme} />
                <SummaryItem label="Tone" value={choices.tone} />
                <SummaryItem label="Visual Style" value={choices.style} />
                <SummaryItem label="Emotional Arc" value={choices.arc} />
            </div>
        </section>
    );
};
