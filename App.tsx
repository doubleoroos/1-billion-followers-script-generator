import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputDisplay } from './components/output/OutputDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateCreativeAssets } from './services/geminiService';
import type { GeneratedAssets, EmotionalArcIntensity, VisualStyle, NarrativeTone, ScriptBlock, Character, Scene, RewriteTomorrowTheme } from './types';

type AppState = 'vision' | 'generating' | 'reveal';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('vision');
  const [error, setError] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  
  // Creative Controls State
  const [rewriteTomorrowTheme, setRewriteTomorrowTheme] = useState<RewriteTomorrowTheme>('abundance');
  const [emotionalArc, setEmotionalArc] = useState<EmotionalArcIntensity>('moderate');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic');
  const [narrativeTone, setNarrativeTone] = useState<NarrativeTone>('poetic');
  
  const handleGenerate = useCallback(async () => {
    setAppState('generating');
    setError(null);
    setGeneratedAssets(null);

    try {
      const result = await generateCreativeAssets(rewriteTomorrowTheme, emotionalArc, visualStyle, narrativeTone);
      setGeneratedAssets(result);
      setAppState('reveal');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAppState('vision'); // Go back to vision screen on error
      console.error(e);
    }
  }, [rewriteTomorrowTheme, emotionalArc, visualStyle, narrativeTone]);
  
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
          const creativeChoices = {
            theme: rewriteTomorrowTheme,
            arc: emotionalArc,
            style: visualStyle,
            tone: narrativeTone,
          };
          return (
            <OutputDisplay 
              generatedAssets={generatedAssets}
              onScriptSave={handleScriptSave}
              onOutlineSave={handleOutlineSave}
              onBtsSave={handleBtsSave}
              onVideoSave={handleVideoSave}
              visualStyle={visualStyle}
              creativeChoices={creativeChoices}
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
            isLoading={false}
            rewriteTomorrowTheme={rewriteTomorrowTheme}
            setRewriteTomorrowTheme={setRewriteTomorrowTheme}
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
    <div className="min-h-screen bg-transparent text-text-primary font-sans">
      <Header onStartOver={handleStartOver} showStartOver={appState === 'reveal'} />
      <main className="container mx-auto px-4 py-12 md:py-20">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
