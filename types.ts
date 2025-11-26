
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
  voicePreference?: string; // 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
}

export interface ScriptBlock {
  id:string;
  type: 'narration' | 'dialogue';
  characterId?: string;
  content: string;
  audioUrl?: string;
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
  imagePrompt?: string;
  dependsOn?: string[];
  videoModel?: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16';
  videoSettingsReasoning?: string;
}

export interface GeneratedAssets {
  script: ScriptBlock[];
  characters: Character[];
  visualOutline: Scene[];
  referenceImages: ReferenceImage[];
  btsDocument: string;
}