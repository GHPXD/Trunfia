// src/components/game/PlayerDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, ViewStyle, TextStyle } from 'react-native';
import OpponentHand from './OpponentHand';
import { Player } from '../../types';
import { useAnimationCoordinates } from '../../contexts/AnimationCoordinateContext';
import { Orientation } from '../../hooks/useOrientation';

type Position = 'top' | 'topLeft' | 'topRight' | 'left' | 'right';

interface PlayerDisplayProps {
  player: Player;
  cardCount: number;
  position: Position;
  isCurrentPlayer: boolean;
  orientation: Orientation;
}

// <<<--- CORREÇÃO AQUI: Estilos posicionais separados ---<<<
const positionStyles = StyleSheet.create({
  // Estilos para Retrato (Portrait)
  top_PORTRAIT: { top: '15%', alignSelf: 'center' },
  topLeft_PORTRAIT: { top: '15%', left: 10 },
  topRight_PORTRAIT: { top: '15%', right: 10 },
  left_PORTRAIT: { top: '30%', left: 10 },
  right_PORTRAIT: { top: '30%', right: 10 },

  // Estilos para Paisagem (Landscape)
  top_LANDSCAPE: { top: 10, alignSelf: 'center' },
  left_LANDSCAPE: { left: 20, top: '50%', transform: [{ translateY: -50 }] },
  right_LANDSCAPE: { right: 20, top: '50%', transform: [{ translateY: -50 }] },
  topLeft_LANDSCAPE: { top: 10, left: 20 },
  topRight_LANDSCAPE: { top: 10, right: 20 },
});

const PlayerDisplay: React.FC<PlayerDisplayProps> = ({
  player, cardCount, position, isCurrentPlayer, orientation,
}) => {
  const { setCoordinate } = useAnimationCoordinates();

  const handleOnLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    if (layout.width > 0 && layout.height > 0) {
      setCoordinate(player.nickname, { ...layout, x: layout.x, y: layout.y });
    }
  };

  let flexDirection: 'row' | 'column' | 'row-reverse' = 'column';
  if (orientation === 'LANDSCAPE') {
    if (position === 'left') flexDirection = 'row';
    if (position === 'right') flexDirection = 'row-reverse';
  }

  const positionStyleKey = `${position}_${orientation}` as keyof typeof positionStyles;

  return (
    <View 
        style={[styles.container, positionStyles[positionStyleKey]]} 
        onLayout={handleOnLayout}
    >
      <View style={[styles.playerInfo, { flexDirection }, isCurrentPlayer && styles.currentPlayerHighlight]}>
        <Text style={styles.avatar}>{player.avatar || '🤖'}</Text>
        <Text style={styles.nickname} numberOfLines={1}>{player.nickname}</Text>
      </View>
      <OpponentHand cardCount={cardCount} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', gap: 8, maxWidth: 120 },
  playerInfo: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', gap: 4 },
  currentPlayerHighlight: { backgroundColor: '#FFD700' },
  avatar: { fontSize: 24 },
  nickname: { color: '#FFF', fontWeight: 'bold', fontSize: 12, },
});

export default PlayerDisplay;