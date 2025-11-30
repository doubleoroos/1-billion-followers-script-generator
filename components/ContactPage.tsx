import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface ContactPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-studio overflow-y-auto animate-fade-in custom-scrollbar">
        {/* Custom Navigation for this page */}
        <div className="sticky top-0 z-50 bg-gunmetal border-b border-gold/20 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10">
                    <LogoIcon />
                 </div>
                 <span className="font-bold text-lg font-display tracking-tight uppercase">Earth Rising</span>
            </div>
            <button 
                onClick={onClose}
                className="btn-tactical px-6 py-2 rounded-sm font-bold text-sm flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Close
            </button>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
            <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-display uppercase">
                    <span className="bg-gradient-to-r from-cyan-400 to-slate-400 bg-clip-text text-transparent">Get in Touch</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
                    We are building a future where technology empowers humanity to rewrite its story. Connect with the team behind the movement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="panel-studio p-8 md:p-10 rounded-sm relative overflow-hidden group border-l-4 border-l-cyan-500 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-cyan-900/30 rounded-sm border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white font-display uppercase">General Support</h3>
                        <p className="text-slate-400 mb-8 min-h-[50px] font-mono text-sm">
                            Need help with the Rewrite Tomorrow generator? Have feedback on the generated scripts or assets?
                        </p>
                        <a href="mailto:info@earthrising.space" className="inline-flex items-center gap-2 text-lg font-bold text-cyan-400 hover:text-cyan-300 transition-colors group/link font-display uppercase tracking-wider">
                            info@earthrising.space
                            <svg className="w-5 h-5 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                    </div>
                </div>

                <div className="panel-studio p-8 md:p-10 rounded-sm relative overflow-hidden group border-l-4 border-l-slate-500 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-800/50 rounded-sm border border-slate-500/30 flex items-center justify-center mb-6 text-slate-300">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white font-display uppercase">Partnerships</h3>
                        <p className="text-slate-400 mb-8 min-h-[50px] font-mono text-sm">
                            Interested in sponsoring the 1 Billion Summit or collaborating on our next AI storytelling initiative?
                        </p>
                        <a href="mailto:info@earthrising.space?subject=Partnership Inquiry" className="inline-flex items-center gap-2 text-lg font-bold text-slate-400 hover:text-white transition-colors group/link font-display uppercase tracking-wider">
                            Partner with us
                            <svg className="w-5 h-5 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="text-center border-t border-white/5 pt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <p className="text-slate-500 text-sm mb-4 font-mono">
                    Stichting Earth Rising is a registered non-profit organization dedicated to using technology for planetary good.
                </p>
                <div className="flex justify-center gap-6 opacity-50">
                     {/* Social Placeholders */}
                     <div className="w-6 h-6 bg-slate-800 rounded-sm"></div>
                     <div className="w-6 h-6 bg-slate-800 rounded-sm"></div>
                     <div className="w-6 h-6 bg-slate-800 rounded-sm"></div>
                </div>
            </div>
        </div>
    </div>
  );
}