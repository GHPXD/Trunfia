// src/hooks/useGameUpdates.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { GameState, Card, Room, RootStackParamList } from '../types';
import { processRoundResult, startNextRound } from '../services/gameService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Hook customizado para obter o valor anterior
function usePrevious(value: GameState | null) {
  const ref = useRef<GameState | null>(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface UseGameUpdatesProps {
  gameState: GameState | null;
  roomId: string;
  playerNickname: string;
  allCards: Card[];
  currentRoom: Room | null;
  resetHandState: () => void;
}

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

export const useGameUpdates = ({
  gameState,
  roomId,
  playerNickname,
  allCards,
  currentRoom,
  resetHandState,
}: UseGameUpdatesProps) => {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const isProcessingRound = useRef(false);
  const [isRoundEnding, setIsRoundEnding] = useState(false);
  const [animatingOpponentCard, setAnimatingOpponentCard] = useState<{ card: Card; nickname: string } | null>(null);
  const prevGameState = usePrevious(gameState);

  const isHost = currentRoom?.hostNickname === playerNickname;

  const handleNextRound = useCallback(async () => {
    // Apenas o host pode iniciar a próxima rodada para evitar múltiplas chamadas
    if (!isHost) return;
    try {
      await startNextRound(roomId);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a próxima rodada.');
    }
  }, [roomId, isHost]);

  const onAnimationComplete = useCallback(() => {
    setIsRoundEnding(false);
    // Após a animação, o cliente do host inicia a próxima rodada
    if (isHost) {
      handleNextRound();
    }
  }, [isHost, handleNextRound]);

  useEffect(() => {
    if (!gameState || !prevGameState || !currentRoom) return;

    // Reseta a mão quando uma nova rodada começa
    if (gameState.gamePhase === 'selecting' && prevGameState.gamePhase !== 'selecting') {
      resetHandState();
    }

    // Anima a carta do oponente quando ela é jogada
    if (gameState.currentRoundCards) {
      const prevCards = Object.keys(prevGameState?.currentRoundCards || {});
      const currentCards = Object.keys(gameState.currentRoundCards);
      const newPlayerCard = currentCards.find(
        p => !prevCards.includes(p) && p !== playerNickname
      );

      if (newPlayerCard) {
        const cardId = gameState.currentRoundCards[newPlayerCard];
        const card = allCards.find(c => c.id === cardId);
        if (card) {
          setAnimatingOpponentCard({ card, nickname: newPlayerCard });
        }
      }
    }

    // Processa o resultado da rodada
    if (gameState.gamePhase === 'revealing' && !isProcessingRound.current) {
      const activePlayersCount = Object.values(currentRoom.players).filter(
        p => p.status === 'active'
      ).length;

      if (
        Object.keys(gameState.currentRoundCards).length === activePlayersCount &&
        gameState.selectedAttribute
      ) {
        isProcessingRound.current = true;
        setTimeout(() => {
          processRoundResult(roomId, gameState, allCards).finally(() => {
            isProcessingRound.current = false;
          });
        }, 1000);
      }
    }

    // Lida com o fim da rodada e do jogo
    if (gameState.gamePhase === 'comparing' && !isRoundEnding) {
      if (gameState.gameWinner) {
        Alert.alert(
          'Fim de Jogo!',
          `O vencedor é ${gameState.gameWinner}!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setIsRoundEnding(true);
      }
    }
  }, [gameState, allCards, currentRoom, isRoundEnding, navigation, playerNickname, prevGameState, resetHandState, roomId]);

  const clearAnimatingOpponentCard = () => {
      setAnimatingOpponentCard(null);
  };

  return {
    isRoundEnding,
    animatingOpponentCard,
    onAnimationComplete,
    clearAnimatingOpponentCard,
  };
};