export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  isBot?: boolean;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'ai-summary' | 'system' | 'audio';
  metadata?: {
    originalText?: string;
    summary?: string;
  };
  translatedText?: string;
  isTranslating?: boolean;
  isPlayingAudio?: boolean;
  audioUrl?: string;
  reactions?: Reaction[];
}

export interface Chat {
  id:string;
  participants: string[];
  messages: Message[];
  unreadCount: number;
}