// src/services/gameStateListener.ts

import { ref, onValue, off, update } from 'firebase/database'; // Alterado de 'set' para 'update'
import { database } from '../config/firebase';
import { GameState, Card } from '../types';
import { distributeCards } from '../utils/gameUtils';

const ROOMS_PATH = 'rooms';

export const listenToGameState = (
  roomId: string,
  callback: (gameState: GameState | null) => void
): (() => void) => {
  const gameStateRef = ref(database, `${ROOMS_PATH}/${roomId}/gameState`);
  const unsubscribe = onValue(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(gameStateRef, 'value', unsubscribe);
};

export const startGame = async (
  roomId: string,
  players: string[],
  allCards: Card[]
): Promise<void> => {
  const initialGameState: GameState = {
    currentRound: 1,
    currentPlayer: players[0],
    gamePhase: 'selecting',
    playerCards: distributeCards(allCards, players),
    currentRoundCards: {},
    selectedAttribute: null,
    roundWinner: null,
    gameWinner: null,
    roundHistory: [],
    tiePot: [],
  };

  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  
  // AQUI ESTÁ A CORREÇÃO:
  // Atualizamos o status e o gameState na mesma operação.
  await update(roomRef, {
    status: 'playing',
    gameState: initialGameState,
  });
};