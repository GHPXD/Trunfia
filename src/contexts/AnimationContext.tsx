// src/contexts/AnimationContext.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import {
  useSharedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Card } from '../types';

// Define o estado que o contexto vai gerenciar
interface AnimationContextState {
  // Posição de cada carta na mão do jogador
  playerHandCoordinates: SharedValue<Array<{ x: number; y: number; rotate: number; }>>;
  // Estado da carta que está sendo jogada
  playedCardState: SharedValue<{
    card: Card | null;
    isAnimating: boolean;
    origin: { x: number; y: number };
  }>;
}

// Cria o contexto
const AnimationContext = createContext<AnimationContextState | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

// Cria o Provedor que vai envolver nossa aplicação
export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const playerHandCoordinates = useSharedValue<Array<{ x: number; y: number; rotate: number; }>>([]);
  
  const playedCardState = useSharedValue<{
    card: Card | null;
    isAnimating: boolean;
    origin: { x: number; y: number };
  }>({
    card: null,
    isAnimating: false,
    origin: { x: 0, y: 0 },
  });

  // O useMemo garante que o valor do contexto não seja recriado a cada renderização
  const value = useMemo(() => ({
    playerHandCoordinates,
    playedCardState,
  }), [playerHandCoordinates, playedCardState]);

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook customizado para acessar facilmente o contexto
export const useAnimations = (): AnimationContextState => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimations deve ser usado dentro de um AnimationProvider');
  }
  return context;
};