// src/hooks/usePlayerHand.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Card } from '../types';
import { playCard, selectAttribute } from '../services/gameService';

interface UsePlayerHandProps {
  roomId: string;
  playerNickname: string;
  isCurrentPlayer: boolean;
  hasPlayedCard: boolean;
}

export const usePlayerHand = ({
  roomId,
  playerNickname,
  isCurrentPlayer,
  hasPlayedCard,
}: UsePlayerHandProps) => {
  const [cardToConfirm, setCardToConfirm] = useState<Card | null>(null);
  const [tentativeAttribute, setTentativeAttribute] = useState<string | null>(null);

  const handleCardSelection = useCallback((card: Card) => {
    if (hasPlayedCard) return;
    if (isCurrentPlayer) {
      setCardToConfirm(card);
    } else {
      playCard(roomId, playerNickname, card.id).catch((error: any) => {
        Alert.alert('Erro de Conexão', error.message || 'Não foi possível registrar sua jogada.');
      });
    }
  }, [hasPlayedCard, isCurrentPlayer, roomId, playerNickname]);

  // Esta função não recebe argumentos, ela usa seu próprio estado interno
  const handleConfirmTurn = useCallback(() => {
    if (!cardToConfirm || !isCurrentPlayer) return;
    if (!tentativeAttribute) {
      Alert.alert('Atenção', 'Você deve escolher um atributo para jogar.');
      return;
    }

    const playedCardId = cardToConfirm.id;
    const playedAttribute = tentativeAttribute;
    
    setCardToConfirm(null);
    setTentativeAttribute(null);

    Promise.all([
      playCard(roomId, playerNickname, playedCardId),
      selectAttribute(roomId, playedAttribute)
    ]).catch((error: any) => {
      Alert.alert('Erro de Conexão', error.message || 'Não foi possível confirmar a jogada.');
    });
  }, [cardToConfirm, isCurrentPlayer, tentativeAttribute, roomId, playerNickname]);

  const resetHandState = useCallback(() => {
      setCardToConfirm(null);
      setTentativeAttribute(null);
  }, []);

  return {
    cardToConfirm,
    tentativeAttribute,
    setTentativeAttribute,
    handleCardSelection,
    handleConfirmTurn, // Exportando a função com o nome correto
    resetHandState,
  };
};