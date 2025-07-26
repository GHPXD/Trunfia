// src/components/game/ConfettiParticle.tsx

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface ConfettiParticleProps {
  index: number;
  colors: string[];
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ index, colors }) => {
  const startX = Math.random() * screenWidth;
  const startY = -50 - Math.random() * screenHeight;
  const endY = screenHeight + 50;
  const duration = 4000 + Math.random() * 2000;
  const delay = Math.random() * 1000;

  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(endY, { duration, easing: Easing.linear })
    );

    translateX.value = withDelay(
      delay,
      withTiming(translateX.value + (Math.random() - 0.5) * 200, { duration })
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotate.value + (Math.random() > 0.5 ? 1 : -1) * 720, { duration })
    );

    opacity.value = withDelay(
        duration * 0.8 + delay, // Começa a desaparecer nos últimos 20%
        withTiming(0, { duration: duration * 0.2 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
        translateY.value,
        [startY, endY],
        [1, 0.5]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale },
      ],
      opacity: opacity.value,
      backgroundColor: colors[index % colors.length],
    };
  });

  const size = 10 + Math.random() * 5;
  const borderRadius = Math.random() > 0.5 ? size / 2 : 3;

  return <Animated.View style={[styles.particle, { width: size, height: size, borderRadius }, animatedStyle]} />;
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default ConfettiParticle;