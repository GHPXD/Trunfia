// src/components/game/AnimatedResultCard.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface AnimatedResultCardProps {
  index: number;
  isWinner: boolean;
  startAnimation: boolean;
}

const { height } = Dimensions.get('window');

const AnimatedResultCard: React.FC<AnimatedResultCardProps> = ({ index, isWinner, startAnimation }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (startAnimation) {
      const animationDelay = 800; // Delay para a animação começar depois do modal aparecer
      const targetY = isWinner ? height / 3 : -height / 3; // Voa para baixo (vencedor) ou para cima (perdedor)

      opacity.value = withDelay(animationDelay + index * 100, withTiming(1, { duration: 50 }, (finished) => {
        if (finished) {
            opacity.value = withTiming(0, { duration: 300 });
        }
      }));
      translateY.value = withDelay(animationDelay + index * 100, withTiming(targetY, { duration: 400, easing: Easing.inOut(Easing.ease) }));
      scale.value = withDelay(animationDelay + index * 100, withTiming(0.5, { duration: 400 }));
    }
  }, [startAnimation, index, isWinner, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return <Animated.View style={[styles.animatedCard, animatedStyle]} />;
};

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    width: 60,
    height: 90,
    backgroundColor: '#1a237e',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default AnimatedResultCard;