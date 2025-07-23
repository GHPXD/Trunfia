// src/components/game/StyledSpinWheel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Text as SVGText } from 'react-native-svg';

interface StyledSpinWheelProps {
  players: string[];
  selectedPlayer: string | null;
  isSpinning: boolean;
  onSpinComplete: (selectedPlayer: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const WHEEL_SIZE = screenWidth * 0.8;
const CIRCLE_RADIUS = WHEEL_SIZE / 2;
const INDICATOR_SIZE = 30;

const StyledSpinWheel: React.FC<StyledSpinWheelProps> = ({ players, selectedPlayer, isSpinning, onSpinComplete }) => {
  const rotation = useSharedValue(0);
  const [winner, setWinner] = useState<string | null>(null);
  
  const numPlayers = players.length;
  const anglePerPlayer = numPlayers > 0 ? 360 / numPlayers : 0;

  useEffect(() => {
    rotation.value = 0;
    setWinner(null);
  }, [players]);

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
  }, [isSpinning, selectedPlayer]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${-rotation.value}deg` }], // Rotação negativa para girar no sentido horário
    };
  });

  const getSegmentPath = (index: number) => {
    const angle = (2 * Math.PI) / numPlayers;
    const startAngle = index * angle - Math.PI / 2 - angle / 2;
    const endAngle = startAngle + angle;

    const startX = CIRCLE_RADIUS + CIRCLE_RADIUS * Math.cos(startAngle);
    const startY = CIRCLE_RADIUS + CIRCLE_RADIUS * Math.sin(startAngle);
    const endX = CIRCLE_RADIUS + CIRCLE_RADIUS * Math.cos(endAngle);
    const endY = CIRCLE_RADIUS + CIRCLE_RADIUS * Math.sin(endAngle);

    return `M ${CIRCLE_RADIUS},${CIRCLE_RADIUS} L ${startX},${startY} A ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 0 1 ${endX},${endY} z`;
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Sorteando o primeiro a jogar...</Text>
        <View style={styles.wheelContainer}>
            <View style={styles.indicator} />
            <Animated.View style={animatedStyle}>
                <Svg height={WHEEL_SIZE} width={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
                {players.map((player, index) => (
                    <Path
                    key={player}
                    d={getSegmentPath(index)}
                    fill={index % 2 === 0 ? '#4CAF50' : '#8BC34A'}
                    stroke="#FFF"
                    strokeWidth="2"
                    />
                ))}
                {players.map((player, index) => {
                    const angle = (index * anglePerPlayer) * (Math.PI / 180);
                    const textRadius = CIRCLE_RADIUS * 0.7;
                    const x = CIRCLE_RADIUS + textRadius * Math.sin(angle);
                    const y = CIRCLE_RADIUS - textRadius * Math.cos(angle);
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
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    left: WHEEL_SIZE / 2 - INDICATOR_SIZE / 2,
    width: 0,
    height: 0,
    borderLeftWidth: INDICATOR_SIZE / 2,
    borderRightWidth: INDICATOR_SIZE / 2,
    borderBottomWidth: INDICATOR_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#d32f2f',
    zIndex: 10,
  },
  winnerTextContainer: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default StyledSpinWheel;