import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputDisplay } from './components/OutputDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateCreativeAssets } from './services/geminiService';
import type { GeneratedAssets, EmotionalArcIntensity, VisualStyle, NarrativeTone, ScriptBlock, Character, Scene } from './types';

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

  const handleOutlineSave = useCallback((newOutline: Scene[]) => {
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
    <div className="min-h-screen bg-[#0D1117] text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 sticky top-24">
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
          <div className="lg:col-span-8">
            {isLoading && <LoadingSpinner message={loadingMessage} />}
            {error && !isLoading && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-6 rounded-2xl flex items-start space-x-4 animate-fade-in">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400/80 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <h3 className="text-xl font-semibold mb-1 text-white">Generation Failed</h3>
                    <p className="mb-4 text-gray-300">{error}</p>
                    <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 bg-amber-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-amber-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-[#0D1117]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Retry
                    </button>
                </div>
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
             {!isLoading && !error && !generatedAssets && (
                <div className="flex flex-col items-center justify-center bg-gray-900/30 border-2 border-dashed border-gray-500/30 p-12 rounded-2xl h-full min-h-[500px] text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>
                    <h3 className="text-xl font-bold text-white">Your Creative Assets Will Appear Here</h3>
                    <p className="text-gray-400 mt-2 max-w-md">Use the controls on the left to define your creative direction, then click "Generate Assets" to bring your vision to life.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;