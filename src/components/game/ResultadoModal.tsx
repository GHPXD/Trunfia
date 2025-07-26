// src/components/game/ResultadoModal.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { RoundResult, Card, GameState } from '../../types';
import { formatAttributeValue } from '../../utils/gameUtils';
import AnimatedResultCard from './AnimatedResultCard';
import Confetti from './Confetti';

interface ResultadoModalProps {
  visible: boolean;
  roundResult: RoundResult | null;
  gameState: GameState | null;
  allCards: Card[];
  playerNickname: string;
  onClose: () => void;
  onNextRound: () => void;
  isHost: boolean;
}

const ResultadoModal: React.FC<ResultadoModalProps> = ({
  visible,
  roundResult,
  gameState,
  allCards,
  playerNickname,
  onClose,
  onNextRound,
  isHost,
}) => {
  const scaleValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 120 });
    } else {
      scaleValue.value = withSpring(0);
    }
  }, [visible, scaleValue]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  if (!roundResult || !gameState) return null;

  const getCardName = (cardId: string): string => {
    const card = allCards.find(c => c.id === cardId);
    return card?.name || 'Carta desconhecida';
  };

  const sortedResults = Object.entries(roundResult.playerCards).sort(
    ([, a], [, b]) => b.value - a.value
  );

  const isTie = gameState.gamePhase === 'tie';
  const isGameWinner = gameState.gameWinner === playerNickname;
  const isRoundWinner = !isTie && !gameState.gameWinner && roundResult.winners.includes(playerNickname);

  const getTitle = () => {
    if (gameState.gameWinner) return '🏆 Jogo Finalizado!';
    if (isTie) return '⚖️ Empate!';
    return isRoundWinner ? '🎉 Você venceu a rodada!' : '😔 Você perdeu a rodada!';
  };

  const getSubtitle = () => {
    if (gameState.gameWinner) return `Vencedor: ${gameState.gameWinner}`;
    if (isTie) return `As cartas foram para o monte! ${gameState.currentPlayer} joga novamente.`;
    return `Vencedor da rodada: ${roundResult.winners[0]}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {(isRoundWinner || isGameWinner) && <Confetti count={100} />}

        <View style={styles.cardAnimationContainer} pointerEvents="none">
          {!gameState.gameWinner && Object.keys(roundResult.playerCards).map((_, index) => (
            <AnimatedResultCard
              key={index}
              index={index}
              isWinner={isRoundWinner}
              startAnimation={visible}
            />
          ))}
        </View>
        <Animated.View style={[styles.container, modalAnimatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          <View style={styles.attributeSection}>
            <Text style={styles.attributeLabel}>Atributo comparado:</Text>
            <Text style={styles.attributeValue}>
              {roundResult.selectedAttribute}
            </Text>
          </View>

          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Resultados:</Text>
            {sortedResults.map(([player, result], index) => (
              <View
                key={player}
                style={[
                  styles.resultRow,
                  roundResult.winners.includes(player) && styles.winnerRow,
                  player === playerNickname && styles.yourRow,
                ]}
              >
                <View style={styles.positionContainer}>
                  <Text style={styles.position}>
                    {roundResult.winners.includes(player) ? '🏆' : `${index + 1}º`}
                  </Text>
                </View>
                
                <View style={styles.playerInfo}>
                  <Text style={[ styles.playerName, player === playerNickname && styles.yourName ]}>
                    {player}
                    {player === playerNickname && ' (Você)'}
                  </Text>
                  <Text style={styles.cardName}>
                    {getCardName(result.cardId)}
                  </Text>
                </View>
                
                <View style={styles.valueContainer}>
                  <Text style={[ styles.resultValue, roundResult.winners.includes(player) && styles.winnerValue ]}>
                    {formatAttributeValue(roundResult.selectedAttribute, result.value)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            {gameState.gameWinner ? (
              <TouchableOpacity
                style={styles.closeButtonPrimary}
                onPress={onClose}
              >
                <Text style={styles.closeButtonTextPrimary}>Voltar ao Menu</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[ styles.nextButton, !isHost && styles.disabledButton ]}
                onPress={onNextRound}
                disabled={!isHost}
              >
                <Text style={styles.nextButtonText}>
                  {isHost ? 'Próxima Rodada' : 'Aguardando Host...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    cardAnimationContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
      },
      attributeSection: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
      },
      attributeLabel: {
        fontSize: 14,
        color: '#1976d2',
        marginBottom: 4,
      },
      attributeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976d2',
      },
      resultsContainer: {
        maxHeight: 300,
        marginBottom: 20,
      },
      resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
      },
      resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
      },
      winnerRow: {
        backgroundColor: '#fff3e0',
        borderWidth: 2,
        borderColor: '#ff9800',
      },
      yourRow: {
        backgroundColor: '#e3f2fd',
      },
      positionContainer: {
        width: 40,
        alignItems: 'center',
      },
      position: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      playerInfo: {
        flex: 1,
        marginLeft: 12,
      },
      playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
      },
      yourName: {
        color: '#1976d2',
      },
      cardName: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
      },
      valueContainer: {
        alignItems: 'flex-end',
      },
      resultValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
      },
      winnerValue: {
        color: '#f57c00',
        fontSize: 18,
      },
      buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
      },
      nextButton: {
        flex: 1,
        backgroundColor: '#4caf50',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
      },
      nextButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
      disabledButton: {
        backgroundColor: '#A5A5A5',
      },
      closeButtonPrimary: {
        flex: 1,
        backgroundColor: '#2196f3',
        borderColor: '#2196f3',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
      },
      closeButtonTextPrimary: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
  });
  
export default ResultadoModal;