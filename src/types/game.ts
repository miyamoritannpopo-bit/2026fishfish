export type Subject = 'social' | 'math' | 'science';

export type SubCategory = 
  | '歴史' | '地理' | '公民'
  | '図形' | '数・計算' | '割合・比'
  | '生物' | '地学' | '化学' | '物理';

export interface LearningTerm {
  id: string;
  term: string; // e.g. "光合成", "リアス海岸", "直方体"
  reading: string; // hiragana, e.g. "こうごうせい"
  subject: Subject;
  category: SubCategory;
  grade: string; // e.g. "小5・小6" or "中1〜中3"
  definition: string; // Clear, school-standard definition
  example?: string;
  hints: string[]; // Progressive clues
  fishSpeciesId: string;
  isCustom?: boolean;
}

export type FishRarity = 1 | 2 | 3 | 4 | 5;

export interface FishSpecies {
  id: string;
  name: string; // e.g. "マダイ", "マグロ", "リュウグウノツカイ"
  scientificName: string;
  rarity: FishRarity;
  color: string;
  secondaryColor: string;
  finColor: string;
  shape: 'normal' | 'round' | 'long' | 'giant' | 'flat' | 'sparkle';
  points: number;
  description: string;
}

export interface CaughtRecord {
  termId: string;
  fishSpeciesId: string;
  caughtAt: string;
  count: number;
}

export type PlayMode = 'kanji' | 'hiragana';
export type Difficulty = 'easy' | 'normal' | 'hard';
