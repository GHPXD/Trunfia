// src/components/game/ArenaCard.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

interface ArenaCardProps {
  card: Card;
  isWinner: boolean;
  selectedAttribute?: string;
  isRoundEnding: boolean;
  onAnimationComplete: () => void;
  index: number;
  totalCards: number;
}

const ArenaCard: React.FC<ArenaCardProps> = ({
  card,
  isWinner,
  selectedAttribute,
  isRoundEnding,
  onAnimationComplete,
  index,
  totalCards
}) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Animação de entrada da carta
  useEffect(() => {
    // Reseta para o estado inicial para re-animar em novas rodadas
    scale.value = 0.5;
    opacity.value = 0;
    translateY.value = 0;
    
    // Anima a entrada
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withSpring(1);
  }, [card.id]); // A `key` no componente pai já garante a recriação, mas isso adiciona robustez

  // Animação de fim de rodada
  useEffect(() => {
    if (isRoundEnding) {
      // 1. Destaque da carta vencedora
      if (isWinner) {
        scale.value = withSequence(
          withDelay(200, withTiming(1.15, { duration: 300 })),
          withTiming(1, { duration: 500 })
        );
      }

      // 2. Animação de coleta (voar para baixo)
      translateY.value = withDelay(1200, withTiming(800, {
        duration: 500,
        easing: Easing.inOut(Easing.ease)
      }));
      
      // 3. Apenas a última carta sinaliza o fim da animação para evitar múltiplas chamadas
      if (index === totalCards - 1) {
        setTimeout(() => {
            runOnJS(onAnimationComplete)();
        }, 1800); // (1200ms de delay) + (500ms de animação) + (100ms de margem)
      }
    }
  }, [isRoundEnding]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
        { scale: scale.value },
        { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
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
  winnerHighlight: {
    shadowColor: '#FFD700',
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
    borderRadius: 12,
  },
});

export default ArenaCard;