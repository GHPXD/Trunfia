// src/components/game/TurnTimer.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';

interface TurnTimerProps {
  duration: number; // em segundos
  isPlaying: boolean;
  onTimeEnd: () => void;
  size?: number;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ duration, isPlaying, onTimeEnd, size = 60 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const progress = useSharedValue(1);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isPlaying) {
      // Reseta o timer e a animação
      setTimeLeft(duration);
      progress.value = 1; // Reseta o valor compartilhado

      // Inicia a animação da barra de progresso
      progress.value = withTiming(0, { duration: duration * 1000 });

      // Inicia o contador de segundos
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } else {
      // Para a animação e reseta o valor
      cancelAnimation(progress);
      progress.value = 1;
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      cancelAnimation(progress); // Limpa a animação ao desmontar
    };
  }, [isPlaying, duration, onTimeEnd, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.3, 0.7, 1],
      ['#d9534f', '#f0ad4e', '#5cb85c', '#5cb85c'] // Vermelho, Laranja, Verde
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.backgroundBar} />
      <Animated.View style={[styles.progressBar, animatedStyle]} />
      <View style={styles.textContainer}>
        <Text style={styles.timerText}>{timeLeft}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#e9ecef',
    borderWidth: 5,
    borderColor: '#ced4da',
    overflow: 'hidden', // Garante que a barra de progresso não vaze
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
  },
});

export default TurnTimer;