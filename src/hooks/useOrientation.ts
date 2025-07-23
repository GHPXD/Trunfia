// src/hooks/useOrientation.ts
import { useWindowDimensions } from 'react-native';

export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export const useOrientation = (): Orientation => {
  const { width, height } = useWindowDimensions();

  return width < height ? 'PORTRAIT' : 'LANDSCAPE';
};