
import React, { useState, useEffect } from 'react';
import type { GeneratedAssets, ScriptBlock, Scene, Character, ReferenceImage } from '../types';

interface OutputDisplayProps {
  generatedAssets: GeneratedAssets;
  onScriptSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void;
  onOutlineSave: (newOutline: Scene[]) => void;
  onBtsSave: (newBtsDoc: string) => void;
  isLoading: boolean;
}

type Tab = 'script' | 'outline' | 'images' | 'bts';

// Icons
const ScriptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const OutlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ImagesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const BtsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;


const TabButton = ({ isActive, onClick, children, icon }: { isActive: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold text-sm rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 ${
            isActive
                ? 'bg-[#161b22]/80 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-800/30 hover:text-white'
        }`}
    >
        {icon}
        {children}
    </button>
);

const Section: React.FC<{title: string; children: React.ReactNode; onEdit?: () => void; isEditing?: boolean; onSave?: () => void; onCancel?: () => void;}> = ({title, children, onEdit, isEditing, onSave, onCancel}) => (
    <div className="bg-gradient-to-br from-gray-900/20 to-gray-800/10 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          {onEdit && !isEditing && (
            <button onClick={onEdit} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              <EditIcon />
              Edit
            </button>
          )}
          {isEditing && onSave && onCancel && (
            <div className="flex gap-2">
              <button onClick={onSave} className="text-sm bg-green-500/80 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md">Save</button>
              <button onClick={onCancel} className="text-sm bg-gray-600/80 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md">Cancel</button>
            </div>
          )}
        </div>
        {children}
    </div>
);


const ScriptPanel: React.FC<{ script: ScriptBlock[], characters: Character[], onSave: (newScript: ScriptBlock[], newCharacters: Character[]) => void }> = ({ script, characters, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedScript, setEditedScript] = useState(script);
    const [editedCharacters, setEditedCharacters] = useState(characters);

    useEffect(() => {
        setEditedScript(script);
        setEditedCharacters(characters);
    }, [script, characters]);
    
    const getCharacterName = (characterId?: string) => {
        if (!characterId) return 'Narrator';
        return editedCharacters.find(c => c.id === characterId)?.name || 'Unknown Character';
    };

    const handleSave = () => {
        onSave(editedScript, editedCharacters);
        setIsEditing(false);
    }
    const handleCancel = () => {
        setEditedScript(script);
        setEditedCharacters(characters);
        setIsEditing(false);
    }

    return (
      <Section title="Script & Characters" onEdit={() => setIsEditing(true)} isEditing={isEditing} onSave={handleSave} onCancel={handleCancel}>
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-cyan-400 mb-2">Characters</h4>
                <div className="space-y-4">
                    {editedCharacters.map((char, index) => (
                        <div key={char.id}>
                            <p className="font-bold text-white">{char.name}</p>
                            {isEditing ? (
                              <input value={char.description} onChange={(e) => {
                                const newChars = [...editedCharacters];
                                newChars[index].description = e.target.value;
                                setEditedCharacters(newChars);
                              }} className="w-full bg-gray-900/50 border border-gray-700 rounded p-1 text-gray-300 italic" />
                            ) : (
                              <p className="text-gray-300 italic">{char.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-cyan-400 mb-2 mt-4">Script</h4>
                <div className="space-y-4 prose prose-invert prose-p:text-gray-300 max-w-none">
                    {editedScript.map((block, index) => (
                        <div key={block.id}>
                            <p className="font-bold text-white">{getCharacterName(block.characterId).toUpperCase()}</p>
                            {isEditing ? (
                              <textarea value={block.content} onChange={(e) => {
                                const newScript = [...editedScript];
                                newScript[index].content = e.target.value;
                                setEditedScript(newScript);
                              }} className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded p-1 text-gray-300" />
                            ) : (
                              <p className="whitespace-pre-wrap">{block.content}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </Section>
    );
};

const OutlinePanel: React.FC<{ outline: Scene[] }> = ({ outline }) => {
    return (
        <div className="space-y-6">
            {outline.map(scene => (
                <Section key={scene.id} title={scene.title}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div><strong className="text-gray-400">Location:</strong><p className="text-gray-200">{scene.location}</p></div>
                        <div><strong className="text-gray-400">Time of Day:</strong><p className="text-gray-200">{scene.timeOfDay}</p></div>
                        <div className="md:col-span-2"><strong className="text-gray-400">Atmosphere:</strong><p className="text-gray-200">{scene.atmosphere}</p></div>
                        <div className="md:col-span-2"><strong className="text-gray-400">Description:</strong><p className="text-gray-200 whitespace-pre-wrap">{scene.description}</p></div>
                        <div className="md:col-span-2"><strong className="text-gray-400">Key Visual Elements:</strong><p className="text-gray-200">{scene.keyVisualElements}</p></div>
                        <div className="md:col-span-2"><strong className="text-gray-400">Visuals:</strong><p className="text-gray-200">{scene.visuals}</p></div>
                        <div><strong className="text-gray-400">Pacing & Emotion:</strong><p className="text-gray-200">{scene.pacingEmotion}</p></div>
                        <div><strong className="text-gray-400">Transition:</strong><p className="text-gray-200">{scene.transition}</p></div>
                    </div>
                </Section>
            ))}
        </div>
    );
};

const ImagesPanel: React.FC<{ images: ReferenceImage[] }> = ({ images }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map(image => (
                <div key={image.title} className="bg-gray-900/20 rounded-xl overflow-hidden border border-white/10">
                    <img src={image.imageUrl} alt={image.title} className="w-full h-auto object-cover aspect-video" />
                    <div className="p-4">
                        <h4 className="font-bold text-white">{image.title}</h4>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BtsPanel: React.FC<{ document: string, onSave: (newDoc: string) => void }> = ({ document, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDoc, setEditedDoc] = useState(document);

    useEffect(() => {
      setEditedDoc(document);
    }, [document]);

    const handleSave = () => {
      onSave(editedDoc);
      setIsEditing(false);
    }

    const handleCancel = () => {
      setEditedDoc(document);
      setIsEditing(false);
    }
    
    return (
        <Section title="Behind The Scenes Document" onEdit={() => setIsEditing(true)} isEditing={isEditing} onSave={handleSave} onCancel={handleCancel}>
            {isEditing ? (
              <textarea
                value={editedDoc}
                onChange={(e) => setEditedDoc(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 text-gray-300 focus:ring-cyan-400 focus:border-cyan-400"
                rows={20}
              />
            ) : (
              <div className="prose prose-invert prose-p:text-gray-300 max-w-none whitespace-pre-wrap">
                  {document}
              </div>
            )}
        </Section>
    );
};


export const OutputDisplay: React.FC<OutputDisplayProps> = ({
  generatedAssets,
  onScriptSave,
  onOutlineSave,
  onBtsSave,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('script');

    // When new assets are generated via the main button, switch back to the first tab.
    useEffect(() => {
        setActiveTab('script');
    }, [generatedAssets.script, generatedAssets.characters, generatedAssets.visualOutline, generatedAssets.referenceImages, generatedAssets.btsDocument]);


    const renderContent = () => {
        switch (activeTab) {
            case 'script':
                return <ScriptPanel script={generatedAssets.script} characters={generatedAssets.characters} onSave={onScriptSave} />;
            case 'outline':
                return <OutlinePanel outline={generatedAssets.visualOutline} />;
            case 'images':
                return <ImagesPanel images={generatedAssets.referenceImages} />;
            case 'bts':
                return <BtsPanel document={generatedAssets.btsDocument} onSave={onBtsSave} />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex border-b border-white/10 mb-6 space-x-2">
                <TabButton isActive={activeTab === 'script'} onClick={() => setActiveTab('script')} icon={<ScriptIcon />}>Script & Characters</TabButton>
                <TabButton isActive={activeTab === 'outline'} onClick={() => setActiveTab('outline')} icon={<OutlineIcon />}>Visual Outline</TabButton>
                <TabButton isActive={activeTab === 'images'} onClick={() => setActiveTab('images')} icon={<ImagesIcon />}>Reference Images</TabButton>
                <TabButton isActive={activeTab === 'bts'} onClick={() => setActiveTab('bts')} icon={<BtsIcon />}>BTS Document</TabButton>
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
}
