export type EmotionalArcIntensity = 'subtle' | 'moderate' | 'intense';

export interface ReferenceImage {
  title: string;
  imageUrl: string;
}

export interface GeneratedAssets {
  script: string;
  visualOutline: string;
  referenceImages: ReferenceImage[];
}
