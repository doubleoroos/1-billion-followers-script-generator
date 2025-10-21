import type {  } from "@google/genai";

export type EmotionalArcIntensity = 'subtle' | 'moderate' | 'intense';
export type VisualStyle = 'cinematic' | 'solarpunk' | 'minimalist' | 'biomorphic';
export type NarrativeTone = 'poetic' | 'philosophical' | 'hopeful' | 'intimate';

export interface ReferenceImage {
  title: string;
  imageUrl: string;
}

export interface Character {
  id: string;
  name: string;
}

export interface ScriptBlock {
  id: string;
  type: 'narration' | 'dialogue';
  characterId?: string;
  content: string;
}

export interface GeneratedAssets {
  script: ScriptBlock[];
  characters: Character[];
  visualOutline: string;
  referenceImages: ReferenceImage[];
  btsDocument: string;
}