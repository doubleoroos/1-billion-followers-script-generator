
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputDisplay } from './components/OutputDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateCreativeAssets } from './services/geminiService';
import type { GeneratedAssets, EmotionalArcIntensity, VisualStyle, NarrativeTone, ScriptBlock, Character, Scene } from './types';

type AppState = 'vision' | 'generating' | 'reveal';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('vision');
  const [error, setError] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  
  // Creative Controls State
  const [emotionalArc, setEmotionalArc] = useState<EmotionalArcIntensity>('moderate');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic');
  const [narrativeTone, setNarrativeTone] = useState<NarrativeTone>('poetic');
  
  const handleGenerate = useCallback(async () => {
    setAppState('generating');
    setError(null);
    setGeneratedAssets(null);

    try {
      const result = await generateCreativeAssets(emotionalArc, visualStyle, narrativeTone);
      setGeneratedAssets(result);
      setAppState('reveal');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAppState('vision'); // Go back to vision screen on error
      console.error(e);
    }
  }, [emotionalArc, visualStyle, narrativeTone]);
  
  const handleStartOver = () => {
    setGeneratedAssets(null);
    setError(null);
    setAppState('vision');
  };

  // Callback handlers for saving edits from the OutputDisplay
  const handleScriptSave = useCallback((newScript: ScriptBlock[], newCharacters: Character[]) => {
    setGeneratedAssets(prevAssets => prevAssets ? { ...prevAssets, script: newScript, characters: newCharacters } : null);
  }, []);

  const handleOutlineSave = useCallback((newOutline: Scene[]) => {
    setGeneratedAssets(prevAssets => prevAssets ? { ...prevAssets, visualOutline: newOutline } : null);
  }, []);

  const handleBtsSave = useCallback((newBtsDoc: string) => {
    setGeneratedAssets(prevAssets => prevAssets ? { ...prevAssets, btsDocument: newBtsDoc } : null);
  }, []);

  const handleVideoSave = useCallback((updatedScene: Scene) => {
    setGeneratedAssets(prevAssets => {
      if (!prevAssets) return null;
      const newOutline = prevAssets.visualOutline.map(scene => scene.id === updatedScene.id ? updatedScene : scene);
      return { ...prevAssets, visualOutline: newOutline };
    });
  }, []);

  const renderContent = () => {
    switch(appState) {
      case 'generating':
        return <LoadingSpinner />;
      case 'reveal':
        if (generatedAssets) {
          return (
            <OutputDisplay 
              generatedAssets={generatedAssets}
              onScriptSave={handleScriptSave}
              onOutlineSave={handleOutlineSave}
              onBtsSave={handleBtsSave}
              onVideoSave={handleVideoSave}
              visualStyle={visualStyle}
            />
          );
        }
        // Fallback to vision if assets are null
        setAppState('vision');
        return null;
      case 'vision':
      default:
        return (
          <InputPanel
            onGenerate={handleGenerate}
            // When appState is 'vision', the app is not in a generating state.
            // The original `appState === 'generating'` is always false here, causing a type error.
            isLoading={false}
            emotionalArc={emotionalArc}
            setEmotionalArc={setEmotionalArc}
            visualStyle={visualStyle}
            setVisualStyle={setVisualStyle}
            narrativeTone={narrativeTone}
            setNarrativeTone={setNarrativeTone}
            error={error}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans">
      <Header onStartOver={handleStartOver} showStartOver={appState === 'reveal'} />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;