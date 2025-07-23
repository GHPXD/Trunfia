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
    <View style={[
        styles.arenaContainer,
        orientation === 'PORTRAIT' 
            ? styles.arenaContainer_PORTRAIT
            : isComparingOrEnding
                ? styles.arenaContainer_LANDSCAPE_Comparing // Estilo de comparação em paisagem
                : styles.arenaContainer_LANDSCAPE, // Estilo padrão em paisagem
    ]}>
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
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    zIndex: 5,
    paddingHorizontal: 16,
  },
  arenaContainer_PORTRAIT: {
    top: '40%',
    justifyContent: 'center',
  },
  arenaContainer_LANDSCAPE: {
    top: '35%',
    justifyContent: 'center',
  },
  arenaContainer_LANDSCAPE_Comparing: {
    top: '15%',
    justifyContent: 'space-around',
    alignItems: 'center',
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