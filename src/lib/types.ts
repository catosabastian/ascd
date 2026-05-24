export interface Persona {
  id: string;
  username: string;
  name: string;
  occupation: string;
  avatarSeed: string;
  archetypeLabel: string;
  emotionalBehavior: string;
  backstory: string;
}

export interface Comment {
  id: string;
  personaId: string;
  content: string;
  replyToId: string | null;
  parentId: string | null;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'SARCASTIC' | 'ANGRY';
  toxicity: number;
  likes: number;
  dislikes: number;
  timestampOffset: number;
  orderIndex: number;
  opinionShifted?: boolean;
  opinionBefore?: string | null;
  opinionAfter?: string | null;
  persona?: Persona;
}
