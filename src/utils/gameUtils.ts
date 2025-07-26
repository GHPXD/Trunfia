// src/utils/gameUtils.ts

import { Card, RoundResult } from '../types';
import { shuffleArray as customShuffle } from './shuffle';

export const shuffleArray = customShuffle;

// ... (resto do arquivo sem alterações)
export const distributeCards = (
  cards: Card[],
  players: string[]
): { [key: string]: string[] } => {
  const shuffledCards = shuffleArray([...cards]);
  const hands: { [key: string]: string[] } = {};
  players.forEach(p => (hands[p] = []));

  const cardsPerPlayer = Math.floor(shuffledCards.length / players.length);
  for (let i = 0; i < cardsPerPlayer * players.length; i++) {
    hands[players[i % players.length]].push(shuffledCards[i].id);
  }
  return hands;
};

export const compareCards = (
  roundCards: { [key: string]: string },
  attribute: string,
  allCards: Card[]
): RoundResult => {
  const results: RoundResult['playerCards'] = {};
  let winners: string[] = [];
  let bestValue: number | null = null;
  const lowerIsBetter = attribute === 'Fundação';

  Object.entries(roundCards).forEach(([player, cardId]) => {
    const card = allCards.find(c => c.id === cardId);
    if (card) {
      const value = card.attributes[attribute];
      results[player] = { cardId, value };

      if (bestValue === null) {
        bestValue = value;
        winners = [player];
      } else if (lowerIsBetter ? value < bestValue : value > bestValue) {
        bestValue = value;
        winners = [player];
      } else if (value === bestValue) {
        winners.push(player);
      }
    }
  });

  return { winners, playerCards: results, selectedAttribute: attribute };
};


export const checkGameEnd = (
  playerCards: { [key: string]: string[] }
): string | null => {
  const activePlayers = Object.values(playerCards).filter(hand => hand.length > 0);
  if (activePlayers.length === 1) {
    const winnerNickname = Object.keys(playerCards).find(
      p => playerCards[p].length > 0
    );
    return winnerNickname || null;
  }
  return null;
};

export const getNextPlayer = (
    currentPlayer: string,
    players: { [key: string]: { status?: 'active' | 'eliminated' } }
  ): string => {
    const playerNicknames = Object.keys(players);
    const activePlayers = playerNicknames.filter(p => players[p].status !== 'eliminated');
    const currentIndex = activePlayers.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex];
  };

export const formatAttributeValue = (
  attribute: string,
  value: number
): string => {
  return value.toLocaleString('pt-BR');
};