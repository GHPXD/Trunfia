// src/components/game/ArenaCard.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, LayoutRectangle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Card } from '../../types';
import Carta from './Carta';
import { useAnimationCoordinates } from '../../contexts/AnimationCoordinateContext';

interface ArenaCardProps {
  card: Card;
  isWinner: boolean;
  selectedAttribute?: string;
  isRoundEnding: boolean;
  onAnimationComplete: () => void;
  index: number;
  totalCards: number;
  winnerNickname: string | null; // 1. Receber o nickname do vencedor
}

const ArenaCard: React.FC<ArenaCardProps> = ({
  card,
  isWinner,
  selectedAttribute,
  isRoundEnding,
  onAnimationComplete,
  index,
  totalCards,
  winnerNickname, // 2. Usar o nickname do vencedor
}) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0); // 3. Adicionar translateX

  const { coordinates } = useAnimationCoordinates(); // 4. Obter o mapa de coordenadas

  useEffect(() => {
    scale.value = 0.5;
    opacity.value = 0;
    translateY.value = 0;
    translateX.value = 0;
    
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withSpring(1);
  }, [card.id, scale, opacity, translateY, translateX]);

  useEffect(() => {
    if (isRoundEnding) {
      if (isWinner) {
        scale.value = withSequence(
          withDelay(200, withTiming(1.15, { duration: 300 })),
          withTiming(1, { duration: 500 })
        );
      }

      // 5. Nova lógica de animação para a coleta de cartas
      const winnerLayout = winnerNickname ? coordinates[winnerNickname] : null;

      if (winnerLayout) {
        // Pega a posição central da tela
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;

        // Calcula o destino final (posição do vencedor) relativo ao centro
        const destinationX = winnerLayout.x + (winnerLayout.width / 2) - screenCenterX;
        const destinationY = winnerLayout.y + (winnerLayout.height / 2) - screenCenterY;
        
        translateX.value = withDelay(1200 + index * 50, withTiming(destinationX, {
          duration: 500,
          easing: Easing.inOut(Easing.ease)
        }));
        translateY.value = withDelay(1200 + index * 50, withTiming(destinationY, {
          duration: 500,
          easing: Easing.inOut(Easing.ease)
        }));
        scale.value = withDelay(1200 + index * 50, withTiming(0.2, { duration: 500 }));
        opacity.value = withDelay(1700 + index * 50, withTiming(0)); // Fade out ao chegar
      } else {
        // Fallback: animação antiga se o layout do vencedor não for encontrado
        translateY.value = withDelay(1200, withTiming(800, {
          duration: 500,
          easing: Easing.inOut(Easing.ease)
        }));
      }
      
      if (index === totalCards - 1) {
        setTimeout(() => {
            runOnJS(onAnimationComplete)();
        }, 1800 + totalCards * 50); // Ajusta o tempo para a última carta terminar
      }
    }
  }, [isRoundEnding, isWinner, scale, translateY, translateX, opacity, index, totalCards, onAnimationComplete, coordinates, winnerNickname]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
    ],
    // 6. Adicionar zIndex para que a carta vencedora fique por cima
    zIndex: isWinner ? 10 : 1,
  }));

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <View style={[isWinner && isRoundEnding && styles.winnerHighlight]}>
        <Carta
          card={card}
          isRevealed={true}
          isSelected={isWinner && isRoundEnding}
          isSelectable={false}
          selectedAttribute={selectedAttribute}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // 7. Remover position absolute para que o layout do Arena funcione corretamente
  },
  winnerHighlight: {
    shadowColor: '#FFD700',
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
    borderRadius: 12,
  },
});

export default React.memo(ArenaCard);