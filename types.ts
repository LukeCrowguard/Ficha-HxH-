export enum NenType {
  Enhancer = 'Reforço',
  Transmuter = 'Transformação',
  Emitter = 'Emissão',
  Conjurer = 'Materialização',
  Manipulator = 'Manipulação',
  Specialist = 'Especialização',
}

export interface Attributes {
  strength: number; // Força
  constitution: number; // Constituição
  intelligence: number; // Inteligência
  charisma: number; // Carisma
  determination: number; // Determinação
  prestidigitation: number; // Prestidigitação (Dex/Agi)
}

export type SkillCategory = 'Hatsu' | 'Combat' | 'Weapon';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory; // New: Categorization
  type: 'Passive' | 'Active' | 'Bonus' | 'Reaction';
  cost?: number; // Nen cost
  description: string;
  damageDice?: string; // e.g., "1d8"
  attributeScaling?: keyof Attributes; // e.g., 'determination'
  imageUrl?: string; // New: Ability icon/image
}

export interface MiniCharacter {
  id: string;
  name: string;
  avatarUrl?: string; // New: Summon avatar
  type: string; // e.g., "Besta de Nen", "Clone", "Item Invocado"
  currentHp: number;
  maxHp: number;
  currentNen: number;
  maxNen: number;
  attributes: Attributes; // New: Summons have attributes too
  description: string;
  skills: Skill[]; // New: Summons can have skills
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Character {
  id: string; // Unique Identifier for multi-char support
  name: string;
  nickname: string;
  avatarUrl: string;
  age: number;
  nationality: string;
  height: string;
  weight: string;
  alignment: string;
  bio: string;
  hunterLevel: number;
  xp: number;
  maxXp: number;
  nenType: NenType;
  
  maxHp: number;
  currentHp: number;
  maxNen: number;
  currentNen: number;
  ca: number; // Armor Class
  
  attributes: Attributes;
  skills: Skill[];
  inventory: InventoryItem[];
  summons: MiniCharacter[];
  conditions: string[];
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'damage' | 'heal' | 'cost';
  timestamp: Date;
}