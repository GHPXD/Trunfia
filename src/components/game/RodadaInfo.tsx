// src/components/game/RodadaInfo.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState } from '../../types';

interface RodadaInfoProps {
  gameState: GameState;
  playerNickname: string;
}

const RodadaInfo: React.FC<RodadaInfoProps> = ({ gameState, playerNickname }) => {
  const isCurrentPlayer = gameState.currentPlayer === playerNickname;

  return (
    <View style={styles.container}>
      <Text style={styles.roundText}>
        Rodada {gameState.currentRound}
      </Text>
      <View style={styles.divider} />
      <Text style={[styles.playerText, isCurrentPlayer && styles.isYou]}>
        Vez de: {gameState.currentPlayer}
        {isCurrentPlayer && ' (Você)'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  roundText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  playerText: {
    fontSize: 14,
    color: '#DDD',
  },
  isYou: {
    color: '#FFD700', // Dourado para destacar
    fontWeight: 'bold',
  },
});

export default RodadaInfo;