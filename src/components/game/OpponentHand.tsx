// src/components/game/OpponentHand.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OpponentHandProps {
  cardCount: number;
}

const OpponentHand: React.FC<OpponentHandProps> = ({ cardCount }) => {
  const cards = Array.from({ length: Math.min(cardCount, 5) }); // Mostra no máximo 5 cartas para não poluir

  return (
    <View style={styles.handContainer}>
      {cards.map((_, index) => {
        const rotation = -20 + index * 10;
        return (
          <View
            key={index}
            style={[
              styles.card,
              {
                transform: [{ rotate: `${rotation}deg` }],
                marginLeft: index > 0 ? -30 : 0,
              },
            ]}
          />
        );
      })}
      <View style={styles.cardCountContainer}>
        <Text style={styles.cardCountText}>{cardCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  handContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 45,
    height: 65,
    backgroundColor: '#333',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardCountContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardCountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default OpponentHand;