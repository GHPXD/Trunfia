// src/components/game/AnimatedHand.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';
import playSound from '../../services/soundService'; // 1. Importar o serviço de som
import Carta from './Carta';
import { Card } from '../../types';
import { useOrientation, Orientation } from '../../hooks/useOrientation';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.5;

// Componente para uma única carta animada
const AnimatedHandCard: React.FC<{
  card: Card;
  index: number;
  totalCards: number;
  onSelectCard: (card: Card) => void;
  hasPlayedCard: boolean;
  isFirstRound: boolean;
  isVisible: boolean;
  orientation: Orientation;
}> = ({ card, index, totalCards, onSelectCard, hasPlayedCard, isFirstRound, isVisible, orientation }) => {
  const { width, height } = Dimensions.get('window');

  // --- Algoritmo de Layout Responsivo ---
  const MAX_WIDTH_PERCENTAGE = orientation === 'LANDSCAPE' ? 0.6 : 0.95;
  const CARD_WIDTH_NORMAL = width * (orientation === 'LANDSCAPE' ? 0.25 : 0.45);
  const CARD_WIDTH_MAX = width / (orientation === 'LANDSCAPE' ? 8 : 6);

  const totalSpacedWidth = totalCards * (CARD_WIDTH_MAX / 1.5);
  const availableWidth = width * MAX_WIDTH_PERCENTAGE;
  
  const overlap = totalSpacedWidth > availableWidth
    ? (totalSpacedWidth - availableWidth) / (totalCards - 1)
    : -15;

  const cardWidth = Math.min(CARD_WIDTH_NORMAL, CARD_WIDTH_MAX + overlap * 2);

  const positionRatio = totalCards > 1 ? (index / (totalCards - 1)) - 0.5 : 0;
  
  const targetTranslateX = positionRatio * (totalSpacedWidth - overlap * (totalCards - 1));
  const targetRotation = positionRatio * (orientation === 'LANDSCAPE' ? 40 : 60);
  const targetTranslateY = Math.abs(positionRatio) * -50;
  
  const initialX = isFirstRound ? 0 : targetTranslateX;
  const initialY = isFirstRound ? -height : targetTranslateY;
  const initialRotation = isFirstRound ? 180 : targetRotation;

  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(index);
  const rotation = useSharedValue(initialRotation);
  const handVisibleY = useSharedValue(isVisible ? 0 : height);

  useEffect(() => {
    handVisibleY.value = withSpring(isVisible ? 0 : height, { damping: 18, stiffness: 150 });
  }, [isVisible]);

  useEffect(() => {
    if (isFirstRound) {
        const delay = 500 + index * 100;
        translateX.value = withDelay(delay, withSpring(targetTranslateX));
        translateY.value = withDelay(delay, withSpring(targetTranslateY));
        rotation.value = withDelay(delay, withSpring(targetRotation));
    }
  }, []);

  const gestureContext = useSharedValue({ x: 0, y: 0 });

  // 1. Definir uma configuração de mola (spring) mais refinada
  const springConfig = {
    damping: 15,
    stiffness: 120,
    mass: 1,
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(HapticFeedback.trigger)('impactLight');
      runOnJS(playSound)('SELECT');
      gestureContext.value = { x: translateX.value, y: translateY.value };
      scale.value = withSpring(1.2, springConfig);
      zIndex.value = withTiming(100);
      rotation.value = withTiming(0);
    })
    .onUpdate((event) => {
      translateX.value = gestureContext.value.x + event.translationX;
      translateY.value = gestureContext.value.y + event.translationY;
    })
    .onEnd(() => {
      if (translateY.value < -height * 0.2) {
        // A carta foi "jogada"
        runOnJS(playSound)('PLAY');
        runOnJS(onSelectCard)(card);
      } else {
        // 2. Usar a nova configuração para um retorno suave à mão
        translateX.value = withSpring(targetTranslateX, springConfig);
        translateY.value = withSpring(targetTranslateY, springConfig);
        scale.value = withSpring(1, springConfig);
        zIndex.value = withTiming(index);
        rotation.value = withSpring(targetRotation, springConfig);
      }
    })
    .enabled(!hasPlayedCard);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      zIndex: zIndex.value,
      width: cardWidth,
      height: cardWidth * CARD_ASPECT_RATIO,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + handVisibleY.value },
        { rotate: `${rotation.value}deg` },
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
          isAttributeSelectable={false}
        />
      </Animated.View>
    </GestureDetector>
  );
};

// Componente principal da mão
interface AnimatedHandProps {
  cards: Card[];
  onSelectCard: (card: Card) => void;
  hasPlayedCard: boolean;
  isFirstRound: boolean;
  isVisible: boolean;
}

const AnimatedHand: React.FC<AnimatedHandProps> = ({ cards, onSelectCard, hasPlayedCard, isFirstRound, isVisible }) => {
  const orientation = useOrientation();

  return (
    <View 
        style={[
            styles.container, 
            orientation === 'LANDSCAPE' ? styles.container_LANDSCAPE : styles.container_PORTRAIT
        ]} 
        pointerEvents="box-none"
    >
      {cards.map((card, index) => (
        <AnimatedHandCard
          key={card.id}
          card={card}
          index={index}
          totalCards={cards.length}
          onSelectCard={onSelectCard}
          hasPlayedCard={hasPlayedCard}
          isFirstRound={isFirstRound}
          isVisible={isVisible}
          orientation={orientation}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container_PORTRAIT: {
    bottom: 0,
    left: 0,
    right: 0,
  },
  container_LANDSCAPE: {
    bottom: -30,
    width: '60%',
    alignSelf: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
});

export default AnimatedHand;