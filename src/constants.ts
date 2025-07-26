// src/constants.ts
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

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

export const EMOJI_AVATARS: string[] = ['🧑‍🚀', '🧑‍🎨', '🧑‍💻', '🧑‍🔬', '🧑‍✈️', '🕵️'];

// 2. Definir a nova lista de avatares de personagens
export const CHARACTER_AVATARS = [
  { id: 'char1', source: require('./assets/avatars/char1.png') },
  { id: 'char2', source: require('./assets/avatars/char2.png') },
  { id: 'char3', source: require('./assets/avatars/char3.png') },
  { id: 'char4', source: require('./assets/avatars/char4.png') },
  { id: 'char5', source: require('./assets/avatars/char5.png') },
  { id: 'char6', source: require('./assets/avatars/char6.png') },
];

// 3. Criar uma função helper para obter a imagem de um avatar pelo ID
export const getAvatarSourceById = (avatarId: string | null) => {
  if (!avatarId) return null;
  const foundAvatar = CHARACTER_AVATARS.find(avatar => avatar.id === avatarId);
  return foundAvatar ? foundAvatar.source : null;
};

// Configurações da Roleta de Sorteio
export const WHEEL_CONFIG = {
  SIZE: screenWidth * 0.8,
  RADIUS: (screenWidth * 0.8) / 2,
  INDICATOR_SIZE: 30,
};