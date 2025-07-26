// src/services/gameService.ts

import { ref, update, get } from 'firebase/database';
import { database } from '../config/firebase';
import { GameState, Card, Room } from '../types';
import {
  compareCards,
  checkGameEnd,
} from '../utils/gameUtils';
import { listenToGameState, startGame } from './gameStateListener';

const ROOMS_PATH = 'rooms';

export { listenToGameState, startGame };

export const playCard = async (
  roomId: string,
  playerNickname: string,
  cardId: string
): Promise<void> => {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) return;
    const room: Room = roomSnapshot.val();

    const activePlayers = Object.values(room.players).filter(p => p.status !== 'eliminated');
    const totalActivePlayers = activePlayers.length;

    const gameRef = ref(database, `${ROOMS_PATH}/${roomId}/gameState`);
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) return;
    const gameState: GameState = gameSnapshot.val();

    const updates = {
      [`${ROOMS_PATH}/${roomId}/gameState/currentRoundCards/${playerNickname}`]: cardId,
    };
    await update(ref(database), updates);

    const updatedCards = { ...gameState.currentRoundCards, [playerNickname]: cardId };

    if (Object.keys(updatedCards).length === totalActivePlayers) {
      await update(ref(database), {
        [`${ROOMS_PATH}/${roomId}/gameState/gamePhase`]: 'revealing',
      });
    }
  } catch (error) {
    console.error('Erro ao jogar carta:', error);
    throw new Error('Não foi possível jogar a carta');
  }
};

export const selectAttribute = async (
  roomId: string,
  attribute: string
): Promise<void> => {
  try {
    await update(ref(database, `${ROOMS_PATH}/${roomId}/gameState`), {
      selectedAttribute: attribute,
    });
  } catch (error) {
    console.error('Erro ao selecionar atributo:', error);
    throw new Error('Não foi possível selecionar o atributo');
  }
};

export const processRoundResult = async (
  roomId: string,
  currentState: GameState,
  allCards: Card[]
): Promise<void> => {
  if (!currentState.selectedAttribute) {
    console.error("Atributo selecionado é nulo, não é possível processar a rodada.");
    return;
  }

  const result = compareCards(
    currentState.currentRoundCards,
    currentState.selectedAttribute,
    allCards
  );

  const updates: Partial<GameState> = {
    gamePhase: 'comparing',
  };

  if (result.winners.length > 1) {
    updates.gamePhase = 'tie';
    updates.roundWinner = null;
    const currentPot = currentState.tiePot || [];
    updates.tiePot = [...currentPot, ...Object.values(currentState.currentRoundCards)];
    updates.currentPlayer = currentState.currentPlayer;
  } else {
    const winner = result.winners[0];
    updates.roundWinner = winner;

    const cardsToAward = [
      ...Object.values(currentState.currentRoundCards),
      ...(currentState.tiePot || []),
    ];
    
    const updatedPlayerCards = { ...currentState.playerCards };
    if (!updatedPlayerCards[winner]) updatedPlayerCards[winner] = [];
    updatedPlayerCards[winner] = [...updatedPlayerCards[winner], ...cardsToAward];

    Object.keys(currentState.currentRoundCards).forEach(player => {
      const cardPlayed = currentState.currentRoundCards[player];
      if (updatedPlayerCards[player]) {
        updatedPlayerCards[player] = updatedPlayerCards[player].filter(c => c !== cardPlayed);
      }
    });

    updates.playerCards = updatedPlayerCards;
    updates.tiePot = [];
    updates.currentPlayer = winner;
  }

  if (updates.playerCards) {
    updates.gameWinner = checkGameEnd(updates.playerCards);
    if(updates.gameWinner) {
      updates.gamePhase = 'finished';
    }
  }

  const gameStateRef = ref(database, `${ROOMS_PATH}/${roomId}/gameState`);
  await update(gameStateRef, updates);
};

export const startNextRound = async (
  roomId: string,
  currentGameState: GameState
): Promise<void> => {
  const updates: Partial<GameState> = {
    gamePhase: 'selecting',
    currentRoundCards: {},
    selectedAttribute: null,
    roundWinner: null,
    currentRound: (currentGameState.currentRound || 0) + 1,
  };
  
  if(currentGameState.gamePhase !== 'tie' && currentGameState.roundWinner) {
      updates.currentPlayer = currentGameState.roundWinner;
  }

  const gameStateRef = ref(database, `${ROOMS_PATH}/${roomId}/gameState`);
  await update(gameStateRef, updates);
};