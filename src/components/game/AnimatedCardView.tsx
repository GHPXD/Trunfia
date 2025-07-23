// src/components/game/AnimatedCardView.tsx
import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Carta from './Carta';
import { Card } from '../../types';

interface AnimatedCardViewProps {
  card: Card;
  index: number;
  totalCards: number;
  onPlayCard: (card: Card) => void;
  onAttributeSelect: (attribute: string) => void;
  isCurrentPlayer: boolean;
  hasPlayedCard: boolean;
}

const { width, height } = Dimensions.get('window');

const AnimatedCardView: React.FC<AnimatedCardViewProps> = ({
  card,
  index,
  totalCards,
  onPlayCard,
  onAttributeSelect,
  isCurrentPlayer,
  hasPlayedCard,
}) => {
  // Hooks de animação para posição e escala
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(index);

  // Contexto para o gesto de arrastar
  const gestureContext = useSharedValue({ x: 0, y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      gestureContext.value = { x: translateX.value, y: translateY.value };
      scale.value = withSpring(1.15); // Aumenta a carta ao tocar
      zIndex.value = withTiming(100); // Traz a carta para frente
    })
    .onUpdate((event) => {
      translateX.value = gestureContext.value.x + event.translationX;
      translateY.value = gestureContext.value.y + event.translationY;
    })
    .onEnd(() => {
      // Se a carta foi arrastada para cima (área da arena)
      if (translateY.value < -height * 0.2) {
        // Animação para fora da tela, simulando a carta sendo "jogada"
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(-height, { duration: 300 });
        scale.value = withTiming(0.5, {}, (isFinished) => {
          if (isFinished) {
            // Executa a lógica do jogo DEPOIS que a animação terminar
            runOnJS(onPlayCard)(card);
          }
        });
      } else {
        // Se não foi jogada, retorna suavemente para a posição na mão
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        zIndex.value = withTiming(index);
      }
    })
    .enabled(!hasPlayedCard); // O gesto só é habilitado se o jogador ainda não jogou

  // Lógica para dispor as cartas em leque
  const fanAngle = Math.min(totalCards * 12, 100);
  const anglePerCard = totalCards > 1 ? fanAngle / (totalCards - 1) : 0;
  const startAngle = -fanAngle / 2;
  const rotation = startAngle + index * anglePerCard;
  const initialTranslateY = Math.abs(rotation) * 0.8;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      zIndex: zIndex.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + initialTranslateY },
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <Carta
          card={card}
          isRevealed={true}
          isSelected={false}
          isSelectable={!hasPlayedCard}
          isAttributeSelectable={isCurrentPlayer && !hasPlayedCard}
          onAttributeSelect={onAttributeSelect}
          // onSelect não é mais necessário aqui, o gesto controla a ação
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'absolute',
  },
});

export default AnimatedCardView;