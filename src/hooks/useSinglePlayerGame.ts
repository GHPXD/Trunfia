// src/hooks/useSinglePlayerGame.ts

import { useState, useEffect, useCallback, useReducer } from 'react';
import { Card, GameState, Player, BotDifficulty, RoundResult } from '../types';
import { getDeckCards } from '../data/decks';
import { useGame } from '../contexts/GameContext';
import { distributeCards, compareCards, checkGameEnd } from '../utils/gameUtils';
import { selectBotMove } from '../utils/botUtils';

type GameAction =
  | { type: 'START_GAME'; players: Player[]; allCards: Card[] }
  | { type: 'SET_PLAYER_CHOICE'; card: Card; attribute: string; allCards: Card[]; botDifficulty: BotDifficulty }
  | { type: 'PROCESS_RESULT'; result: RoundResult; roundCards: { [key: string]: string } }
  | { type: 'START_NEXT_ROUND' };

const initialGameState: GameState = {
  currentRound: 0,
  currentPlayer: '',
  gamePhase: 'selecting',
  playerCards: {},
  currentRoundCards: {},
  selectedAttribute: null,
  roundWinner: null,
  gameWinner: null,
  roundHistory: [],
  tiePot: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      const distributed = distributeCards(action.allCards, action.players.map(p => p.nickname));
      return {
        ...initialGameState,
        currentRound: 1,
        gamePhase: 'selecting',
        playerCards: distributed,
        currentPlayer: action.players[0].nickname,
      };

    case 'PROCESS_RESULT':
      const { result, roundCards } = action;
      const isTie = result.winners.length > 1;
      const updatedPlayerCards = { ...state.playerCards };
      const currentPot = state.tiePot || [];
      const cardsInPlay = Object.values(roundCards);

      if (isTie) {
        return {
          ...state,
          gamePhase: 'tie',
          roundWinner: null,
          tiePot: [...currentPot, ...cardsInPlay],
          currentPlayer: state.currentPlayer, // O mesmo jogador joga novamente
        };
      } else {
        const winner = result.winners[0];
        const cardsToAward = [...cardsInPlay, ...currentPot];
        updatedPlayerCards[winner] = [...updatedPlayerCards[winner], ...cardsToAward];
        
        Object.keys(roundCards).forEach(player => {
            const cardPlayed = roundCards[player];
            updatedPlayerCards[player] = updatedPlayerCards[player].filter(c => c !== cardPlayed);
        });

        return {
          ...state,
          gamePhase: 'comparing',
          roundWinner: winner,
          playerCards: updatedPlayerCards,
          tiePot: [],
        };
      }

    case 'START_NEXT_ROUND':
      const gameWinner = checkGameEnd(state.playerCards);
      if (gameWinner) {
        return { ...state, gamePhase: 'finished', gameWinner };
      }
      return {
        ...state,
        currentRound: state.currentRound + 1,
        gamePhase: 'selecting',
        currentPlayer: state.roundWinner || state.currentPlayer,
        currentRoundCards: {},
        selectedAttribute: null,
        roundWinner: null,
      };

    default:
      return state;
  }
}

export const useSinglePlayerGame = (
    deckId: string, 
    botDifficulty: BotDifficulty
) => {
  const { state: globalState } = useGame();
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    const cards = getDeckCards(deckId);
    setAllCards(cards);
  }, [deckId]);

  useEffect(() => {
    if (allCards.length > 0) {
      const humanPlayer: Player = { nickname: globalState.playerNickname, avatar: globalState.playerAvatar || '👤', isHost: true, isReady: true, joinedAt: '', status: 'active' };
      const botPlayer: Player = { nickname: 'Bot', avatar: '🤖', isHost: false, isReady: true, joinedAt: '', status: 'active', isBot: true, botDifficulty };
      dispatch({ type: 'START_GAME', players: [humanPlayer, botPlayer], allCards });
    }
  }, [allCards, globalState.playerNickname, globalState.playerAvatar, botDifficulty]);

  const handlePlayerTurn = useCallback((card: Card, attribute: string) => {
    const botHandIds = gameState.playerCards['Bot'];
    if (!botHandIds) return;
    const botHand = botHandIds.map(id => allCards.find(c => c.id === id)).filter(Boolean) as Card[];
    
    const botMove = selectBotMove(botHand, gameState, allCards, botDifficulty);
    const playerCardId = card.id;

    if (botMove) {
      const roundCards = {
          [globalState.playerNickname]: playerCardId,
          'Bot': botMove.card.id
      };

      const result = compareCards(roundCards, attribute, allCards);
      setRoundResult(result);
      dispatch({ type: 'PROCESS_RESULT', result, roundCards });
    }
  }, [allCards, gameState, globalState.playerNickname, botDifficulty]);

  const startNextRound = useCallback(() => {
    setRoundResult(null);
    dispatch({ type: 'START_NEXT_ROUND' });
  }, []);

  return { gameState, handlePlayerTurn, roundResult, startNextRound, allCards };
};