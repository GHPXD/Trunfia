// src/components/game/Arena.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState, Card } from '../../types';
import ArenaCard from './ArenaCard';
import { Orientation } from '../../hooks/useOrientation';

interface ArenaProps {
  gameState: GameState | null;
  allCards: Card[];
  isRoundEnding: boolean;
  onAnimationComplete: () => void;
  orientation: Orientation;
  animatingCardPlayer?: string;
}

const Arena: React.FC<ArenaProps> = ({ gameState, allCards, isRoundEnding, onAnimationComplete, orientation, animatingCardPlayer }) => {
  if (!gameState || !gameState.currentRoundCards || Object.keys(gameState.currentRoundCards).length === 0) {
    return null;
  }

  const roundCards = Object.entries(gameState.currentRoundCards || {});
  const isComparingOrEnding = gameState.gamePhase === 'comparing' || isRoundEnding;

  return (
    <View 
      style={[
        styles.arenaContainer,
        orientation === 'PORTRAIT' 
            ? styles.arenaContainer_PORTRAIT
            : isComparingOrEnding
                ? styles.arenaContainer_LANDSCAPE_Comparing
                : styles.arenaContainer_LANDSCAPE,
      ]}
      // 1. Usar pointerEvents para permitir toques através da Arena durante a animação
      pointerEvents="box-none"
    >
      {roundCards.map(([playerNickname, cardId], index) => {
        if (playerNickname === animatingCardPlayer) {
          return null;
        }

        const card = allCards.find(c => c.id === cardId);
        if (!card) return null;

        const isWinner = playerNickname === gameState.roundWinner;

        return (
          <View key={cardId} style={styles.cardDisplay}>
            <Text style={styles.playerNickname}>{playerNickname}</Text>
            <ArenaCard
              card={card}
              isWinner={isWinner}
              selectedAttribute={gameState.selectedAttribute || undefined}
              isRoundEnding={isRoundEnding}
              onAnimationComplete={onAnimationComplete}
              index={index}
              totalCards={roundCards.length}
              winnerNickname={gameState.roundWinner} // 2. Passar o nickname do vencedor
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  arenaContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center', // 3. Centralizar verticalmente para a animação
    justifyContent: 'center', // 4. Centralizar horizontalmente
    gap: 16,
    zIndex: 5,
    paddingHorizontal: 16,
  },
  arenaContainer_PORTRAIT: {
    // Os estilos de posicionamento agora são gerenciados pelo flexbox centralizado
  },
  arenaContainer_LANDSCAPE: {
    // Os estilos de posicionamento agora são gerenciados pelo flexbox centralizado
  },
  arenaContainer_LANDSCAPE_Comparing: {
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  cardDisplay: {
    alignItems: 'center',
  },
  playerNickname: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 14,
  },
});

export default Arena;