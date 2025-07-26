// src/components/game/Confetti.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ConfettiParticle from './ConfettiParticle';

interface ConfettiProps {
  count: number;
}

const Confetti: React.FC<ConfettiProps> = ({ count }) => {
  const colors = ['#FFD700', '#FFC107', '#FFF176', '#4CAF50', '#8BC34A'];
  const particles = Array.from({ length: count });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((_, index) => (
        <ConfettiParticle key={index} index={index} colors={colors} />
      ))}
    </View>
  );
};

export default Confetti;