// src/types/index.ts

export interface Deck {
  id: string;
  name: string;
  description: string;
  imageSource: any;
  totalCards: number;
  categories: string[];
}

export interface Card {
  id: string;
  name: string;
  image?: string;
  attributes: {
    [key: string]: number;
  };
  description?: string;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  nickname: string;
  avatar: string | null;
  isHost: boolean;
  joinedAt: string;
  isReady: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  status?: 'active' | 'eliminated';
  cardsCount?: number;
}

export interface Room {
  id: string;
  code: string;
  hostNickname: string;
  deckId: string;
  deckName: string;
  players: { [key: string]: Player };
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
  maxPlayers: number;
  createdAt: string;
  lastActivity: string;
  // AQUI ESTÁ A CORREÇÃO: Permitindo que gameState também seja nulo.
  gameState?: GameState | null; 
}

export interface RoundResult {
  winners: string[];
  playerCards: {
    [key: string]: {
      cardId: string;
      value: number;
    };
  };
  selectedAttribute: string;
}

export interface GameState {
  currentRound: number;
  currentPlayer: string;
  gamePhase: 'spinning' | 'selecting' | 'revealing' | 'comparing' | 'finished' | 'tie';
  playerCards: { [key: string]: string[] };
  currentRoundCards: { [key: string]: string };
  selectedAttribute: string | null;
  roundWinner: string | null;
  gameWinner: string | null;
  roundHistory: any[];
  spinResult?: string;
  botActions?: { [key: string]: any };
  tiePot?: string[];
}

export interface GameContextState {
  selectedDeck: Deck | null;
  playerNickname: string;
  playerAvatar: string | null;
  currentRoom: Room | null;
  isInRoom: boolean;
  gameCards: Card[];
  playerHand: Card[];
}

export type RootStackParamList = {
  Login: undefined;
  MainMenu: undefined;
  DeckSelection: undefined;
  SinglePlayerSetup: undefined;
  Lobby: undefined;
  Game: {
    roomId: string;
    gameMode?: 'singleplayer' | 'multiplayer';
    botDifficulty?: BotDifficulty;
  };
};

export interface User {
    nickname: string;
    avatar?: string;
    createdAt: string;
}
  
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export interface ChatMessage {
    id: string;
    nickname: string;
    message: string;
    timestamp: string;
}