
import React, { useState } from 'react';
import { LogoIcon } from '../icons/LogoIcon';
import { useSound } from '../hooks/useSound';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupport: (tier: string) => void;
}

const TierCard: React.FC<{ 
    title: string; 
    price: string; 
    description: string; 
    features: string[]; 
    isPopular?: boolean;
    onSelect: () => void; 
}> = ({ title, price, description, features, isPopular, onSelect }) => {
    return (
        <button 
            onClick={onSelect}
            className={`relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] group w-full
            ${isPopular 
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)]' 
                : 'bg-slate-900/40 border-white/10 hover:bg-slate-900/60'
            }`}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-lg">
                    Most Popular
                </div>
            )}
            
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{price}</span>
                    <span className="text-sm text-slate-500">/ project</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 min-h-[40px]">{description}</p>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPopular ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>

            <div className={`w-full py-2.5 rounded-full font-bold text-center text-sm transition-all
                ${isPopular 
                    ? 'bg-white text-slate-900 hover:bg-slate-200' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
            >
                Select {title}
            </div>
        </button>
    );
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({ isOpen, onClose, onSupport }) => {
    const playSound = useSound();
    
    if (!isOpen) return null;

    const handleSelect = (tier: string) => {
        playSound('success');

        if (tier === 'seed') {
            // Free tier, just unlock
            onSupport(tier);
            return;
        }

        // PayPal Logic for Sapling and Forest
        const businessEmail = "doubleoroos4@mac.com";
        let amount = "0.00";
        let itemName = "Stichting Earth Rising Donation";

        if (tier === 'sapling') {
            amount = "5.00";
            itemName = "Stichting Earth Rising - Sapling Tier";
        } else if (tier === 'forest') {
            amount = "20.00";
            itemName = "Stichting Earth Rising - Forest Tier";
        }

        // Construct PayPal URL
        const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodeURIComponent(businessEmail)}&item_name=${encodeURIComponent(itemName)}&amount=${amount}&currency_code=EUR`;

        // Open PayPal in new tab
        window.open(paypalUrl, '_blank');

        // Optimistically unlock the features in the app
        onSupport(tier);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            
            <div className="relative bg-[#020617] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                {/* Header with Branding */}
                <div className="relative bg-slate-900/50 p-8 text-center border-b border-white/5">
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                         <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl border border-emerald-500/30">
                            <LogoIcon large={false} />
                         </div>
                    </div>
                    
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Support Stichting Earth Rising</h2>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        Your contribution powers the high-end AI models (Veo, Gemini Pro) used to generate these films and supports our mission to empower storytellers to heal the planet.
                    </p>
                </div>

                {/* Tiers */}
                <div className="p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TierCard 
                            title="Seed" 
                            price="Free" 
                            description="For students and those just starting their journey."
                            features={[
                                "Unlimited Idea Generation",
                                "Basic Script Drafting",
                                "Watermarked PDF Export",
                                "Community Discord Access"
                            ]}
                            onSelect={() => handleSelect('seed')}
                        />
                        <TierCard 
                            title="Sapling" 
                            price="€5.00" 
                            description="Cover the API costs and plant a seed for the future."
                            isPopular={true}
                            features={[
                                "Remove Watermarks",
                                "High-Res PDF Export",
                                "Download Audio Stems",
                                "Priority Generation Queue",
                                "Direct Contribution to Earth Rising"
                            ]}
                            onSelect={() => handleSelect('sapling')}
                        />
                        <TierCard 
                            title="Forest" 
                            price="€20.00" 
                            description="Become a Producer and accelerate the movement."
                            features={[
                                "All Sapling Features",
                                "4K Image Upscaling",
                                "Commercial License for Assets",
                                "Early Access to New Models",
                                "Producer Credit on Website"
                            ]}
                            onSelect={() => handleSelect('forest')}
                        />
                    </div>
                    
                    <div className="mt-10 text-center space-y-4 border-t border-white/5 pt-6">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Stichting Earth Rising is a registered non-profit. 
                            <br />Payments are processed securely via PayPal.
                        </p>
                        <a 
                            href="mailto:info@earthrising.space" 
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-emerald-500/30"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Need help? Contact info@earthrising.space
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
