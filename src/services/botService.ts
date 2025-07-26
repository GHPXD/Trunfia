// src/services/botService.ts

import { ref, update, get, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { Card, Player } from '../types';
import { EMOJI_AVATARS } from '../constants';
import { playCard, selectAttribute } from './gameService';

const ROOMS_PATH = 'rooms';

// Gera um nome de bot único
const generateBotName = (): string => {
  const adjectives = ['Rápido', 'Astuto', 'Sábio', 'Corajoso', 'Furtivo'];
  const nouns = ['Lobo', 'Falcão', 'Robô', 'Ninja', 'Mago'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
};

export const getBotPlayers = (players: { [key: string]: Player }): Player[] => {
  return Object.values(players).filter(p => p.isBot);
};

export const addBotToRoom = async (roomId: string): Promise<string> => {
  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    throw new Error('Sala não encontrada para adicionar bot.');
  }

  const botName = generateBotName();
  const botAvatar = EMOJI_AVATARS[Math.floor(Math.random() * EMOJI_AVATARS.length)];
  const newBot: Player = {
    nickname: botName,
    avatar: botAvatar,
    isHost: false,
    joinedAt: new Date().toISOString(),
    isReady: true, // Bots estão sempre prontos
    isBot: true,
    botDifficulty: 'medium',
    status: 'active',
  };

  await update(ref(database, `${ROOMS_PATH}/${roomId}/players`), {
    [botName]: newBot,
  });
  return botName;
};

export const removeBotFromRoom = async (roomId: string, botName: string): Promise<void> => {
  const botRef = ref(database, `${ROOMS_PATH}/${roomId}/players/${botName}`);
  await remove(botRef);
};

// Ação de um bot para jogar uma carta (se for o jogador atual)
export const executeBotTurn = async (
  roomId: string,
  botNickname: string,
  card: Card,
  attribute: string
): Promise<void> => {
  const updates = {
    [`${ROOMS_PATH}/${roomId}/gameState/currentRoundCards/${botNickname}`]: card.id,
    [`${ROOMS_PATH}/${roomId}/gameState/selectedAttribute`]: attribute,
  };
  await update(ref(database), updates);
};