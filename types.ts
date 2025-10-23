

export type EmotionalArcIntensity = 'subtle' | 'moderate' | 'intense';
export type VisualStyle = 'cinematic' | 'solarpunk' | 'minimalist' | 'biomorphic' | 'abstract';
export type NarrativeTone = 'poetic' | 'philosophical' | 'hopeful' | 'intimate';
export type RewriteTomorrowTheme = 'abundance' | 'ascension' | 'harmony' | 'enlightenment';

export interface ReferenceImage {
  title: string;
  imageUrl: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
}

export interface ScriptBlock {
  id:string;
  type: 'narration' | 'dialogue';
  characterId?: string;
  content: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: string;
  duration: string;
  atmosphere: string;
  charactersInScene: string;
  description: string;
  keyVisualElements: string;
  visuals: string;
  transition: string;
  pacingEmotion: string;
  videoUrl?: string;
  videoPrompt?: string;
  imageUrl?: string;
  dependsOn?: string[];
}

export interface GeneratedAssets {
  script: ScriptBlock[];
  characters: Character[];
  visualOutline: Scene[];
  referenceImages: ReferenceImage[];
  btsDocument: string;
}