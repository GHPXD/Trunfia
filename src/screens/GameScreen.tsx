// src/screens/GameScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  LayoutRectangle,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { useSharedValue, withTiming, Easing, runOnJS, useAnimatedStyle, withDelay } from 'react-native-reanimated';
import Orientation from 'react-native-orientation-locker';
import { RootStackParamList, GameState, Card, Player, RoundResult } from '../types';
import { useGame } from '../contexts/GameContext';
import { useAnimationCoordinates } from '../contexts/AnimationCoordinateContext';
import { useOrientation, Orientation as OrientationType } from '../hooks/useOrientation';
import { listenToGameState } from '../services/gameService';
import { getDeckCards } from '../data/decks';
import { getOrientationSetting } from '../services/storageService';
import RodadaInfo from '../components/game/RodadaInfo';
import StyledSpinWheel from '../components/game/StyledSpinWheel';
import BotController from '../components/game/BotController';
import PlayerDisplay from '../components/game/PlayerDisplay';
import Arena from '../components/game/Arena';
import AnimatedHand from '../components/game/AnimatedHand';
import Carta from '../components/game/Carta';
import TurnIndicator from '../components/game/TurnIndicator';
import ResultadoModal from '../components/game/ResultadoModal';
import { usePlayerHand } from '../hooks/usePlayerHand';
import { useGameUpdates } from '../hooks/useGameUpdates';
import { useSinglePlayerGame } from '../hooks/useSinglePlayerGame';

const OpponentCardAnimation: React.FC<{ card: Card; startPos: LayoutRectangle; onAnimationComplete: () => void }> = ({ card, startPos, onAnimationComplete }) => {
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
  const { roomId, gameMode = 'multiplayer', botDifficulty = 'medium' } = route.params;
  const isSinglePlayer = gameMode === 'singleplayer';

  const { state: globalState } = useGame();
  const { coordinates, setCoordinate } = useAnimationCoordinates();
  const orientation = useOrientation();

  const singlePlayerData = useSinglePlayerGame(isSinglePlayer ? globalState.selectedDeck?.id || 'paises' : 'paises', botDifficulty);
  const [multiplayerGameState, setMultiplayerGameState] = useState<GameState | null>(
    () => globalState.currentRoom?.gameState || null
  );

  const gameState = isSinglePlayer ? singlePlayerData.gameState : multiplayerGameState;
  const [allCards, setAllCards] = useState<Card[]>([]);
  
  useEffect(() => {
    if (globalState.selectedDeck) {
      setAllCards(getDeckCards(globalState.selectedDeck.id));
    }
  }, [globalState.selectedDeck]);

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const playerHandLayoutRef = useRef<LayoutRectangle | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const isCurrentPlayer = gameState?.currentPlayer === globalState.playerNickname;
  const hasPlayedCard = !!(gameState?.currentRoundCards && gameState?.currentRoundCards[globalState.playerNickname]);

  const {
    cardToConfirm,
    tentativeAttribute,
    setTentativeAttribute,
    handleCardSelection,
    resetHandState,
    handleConfirmTurn: handleMultiplayerConfirmTurn,
  } = usePlayerHand({
    roomId,
    playerNickname: globalState.playerNickname,
    isCurrentPlayer,
    hasPlayedCard,
  });

  const {
    isRoundEnding: isMultiplayerRoundEnding,
    animatingOpponentCard,
    onAnimationComplete: onMultiplayerAnimationComplete,
    clearAnimatingOpponentCard,
  } = useGameUpdates({
    gameState: multiplayerGameState,
    roomId,
    playerNickname: globalState.playerNickname,
    allCards,
    currentRoom: globalState.currentRoom,
    resetHandState,
  });

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        const setting = await getOrientationSetting();
        if (setting === 'portrait') Orientation.lockToPortrait();
        else if (setting === 'landscape') Orientation.lockToLandscape();
        else Orientation.unlockAllOrientations();
      } catch (e) { console.error('Falha ao travar a orientação:', e); }
    };
    lockOrientation();
    return () => Orientation.unlockAllOrientations();
  }, []);

  useEffect(() => {
    if (isSinglePlayer) return;
    const unsubscribe = listenToGameState(roomId, setMultiplayerGameState);
    return () => unsubscribe();
  }, [roomId, isSinglePlayer]);

  useEffect(() => {
    if (gameState?.playerCards && allCards.length > 0) {
      const playerCardIds = gameState.playerCards[globalState.playerNickname] || [];
      const hand = playerCardIds.map(id => allCards.find(card => card.id === id)).filter(Boolean) as Card[];
      setPlayerHand(hand);
    } else {
      setPlayerHand([]);
    }
  }, [gameState, allCards, globalState.playerNickname]);

  useEffect(() => {
    if (isSinglePlayer && singlePlayerData.roundResult) {
      setShowResultModal(true);
    }
  }, [isSinglePlayer, singlePlayerData.roundResult]);

  useEffect(() => {
    if (!isSinglePlayer && isMultiplayerRoundEnding) {
      setShowResultModal(true);
    }
  }, [isSinglePlayer, isMultiplayerRoundEnding]);

  const handleConfirmTurn = useCallback(() => {
    if (isSinglePlayer) {
      if (cardToConfirm && tentativeAttribute) {
        singlePlayerData.handlePlayerTurn(cardToConfirm, tentativeAttribute);
      }
    } else {
      handleMultiplayerConfirmTurn();
    }
    resetHandState();
  }, [isSinglePlayer, cardToConfirm, tentativeAttribute, singlePlayerData, resetHandState, handleMultiplayerConfirmTurn]);

  const handleNextRound = () => {
    setShowResultModal(false);
    if (isSinglePlayer) {
      singlePlayerData.startNextRound();
    } else {
      onMultiplayerAnimationComplete();
    }
  };

  const handleCloseGame = () => {
    setShowResultModal(false);
    navigation.goBack();
  };

  // Condição de carregamento principal, agora mais robusta
  if (!gameState || allCards.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando jogo...</Text>
      </SafeAreaView>
    );
  }

  const opponents: Player[] = isSinglePlayer
    ? [{ nickname: 'Bot', avatar: '🤖', isBot: true, isHost: false, isReady: true, joinedAt: '', status: 'active' }]
    : Object.values(globalState.currentRoom?.players || {}).filter(p => p.nickname !== globalState.playerNickname);

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

  const resultModalData: RoundResult | null = isSinglePlayer 
    ? singlePlayerData.roundResult
    : (gameState.gamePhase === 'comparing' || gameState.gamePhase === 'tie' || gameState.gamePhase === 'finished')
      ? { 
          winners: gameState.roundWinner ? [gameState.roundWinner] : [], 
          playerCards: gameState.currentRoundCards ? Object.entries(gameState.currentRoundCards).reduce((acc, [player, cardId]) => {
            const card = allCards.find(c => c.id === cardId);
            if (card && gameState.selectedAttribute) {
              acc[player] = { cardId, value: card.attributes[gameState.selectedAttribute] };
            }
            return acc;
          }, {} as RoundResult['playerCards']) : {},
          selectedAttribute: gameState.selectedAttribute || '' 
        }
      : null;

  return (
    <ImageBackground source={require('../assets/images/table-background.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        {!isSinglePlayer && globalState.currentRoom && (
          <BotController roomId={roomId} gameState={gameState} players={globalState.currentRoom.players} allCards={allCards} />
        )}
        
        <TurnIndicator currentPlayer={gameState.currentPlayer} coordinates={coordinates} orientation={orientation} />

        <View style={[styles.topSection, styles[`topSection_${orientation}`]]}>
          <RodadaInfo gameState={gameState} playerNickname={globalState.playerNickname} />
        </View>
        
        {opponents.map((player, index) => (
          <PlayerDisplay
            key={player.nickname}
            player={player}
            cardCount={gameState.playerCards?.[player.nickname]?.length || 0}
            totalCards={allCards.length}
            position={opponentPositions[index]}
            isCurrentPlayer={gameState.currentPlayer === player.nickname}
            orientation={orientation}
          />
        ))}

        <Arena
          gameState={gameState}
          allCards={allCards}
          isRoundEnding={showResultModal}
          onAnimationComplete={handleNextRound}
          animatingCardPlayer={animatingOpponentCard?.nickname}
          orientation={orientation}
        />

        <View 
          style={[styles.bottomSection, styles[`bottomSection_${orientation}`]]}
          onLayout={(event) => {
            playerHandLayoutRef.current = event.nativeEvent.layout;
            setCoordinate(globalState.playerNickname, event.nativeEvent.layout);
          }}
        >
          <AnimatedHand cards={playerHand} onSelectCard={handleCardSelection} hasPlayedCard={hasPlayedCard} isFirstRound={gameState.currentRound === 1} isVisible={isHandVisible}/>
        </View>

        {animatingOpponentCard && startPos && (
          <OpponentCardAnimation card={animatingOpponentCard.card} startPos={startPos} onAnimationComplete={clearAnimatingOpponentCard} />
        )}

        {cardToConfirm && (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationTitle}>
              {isCurrentPlayer ? 'Escolha um atributo:' : 'Sua carta:'}
            </Text>
            <Carta card={cardToConfirm} isRevealed={true} isSelected={true} isSelectable={false} isAttributeSelectable={isCurrentPlayer} onAttributeSelect={setTentativeAttribute} selectedAttribute={tentativeAttribute || undefined}/>
          </View>
        )}

        {cardToConfirm && isCurrentPlayer && !hasPlayedCard && (
            <View style={[ styles.actionButtonContainer, orientation === 'LANDSCAPE' && styles.actionButtonContainer_LANDSCAPE ]}>
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

        <ResultadoModal
          visible={showResultModal}
          roundResult={resultModalData}
          gameState={gameState}
          allCards={allCards}
          playerNickname={globalState.playerNickname}
          onClose={handleCloseGame}
          onNextRound={handleNextRound}
          isHost={isSinglePlayer || globalState.currentRoom?.hostNickname === globalState.playerNickname}
        />
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