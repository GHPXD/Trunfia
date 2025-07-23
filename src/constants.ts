// src/constants.ts
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Cores padrão da aplicação
export const COLORS = {
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  secondary: '#FF9800',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#f0ad4e',
  white: '#FFF',
  black: '#000',
  lightGray: '#F5F5F5',
  mediumGray: '#999',
  darkGray: '#333',
  text: '#333',
  textLight: '#666',
  // Cores específicas de componentes
  timer: {
    success: '#5cb85c',
    warning: '#f0ad4e',
    danger: '#d9534f',
  },
  wheel: {
    segment1: '#4CAF50',
    segment2: '#8BC34A',
    indicator: '#d32f2f',
  },
};

// Configurações da tela de Login
export const AVATARS = ['😊', '😎', '😂', '🥳', '🤯', '👽', '🦊', '👻'];

// Configurações da Roleta de Sorteio
export const WHEEL_CONFIG = {
  SIZE: screenWidth * 0.8,
  RADIUS: (screenWidth * 0.8) / 2,
  INDICATOR_SIZE: 30,
};