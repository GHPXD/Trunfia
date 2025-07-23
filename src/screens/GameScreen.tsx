// src/screens/GameScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ImageBackground, Dimensions, LayoutRectangle } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { useSharedValue, withTiming, Easing, runOnJS, useAnimatedStyle, withDelay } from 'react-native-reanimated';
import Orientation from 'react-native-orientation-locker';
import { RootStackParamList, GameState, Card } from '../types';
import { useGame } from '../contexts/GameContext';
import { useAnimationCoordinates } from '../contexts/AnimationCoordinateContext';
import { useOrientation, Orientation as OrientationType } from '../hooks/useOrientation';
import {
  startGame,
  playCard,
  selectAttribute,
  processRoundResult,
  startNextRound,
  listenToGameState,
} from '../services/gameService';
import { getDeckCards } from '../data/decks';
import { getOrientationSetting } from '../services/storageService';
import RodadaInfo from '../components/game/RodadaInfo';
import StyledSpinWheel from '../components/game/StyledSpinWheel';
import BotController from '../components/game/BotController';
import PlayerDisplay from '../components/game/PlayerDisplay';
import Arena from '../components/game/Arena';
import AnimatedHand from '../components/game/AnimatedHand';
import Carta from '../components/game/Carta';

// Hook customizado para obter o valor anterior de uma prop ou estado
function usePrevious(value: any) {
  const ref = useRef<GameState | null>(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Componente para a "carta fantasma" que voa da mão do oponente para a arena
const OpponentCardAnimation: React.FC<{ card: Card, startPos: LayoutRectangle, onAnimationComplete: () => void }> = ({ card, startPos, onAnimationComplete }) => {
  const { width, height } = Dimensions.get('window');
  const adjustedStartX = startPos.x + startPos.width / 2;
  const adjustedStartY = startPos.y + startPos.height / 2;

  const translateX = useSharedValue(adjustedStartX - width / 2);
  const translateY = useSharedValue(adjustedStartY - height / 2);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 100 });
    scale.value = withDelay(50, withTiming(1, { duration: 450 }));
    translateX.value = withDelay(50, withTiming(0, { duration: 450 }));
    translateY.value = withDelay(50, withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }, (finished) => {
      if (finished) {
        opacity.value = withTiming(0, { duration: 100 }, () => runOnJS(onAnimationComplete)());
      }
    }));
  }, [card, startPos, opacity, scale, translateX, translateY, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.centerContent]} pointerEvents="none">
      <Carta card={card} isRevealed={false} isSelected={false} isSelectable={false} />
    </Animated.View>
  );
};

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface Props {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
}

const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { state } = useGame();
  const { coordinates } = useAnimationCoordinates();
  const orientation = useOrientation();

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        const setting = await getOrientationSetting();
        if (setting === 'portrait') {
          Orientation.lockToPortrait();
        } else if (setting === 'landscape') {
          Orientation.lockToLandscape();
        } else {
          Orientation.unlockAllOrientations();
        }
      } catch (e) {
        console.error('Falha ao travar a orientação:', e);
      }
    };

    lockOrientation();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const isProcessingRound = useRef(false);
  const [cardToConfirm, setCardToConfirm] = useState<Card | null>(null);
  const [tentativeAttribute, setTentativeAttribute] = useState<string | null>(null);
  const [isRoundEnding, setIsRoundEnding] = useState(false);
  const [animatingOpponentCard, setAnimatingOpponentCard] = useState<{ card: Card, nickname: string } | null>(null);

  const prevGameState = usePrevious(gameState);

  const handleStartGame = useCallback(async (cards: Card[]) => {
    if (!state.currentRoom || !state.currentRoom.players) return;
    const players = Object.keys(state.currentRoom.players);
    if (players.length < 2) return;
    try {
      await startGame(roomId, players, cards);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar o jogo');
    }
  }, [roomId, state.currentRoom]);

  const updatePlayerHand = useCallback((currentGameState: GameState | null, cards: Card[]) => {
    if (!currentGameState || !cards.length || !currentGameState.playerCards || !state.playerNickname) {
      setPlayerHand([]);
      return;
    }
    const playerCardIds = currentGameState.playerCards[state.playerNickname] || [];
    const hand = playerCardIds.map(id => cards.find(card => card.id === id)).filter(Boolean) as Card[];
    setPlayerHand(hand);
  }, [state.playerNickname]);

  useEffect(() => {
    if (!state.selectedDeck) {
      navigation.goBack();
      return;
    }
    setAllCards(getDeckCards(state.selectedDeck.id));
  }, [state.selectedDeck, navigation]);

  useEffect(() => {
    if (roomId !== 'SOLO_GAME_ROOM' && state.currentRoom && allCards.length > 0 && !gameState) {
      if (state.currentRoom.hostNickname === state.playerNickname) {
        handleStartGame(allCards);
      }
    }
  }, [state.currentRoom, allCards, gameState, state.playerNickname, handleStartGame, roomId]);

  useEffect(() => {
    const unsubscribe = listenToGameState(roomId, setGameState);
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    updatePlayerHand(gameState, allCards);
  }, [gameState, allCards, updatePlayerHand]);

  useEffect(() => {
    if (gameState?.gamePhase === 'selecting') {
      setCardToConfirm(null);
      setTentativeAttribute(null);
    }
    
    if (prevGameState && gameState?.currentRoundCards) {
      const prevCards = Object.keys(prevGameState?.currentRoundCards || {});
      const currentCards = Object.keys(gameState.currentRoundCards);
      const newPlayerCard = currentCards.find(p => !prevCards.includes(p) && p !== state.playerNickname);
      
      if (newPlayerCard) {
        const cardId = gameState.currentRoundCards[newPlayerCard];
        const card = allCards.find(c => c.id === cardId);
        if (card) {
          setAnimatingOpponentCard({ card, nickname: newPlayerCard });
        }
      }
    }

    if (gameState?.gamePhase === 'revealing' && !isProcessingRound.current) {
        const activePlayersCount = Object.values(state.currentRoom?.players || {}).filter(p => p.status === 'active').length;
        if (Object.keys(gameState.currentRoundCards).length === activePlayersCount && gameState.selectedAttribute) {
            isProcessingRound.current = true;
            setTimeout(() => {
                processRoundResult(roomId, gameState, allCards).finally(() => {
                    isProcessingRound.current = false;
                });
            }, 1000);
        }
    }
    
    if (gameState?.gamePhase === 'comparing' && !isRoundEnding) {
      if(gameState.gameWinner) {
        Alert.alert('Fim de Jogo!', `O vencedor é ${gameState.gameWinner}!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        setIsRoundEnding(true);
      }
    }
  }, [gameState, allCards, prevGameState, state.playerNickname, roomId, isRoundEnding, navigation]);

  const isHost = () => state.currentRoom?.hostNickname === state.playerNickname;

  const handleNextRound = useCallback(async () => {
    if (!isHost()) return;
    try {
      await startNextRound(roomId);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível iniciar a próxima rodada.");
    }
  }, [roomId, state.currentRoom]);

  const onRoundEndAnimationComplete = useCallback(() => {
    setIsRoundEnding(false);
    if(isHost()) {
        handleNextRound();
    }
  }, [handleNextRound, state.currentRoom]);

  const isCurrentPlayer = gameState?.currentPlayer === state.playerNickname;
  const hasPlayedCard = !!(gameState?.currentRoundCards && gameState?.currentRoundCards[state.playerNickname]);

  const handleCardSelection = (card: Card) => {
    if (hasPlayedCard) return;
    if (isCurrentPlayer) {
      setCardToConfirm(card);
    } else {
      playCard(roomId, state.playerNickname, card.id).catch(error => {
        Alert.alert('Erro de Conexão', 'Não foi possível registrar sua jogada.');
      });
    }
  };

  const handleConfirmTurn = () => {
    if (!cardToConfirm || !isCurrentPlayer) return;
    if (!tentativeAttribute) {
      Alert.alert('Atenção', 'Você deve escolher um atributo para jogar.');
      return;
    }

    const playedCardId = cardToConfirm.id;
    const playedAttribute = tentativeAttribute;
    setCardToConfirm(null);
    setTentativeAttribute(null);

    Promise.all([
      playCard(roomId, state.playerNickname, playedCardId),
      selectAttribute(roomId, playedAttribute)
    ]).catch(error => {
      Alert.alert('Erro de Conexão', 'Não foi possível confirmar a jogada.');
    });
  };

  if (!state.currentRoom || !state.currentRoom.players || !gameState) {
    return (<SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Carregando jogo...</Text></SafeAreaView>);
  }

  if (gameState.gamePhase === 'spinning') {
    return (
      <SafeAreaView style={styles.container}>
        <StyledSpinWheel 
            players={Object.keys(state.currentRoom.players)} 
            selectedPlayer={gameState.spinResult || null} 
            isSpinning={true}
            onSpinComplete={() => {}}
        />
      </SafeAreaView>
    );
  }

  const opponents = Object.values(state.currentRoom.players).filter(p => p.nickname !== state.playerNickname);
  const getOpponentPositions = (orient: OrientationType, count: number): ('top' | 'topLeft' | 'topRight' | 'left' | 'right')[] => {
    if (orient === 'LANDSCAPE') {
        if (count === 1) return ['top'];
        if (count === 2) return ['left', 'right'];
        return ['left', 'top', 'right'];
    }
    if (count === 1) return ['top'];
    if (count === 2) return ['topLeft', 'topRight'];
    return ['topLeft', 'top', 'topRight'];
  };
  const opponentPositions = getOpponentPositions(orientation, opponents.length);
  const isHandVisible = gameState.gamePhase === 'selecting' && !cardToConfirm && !hasPlayedCard;
  
  const startPos = animatingOpponentCard ? coordinates[animatingOpponentCard.nickname] : null;

  return (
    <ImageBackground source={require('../assets/images/table-background.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <BotController roomId={roomId} gameState={gameState} players={state.currentRoom.players} allCards={allCards} />
        <View style={[styles.topSection, styles[`topSection_${orientation}`]]}>
          <RodadaInfo gameState={gameState} playerNickname={state.playerNickname} />
        </View>
        {opponents.map((player, index) => (
          <PlayerDisplay
            key={player.nickname}
            player={player}
            cardCount={gameState.playerCards?.[player.nickname]?.length || 0}
            position={opponentPositions[index]}
            isCurrentPlayer={gameState.currentPlayer === player.nickname}
            orientation={orientation}
          />
        ))}

        <Arena 
          gameState={gameState} 
          allCards={allCards}
          isRoundEnding={isRoundEnding}
          onAnimationComplete={onRoundEndAnimationComplete}
          animatingCardPlayer={animatingOpponentCard?.nickname}
          orientation={orientation}
        />
        
        <View style={[styles.bottomSection, styles[`bottomSection_${orientation}`]]}>
          <AnimatedHand
              cards={playerHand}
              onSelectCard={handleCardSelection}
              hasPlayedCard={hasPlayedCard}
              isFirstRound={gameState.currentRound === 1}
              isVisible={isHandVisible}
          />
        </View>

        {animatingOpponentCard && startPos && (
          <OpponentCardAnimation
            card={animatingOpponentCard.card}
            startPos={startPos}
            onAnimationComplete={() => setAnimatingOpponentCard(null)}
          />
        )}

        {cardToConfirm && (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationTitle}>
              {isCurrentPlayer ? 'Escolha um atributo:' : 'Sua carta:'}
            </Text>
            <Carta
              card={cardToConfirm}
              isRevealed={true}
              isSelected={true}
              isSelectable={false}
              isAttributeSelectable={isCurrentPlayer}
              onAttributeSelect={setTentativeAttribute}
              selectedAttribute={tentativeAttribute || undefined}
            />
          </View>
        )}
        
        {cardToConfirm && isCurrentPlayer && !hasPlayedCard && (
            <View style={[
                styles.actionButtonContainer,
                orientation === 'LANDSCAPE' && styles.actionButtonContainer_LANDSCAPE
            ]}>
                {orientation === 'PORTRAIT' ? (
                    <TouchableOpacity style={[styles.actionButton, styles.confirmButtonFullWidth]} onPress={handleConfirmTurn}>
                        <Text style={styles.actionButtonText}>Confirmar Jogada</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.actionButton, styles.confirmButtonLandscape]} onPress={handleConfirmTurn}>
                        <Text style={styles.actionButtonTextLandscape}>Confirmar</Text>
                        <Text style={styles.actionButtonTextLandscape}>Jogada</Text>
                    </TouchableOpacity>
                )}
            </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
    backgroundImage: { flex: 1, backgroundColor: '#0a3d62' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
    loadingText: { fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center' },
    topSection: { position: 'absolute', zIndex: 10 },
    topSection_PORTRAIT: { top: 40, left: 0, right: 0, alignItems: 'center' },
    topSection_LANDSCAPE: { top: 10, left: 20 },
    bottomSection: { position: 'absolute', left: 0, right: 0 },
    bottomSection_PORTRAIT: { bottom: 0, height: 250 },
    bottomSection_LANDSCAPE: { bottom: -20, height: 250 },
    confirmationContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10,
        marginBottom: 20,
    },
    actionButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        zIndex: 20,
    },
    actionButtonContainer_LANDSCAPE: {
        right: '5%',
        left: 'auto',
        top: '50%',
        bottom: 'auto',
        flexDirection: 'column',
        width: 100,
        transform: [{ translateY: -40 }],
    },
    actionButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmButtonFullWidth: {
        backgroundColor: '#4CAF50',
        width: '80%',
    },
    confirmButtonLandscape: {
        backgroundColor: '#4CAF50',
        width: 80,
        height: 80,
        borderRadius: 10,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    actionButtonTextLandscape: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
});

export default GameScreen;