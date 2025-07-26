// src/components/game/TurnIndicator.tsx

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Coordinates } from '../../contexts/AnimationCoordinateContext';
import { Orientation } from '../../hooks/useOrientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TurnIndicatorProps {
  currentPlayer: string | null;
  coordinates: Coordinates;
  orientation: Orientation;
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentPlayer,
  coordinates,
  orientation,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentPlayer && coordinates[currentPlayer]) {
      const playerLayout = coordinates[currentPlayer];
      if (!playerLayout) return;

      // Calcula a posição de destino com base na orientação e posição do jogador
      let targetX = playerLayout.x + playerLayout.width / 2;
      let targetY = playerLayout.y;

      if (orientation === 'PORTRAIT') {
        targetY += playerLayout.height + 55; // Posiciona abaixo do nome
      } else {
        // Ajuste para paisagem
        targetY += playerLayout.height / 2 + 25;
        if (targetX < screenWidth / 2) { // Jogador à esquerda
          targetX += playerLayout.width / 2 + 40;
        } else { // Jogador à direita
          targetX -= playerLayout.width / 2 + 40;
        }
      }

      translateX.value = withSpring(targetX, { damping: 15, stiffness: 100 });
      translateY.value = withSpring(targetY, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1);
    } else {
      opacity.value = withTiming(0);
    }
  }, [currentPlayer, coordinates, orientation, translateX, translateY, opacity]);

  // Animação pulsante para chamar atenção
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: -10, // Ajusta o ponto de origem da animação
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 99,
  },
});

export default TurnIndicator;