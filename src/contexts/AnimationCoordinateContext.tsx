// src/contexts/AnimationCoordinateContext.tsx
import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { LayoutRectangle } from 'react-native';

export interface Coordinates {
  [playerNickname: string]: LayoutRectangle | undefined;
}

interface AnimationCoordinateContextState {
  coordinates: Coordinates;
  setCoordinate: (nickname: string, layout: LayoutRectangle) => void;
}

const AnimationCoordinateContext = createContext<AnimationCoordinateContextState | undefined>(undefined);

interface AnimationCoordinateProviderProps {
  children: ReactNode;
}

export const AnimationCoordinateProvider: React.FC<AnimationCoordinateProviderProps> = ({ children }) => {
  const [coordinates, setCoordinates] = useState<Coordinates>({});

  const setCoordinate = useCallback((nickname: string, layout: LayoutRectangle) => {
    setCoordinates(prev => ({ ...prev, [nickname]: layout }));
  }, []);

  return (
    <AnimationCoordinateContext.Provider value={{ coordinates, setCoordinate }}>
      {children}
    </AnimationCoordinateContext.Provider>
  );
};

export const useAnimationCoordinates = (): AnimationCoordinateContextState => {
  const context = useContext(AnimationCoordinateContext);
  if (!context) {
    throw new Error('useAnimationCoordinates deve ser usado dentro de um AnimationCoordinateProvider');
  }
  return context;
};