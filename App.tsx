import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputDisplay } from './components/OutputDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateCreativeAssets } from './services/geminiService';
import type { GeneratedAssets, EmotionalArcIntensity, VisualStyle, NarrativeTone, ScriptBlock, Character } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  
  // Creative Controls State
  const [emotionalArc, setEmotionalArc] = useState<EmotionalArcIntensity>('moderate');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic');
  const [narrativeTone, setNarrativeTone] = useState<NarrativeTone>('poetic');
  
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedAssets(null);
    setLoadingMessage('Generating script, outline, and reference images...');

    try {
      const result = await generateCreativeAssets(emotionalArc, visualStyle, narrativeTone);
      setGeneratedAssets(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate assets: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [emotionalArc, visualStyle, narrativeTone]);
  
  const handleScriptSave = useCallback((newScript: ScriptBlock[], newCharacters: Character[]) => {
    setGeneratedAssets(prevAssets => {
      if (!prevAssets) return null;
      return {
        ...prevAssets,
        script: newScript,
        characters: newCharacters,
      };
    });
  }, []);

  const handleOutlineSave = useCallback((newOutline: string) => {
    setGeneratedAssets(prevAssets => {
      if (!prevAssets) return null;
      return {
        ...prevAssets,
        visualOutline: newOutline,
      };
    });
  }, []);

  const handleBtsSave = useCallback((newBtsDoc: string) => {
    setGeneratedAssets(prevAssets => {
      if (!prevAssets) return null;
      return {
        ...prevAssets,
        btsDocument: newBtsDoc,
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <InputPanel
              onGenerate={handleGenerate}
              isLoading={isLoading}
              emotionalArc={emotionalArc}
              setEmotionalArc={setEmotionalArc}
              visualStyle={visualStyle}
              setVisualStyle={setVisualStyle}
              narrativeTone={narrativeTone}
              setNarrativeTone={setNarrativeTone}
            />
          </div>
          <div className="lg:col-span-2">
            {isLoading && <LoadingSpinner message={loadingMessage} />}
            {error && !isLoading && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-xl flex flex-col items-center justify-center text-center animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold mb-2 text-white">Generation Failed</h3>
                <p className="mb-6 text-slate-300">{error}</p>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Retry
                </button>
              </div>
            )}
            {generatedAssets && !error && (
              <OutputDisplay 
                generatedAssets={generatedAssets}
                onScriptSave={handleScriptSave}
                onOutlineSave={handleOutlineSave}
                onBtsSave={handleBtsSave}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;