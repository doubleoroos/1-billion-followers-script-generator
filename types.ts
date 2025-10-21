export type EmotionalArcIntensity = 'subtle' | 'moderate' | 'intense';
export type VisualStyle = 'cinematic' | 'solarpunk' | 'minimalist' | 'biomorphic';
export type NarrativeTone = 'poetic' | 'philosophical' | 'hopeful' | 'intimate';

export interface ReferenceImage {
  title: string;
  imageUrl: string;
}

export interface GeneratedAssets {
  script: string;
  visualOutline: string;
  referenceImages: ReferenceImage[];
  btsDocument: string;
}
