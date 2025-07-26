// src/utils/dimensions.ts

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Largura base do design original (ex: iPhone 11/12)
const designWidth = 390;

/**
 * Escala uma medida horizontal (largura, padding, margin) com base na largura da tela.
 * @param size O tamanho em pixels no design original.
 * @returns O tamanho escalado para a tela atual.
 */
export const scaleWidth = (size: number): number => {
  return (screenWidth / designWidth) * size;
};

/**
 * Escala uma fonte. Usa uma escala mais moderada para não ficar muito grande em telas largas.
 * @param size O tamanho da fonte no design original.
 * @returns O tamanho da fonte escalado.
 */
export const scaleFont = (size: number): number => {
  const newSize = scaleWidth(size);
  // Limita a escala para evitar fontes excessivamente grandes em tablets
  return Math.min(newSize, size * 1.5); 
};

/**
 * Retorna a largura atual da tela.
 */
export const sWidth = screenWidth;

/**
 * Retorna a altura atual da tela.
 */
export const sHeight = screenHeight;