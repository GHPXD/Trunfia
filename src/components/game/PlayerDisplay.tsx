// src/components/game/PlayerDisplay.tsx
import React from 'react'; // 1. Importar o React completo
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import OpponentHand from './OpponentHand';
import { Player } from '../../types';
import { useAnimationCoordinates } from '../../contexts/AnimationCoordinateContext';
import { Orientation } from '../../hooks/useOrientation';

type Position = 'top' | 'topLeft' | 'topRight' | 'left' | 'right';

interface PlayerDisplayProps {
  player: Player;
  cardCount: number;
  totalCards: number;
  position: Position;
  isCurrentPlayer: boolean;
  orientation: Orientation;
}

const positionStyles = StyleSheet.create({
  top_PORTRAIT: { top: '15%', alignSelf: 'center' },
  topLeft_PORTRAIT: { top: '15%', left: 10 },
  topRight_PORTRAIT: { top: '15%', right: 10 },
  left_PORTRAIT: { top: '30%', left: 10 },
  right_PORTRAIT: { top: '30%', right: 10 },
  top_LANDSCAPE: { top: 10, alignSelf: 'center' },
  left_LANDSCAPE: { left: 20, top: '50%', transform: [{ translateY: -50 }] },
  right_LANDSCAPE: { right: 20, top: '50%', transform: [{ translateY: -50 }] },
  topLeft_LANDSCAPE: { top: 10, left: 20 },
  topRight_LANDSCAPE: { top: 10, right: 20 },
});

// 2. Definir o componente funcional como uma constante
const PlayerDisplayComponent: React.FC<PlayerDisplayProps> = ({
  player, cardCount, totalCards, position, isCurrentPlayer, orientation,
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
  const cardPercentage = totalCards > 0 ? (cardCount / totalCards) * 100 : 0;

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
      <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${cardPercentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', gap: 8, maxWidth: 120 },
  playerInfo: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', gap: 4 },
  currentPlayerHighlight: { backgroundColor: '#FFD700' },
  avatar: { fontSize: 24 },
  nickname: { color: '#FFF', fontWeight: 'bold', fontSize: 12, },
  progressContainer: {
    height: 6,
    width: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
});

// 3. Exportar a versão memoizada do componente
export default React.memo(PlayerDisplayComponent);