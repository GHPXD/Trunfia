// src/services/gameStateListener.ts

import { ref, onValue, off, set } from 'firebase/database';
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

  const gameStateRef = ref(database, `${ROOMS_PATH}/${roomId}/gameState`);
  await set(gameStateRef, initialGameState);
};