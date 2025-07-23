// src/components/game/StyledSpinWheel.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Text as SVGText } from 'react-native-svg';
import { COLORS, WHEEL_CONFIG } from '../../constants';

interface StyledSpinWheelProps {
  players: string[];
  selectedPlayer: string | null;
  isSpinning: boolean;
  onSpinComplete: (selectedPlayer: string) => void;
}

const StyledSpinWheel: React.FC<StyledSpinWheelProps> = ({ players, selectedPlayer, isSpinning, onSpinComplete }) => {
  const rotation = useSharedValue(0);
  const [winner, setWinner] = useState<string | null>(null);
  
  const numPlayers = players.length;
  const anglePerPlayer = numPlayers > 0 ? 360 / numPlayers : 0;

  useEffect(() => {
    rotation.value = 0;
    setWinner(null);
  }, [players, rotation]);

  useEffect(() => {
    if (isSpinning && selectedPlayer) {
      const winnerIndex = players.indexOf(selectedPlayer);
      if (winnerIndex === -1) return;

      const randomSpins = 5 + Math.floor(Math.random() * 3); // De 5 a 7 voltas completas
      const targetAngle = winnerIndex * anglePerPlayer;
      const finalRotation = (randomSpins * 360) + targetAngle;
      
      rotation.value = withTiming(finalRotation, {
        duration: 4000,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(setWinner)(selectedPlayer);
          runOnJS(onSpinComplete)(selectedPlayer);
        }
      });
    }
  }, [isSpinning, selectedPlayer, anglePerPlayer, onSpinComplete, players, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${-rotation.value}deg` }], // Rotação negativa para girar no sentido horário
    };
  });

  const getSegmentPath = (index: number) => {
    const angle = (2 * Math.PI) / numPlayers;
    const startAngle = index * angle - Math.PI / 2 - angle / 2;
    const endAngle = startAngle + angle;

    const startX = WHEEL_CONFIG.RADIUS + WHEEL_CONFIG.RADIUS * Math.cos(startAngle);
    const startY = WHEEL_CONFIG.RADIUS + WHEEL_CONFIG.RADIUS * Math.sin(startAngle);
    const endX = WHEEL_CONFIG.RADIUS + WHEEL_CONFIG.RADIUS * Math.cos(endAngle);
    const endY = WHEEL_CONFIG.RADIUS + WHEEL_CONFIG.RADIUS * Math.sin(endAngle);

    return `M ${WHEEL_CONFIG.RADIUS},${WHEEL_CONFIG.RADIUS} L ${startX},${startY} A ${WHEEL_CONFIG.RADIUS},${WHEEL_CONFIG.RADIUS} 0 0 1 ${endX},${endY} z`;
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Sorteando o primeiro a jogar...</Text>
        <View style={styles.wheelContainer}>
            <View style={styles.indicator} />
            <Animated.View style={animatedStyle}>
                <Svg height={WHEEL_CONFIG.SIZE} width={WHEEL_CONFIG.SIZE} viewBox={`0 0 ${WHEEL_CONFIG.SIZE} ${WHEEL_CONFIG.SIZE}`}>
                {players.map((player, index) => (
                    <Path
                    key={player}
                    d={getSegmentPath(index)}
                    fill={index % 2 === 0 ? COLORS.wheel.segment1 : COLORS.wheel.segment2}
                    stroke={COLORS.white}
                    strokeWidth="2"
                    />
                ))}
                {players.map((player, index) => {
                    const angle = (index * anglePerPlayer) * (Math.PI / 180);
                    const textRadius = WHEEL_CONFIG.RADIUS * 0.7;
                    const x = WHEEL_CONFIG.RADIUS + textRadius * Math.sin(angle);
                    const y = WHEEL_CONFIG.RADIUS - textRadius * Math.cos(angle);
                    return (
                    <SVGText
                        key={player}
                        x={x}
                        y={y}
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                        origin={`${x}, ${y}`}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        rotation={index * anglePerPlayer}
                    >
                        {player}
                    </SVGText>
                    );
                })}
                </Svg>
            </Animated.View>
        </View>
        {winner && !isSpinning && (
            <View style={styles.winnerTextContainer}>
                <Text style={styles.winnerText}>
                    {winner} começa jogando!
                </Text>
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 40,
    textAlign: 'center',
  },
  wheelContainer: {
    width: WHEEL_CONFIG.SIZE,
    height: WHEEL_CONFIG.SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    left: WHEEL_CONFIG.SIZE / 2 - WHEEL_CONFIG.INDICATOR_SIZE / 2,
    width: 0,
    height: 0,
    borderLeftWidth: WHEEL_CONFIG.INDICATOR_SIZE / 2,
    borderRightWidth: WHEEL_CONFIG.INDICATOR_SIZE / 2,
    borderBottomWidth: WHEEL_CONFIG.INDICATOR_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.wheel.indicator,
    zIndex: 10,
  },
  winnerTextContainer: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});

export default StyledSpinWheel;