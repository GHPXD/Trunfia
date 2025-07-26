// src/screens/LobbyScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  ImageBackground,
  FlatList,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';
import { RootStackParamList, Room } from '../types';
import { useGame } from '../contexts/GameContext';
import SalaItem from '../components/common/SalaItem';
import ChatModal from '../components/common/ChatModal';
import SettingsModal, { OrientationSetting } from '../components/common/SettingsModal';
import {
  createRoom,
  joinRoom,
  listRoomsByDeck,
  leaveRoom,
  listenToRoom,
  kickPlayerFromRoom,
} from '../services/firebaseService';
import { startGame } from '../services/gameService';
import { addBotToRoom, removeBotFromRoom, getBotPlayers } from '../services/botService';
import { validateRoomCode, formatRoomCode } from '../utils/roomUtils';
import { saveOrientationSetting, getOrientationSetting } from '../services/storageService';
import { getDeckCards } from '../data/decks';

type LobbyNavigationProp = StackNavigationProp<RootStackParamList, 'Lobby'>;

interface Props {
  navigation: LobbyNavigationProp;
}

const LobbyScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setCurrentRoom } = useGame();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [orientationSetting, setOrientationSetting] = useState<OrientationSetting>('automatic');

  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const roomListenerUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSetting = await getOrientationSetting();
      if (savedSetting) {
        setOrientationSetting(savedSetting);
      }
    };
    loadSettings();
  }, []);

  const handleOrientationChange = async (setting: OrientationSetting) => {
    setOrientationSetting(setting);
    await saveOrientationSetting(setting);
  };

  const loadPublicRooms = useCallback(async () => {
    if (!state.selectedDeck) return;
    try {
      const rooms = await listRoomsByDeck(state.selectedDeck.id);
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  }, [state.selectedDeck]);

  useEffect(() => {
    loadPublicRooms();
  }, [loadPublicRooms]);

  useEffect(() => {
    if (roomListenerUnsubscribe.current) {
      roomListenerUnsubscribe.current();
      roomListenerUnsubscribe.current = null;
    }

    const roomId = state.currentRoom?.id;

    if (roomId) {
      roomListenerUnsubscribe.current = listenToRoom(roomId, (updatedRoom) => {
        if (!updatedRoom) {
          setCurrentRoom(null);
          if (roomListenerUnsubscribe.current) {
            roomListenerUnsubscribe.current();
            roomListenerUnsubscribe.current = null;
          }
          showToast('A sala foi encerrada pelo host.');
          return;
        }

        if (updatedRoom.players && updatedRoom.players[state.playerNickname]) {
            setCurrentRoom(updatedRoom);
            if (updatedRoom.status === 'playing') {
                navigation.navigate('Game', { roomId: updatedRoom.id });
            }
        } else {
            showToast('Você foi removido da sala.');
            setCurrentRoom(null);
        }
      });
    }

    return () => {
      if (roomListenerUnsubscribe.current) {
        roomListenerUnsubscribe.current();
        roomListenerUnsubscribe.current = null;
      }
    };
  }, [state.currentRoom?.id, state.playerNickname, setCurrentRoom, navigation]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPublicRooms();
    setIsRefreshing(false);
  };

  const handleCreateRoom = async (isPrivate: boolean = false) => {
    if (!state.selectedDeck || !state.playerNickname || !state.playerAvatar) {
      showToast('Dados do jogador ou baralho não encontrados.');
      return;
    }
    setIsLoading(true);
    try {
      const room = await createRoom(state.playerNickname, state.playerAvatar, state.selectedDeck.id, state.selectedDeck.name, isPrivate);
      setCurrentRoom(room);
    } catch (error) {
      showToast('Não foi possível criar a sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (room?: Room) => {
    if (!state.playerNickname || !state.playerAvatar) {
        showToast('Dados do jogador não encontrados.');
        return;
    }
    setIsLoading(true);
    try {
      let targetRoom: Room;
      const codeToJoin = room?.code || roomCode;

      if (room) {
        targetRoom = await joinRoom(codeToJoin, state.playerNickname, state.playerAvatar);
      } else {
        if (!validateRoomCode(codeToJoin)) {
          showToast('Código inválido. Use 6 caracteres (letras e números).');
          setIsLoading(false);
          return;
        }
        targetRoom = await joinRoom(codeToJoin, state.playerNickname, state.playerAvatar);
      }
      setCurrentRoom(targetRoom);
      setRoomCode('');
    } catch (error: any) {
      showToast(error.message || 'Não foi possível entrar na sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!state.currentRoom) return;
    const { id: roomId } = state.currentRoom;
    const playerNickname = state.playerNickname;

    if (roomListenerUnsubscribe.current) {
      roomListenerUnsubscribe.current();
      roomListenerUnsubscribe.current = null;
    }

    setCurrentRoom(null);

    try {
      await leaveRoom(roomId, playerNickname);
    } catch (error) {
      console.error('Erro ao sair da sala no Firebase:', error);
    }
  };

  const handleKickPlayer = (playerToKick: string) => {
    if (!state.currentRoom) return;

    Alert.alert(
      'Confirmar Expulsão',
      `Tem certeza de que deseja expulsar "${playerToKick}" da sala?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Expulsar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await kickPlayerFromRoom(state.currentRoom!.id, playerToKick);
              showToast(`${playerToKick} foi expulso.`);
            } catch (error: any) {
              showToast(error.message || 'Não foi possível expulsar o jogador.');
            }
          } 
        },
      ]
    );
  };

  const toggleReadyStatus = async () => {
    if (!state.currentRoom) return;
    const currentStatus = state.currentRoom.players[state.playerNickname]?.isReady || false;
    try {
      const updates = {
        [`rooms/${state.currentRoom.id}/players/${state.playerNickname}/isReady`]: !currentStatus,
        [`rooms/${state.currentRoom.id}/lastActivity`]: new Date().toISOString(),
      };
      await update(ref(database), updates);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleStartGame = async () => {
    if (!state.currentRoom || !state.selectedDeck) return;
    const playerCount = Object.keys(state.currentRoom.players).length;
    if (playerCount < 2) {
      showToast('É necessário pelo menos 2 jogadores para iniciar.');
      return;
    }
    const allReady = Object.values(state.currentRoom.players).every(player => player.isReady);
    if (!allReady) {
      Alert.alert( 'Confirmar Início', 'Nem todos os jogadores estão marcados como "prontos". Deseja iniciar mesmo assim?',
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Iniciar', onPress: () => startGameNow() }]
      );
      return;
    }
    startGameNow();
  };

  const startGameNow = async () => {
    if (!state.currentRoom || !state.selectedDeck) return;
    setIsLoading(true);
    try {
      const allCards = getDeckCards(state.selectedDeck.id);
      const players = Object.keys(state.currentRoom.players);
      await startGame(state.currentRoom.id, players, allCards);
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      showToast('Não foi possível iniciar o jogo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBot = async () => {
    if (!state.currentRoom) return;
    const currentPlayerCount = Object.keys(state.currentRoom.players).length;
    if (currentPlayerCount >= state.currentRoom.maxPlayers) {
      showToast('Sala Lotada. Não é possível adicionar mais jogadores.');
      return;
    }
    setIsLoading(true);
    try {
      const botName = await addBotToRoom(state.currentRoom.id);
      console.log(`Bot ${botName} adicionado com sucesso`);
    } catch (error: any) {
      showToast(error.message || 'Não foi possível adicionar o bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBot = async () => {
    if (!state.currentRoom) return;
    const bots = getBotPlayers(state.currentRoom.players);
    if (bots.length === 0) {
      showToast('Não há bots na sala para remover.');
      return;
    }
    if (bots.length === 1) {
      confirmRemoveBot(bots[0].nickname);
      return;
    }
    const botOptions = bots.map(bot => ({ text: bot.nickname, onPress: () => confirmRemoveBot(bot.nickname) }));
    Alert.alert('Remover Bot', 'Selecione qual bot deseja remover:', [...botOptions, { text: 'Cancelar', style: 'cancel' }]);
  };

  const confirmRemoveBot = (botName: string) => {
    Alert.alert('Confirmar Remoção', `Deseja remover o bot "${botName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => executeRemoveBot(botName) },
    ]);
  };

  const executeRemoveBot = async (botName: string) => {
    if (!state.currentRoom) return;
    setIsLoading(true);
    try {
      await removeBotFromRoom(state.currentRoom.id, botName);
      console.log(`Bot ${botName} removido com sucesso`);
    } catch (error: any) {
      showToast(error.message || 'Não foi possível remover o bot');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInRoom = () => {
    if (!state.currentRoom || !state.currentRoom.players) return null;
    const players = state.currentRoom.players || {};
    const playerCount = Object.keys(players).length;
    const maxPlayers = state.currentRoom.maxPlayers || 4;
    const isHost = state.currentRoom.hostNickname === state.playerNickname;

    return (
        <>
            <View style={styles.roomHeader}>
                <View><Text style={styles.roomTitle}>Sala {state.currentRoom.code || 'N/A'}</Text><Text style={styles.roomSubtitle}>{state.currentRoom.deckName || 'Baralho não definido'}</Text></View>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}><Text style={styles.leaveButtonText}>Sair</Text></TouchableOpacity>
            </View>
            {isHost && (
                <View style={styles.botControlsSection}>
                <Text style={styles.sectionTitle}>Controles de Bot</Text>
                <View style={styles.botButtonsContainer}>
                    <TouchableOpacity style={[styles.botButton, styles.addBotButton, Object.keys(state.currentRoom.players).length >= state.currentRoom.maxPlayers && styles.botButtonDisabled]} onPress={handleAddBot} disabled={Object.keys(state.currentRoom.players).length >= state.currentRoom.maxPlayers || isLoading}>
                    <Text style={styles.botButtonText}>🤖 Adicionar Bot</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.botButton, styles.removeBotButton, getBotPlayers(state.currentRoom.players).length === 0 && styles.botButtonDisabled]} onPress={handleRemoveBot} disabled={getBotPlayers(state.currentRoom.players).length === 0 || isLoading}>
                    <Text style={styles.botButtonText}>🗑️ Remover Bot</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.botInfo}>Bots: {getBotPlayers(state.currentRoom.players).length} | Humanos: {Object.values(state.currentRoom.players).filter(p => !p.isBot).length}</Text>
                </View>
            )}
            <View style={styles.playersSection}>
                <Text style={styles.sectionTitle}>Jogadores ({playerCount}/{maxPlayers})</Text>
                <ScrollView style={styles.playersList}>
                {playerCount > 0 ? (
                    Object.values(players).map((player) => (
                    <View key={player.nickname} style={styles.playerItem}>
                        <Text style={styles.playerAvatar}>{player.avatar}</Text>
                        <Text style={styles.playerName}>{player.nickname}{player.isHost && ' 👑'}{player.isBot && ' 🤖'}</Text>
                        <Text style={[styles.playerStatus, player.isReady && styles.playerReady]}>{player.isBot ? 'Bot' : (player.isReady ? 'Pronto' : 'Aguardando')}</Text>
                        {isHost && player.nickname !== state.playerNickname && (
                          <TouchableOpacity 
                            style={styles.kickButton} 
                            onPress={() => handleKickPlayer(player.nickname)}
                          >
                            <Text style={styles.kickButtonText}>✕</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                    ))
                ) : (<View style={styles.emptyPlayersContainer}><Text style={styles.emptyPlayersText}>Aguardando jogadores...</Text></View>)}
                </ScrollView>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.chatButton} onPress={() => setShowChatModal(true)}><Text style={styles.chatButtonText}>💬 Chat</Text></TouchableOpacity>
                {!isHost && (
                <TouchableOpacity style={[styles.readyButton, state.currentRoom.players[state.playerNickname]?.isReady && styles.readyButtonActive]} onPress={toggleReadyStatus}>
                    <Text style={[styles.readyButtonText, state.currentRoom.players[state.playerNickname]?.isReady && styles.readyButtonTextActive]}>{state.currentRoom.players[state.playerNickname]?.isReady ? '✓ Pronto' : 'Marcar como Pronto'}</Text>
                </TouchableOpacity>
                )}
                {isHost && (
                <TouchableOpacity style={[styles.startButton, isLoading && styles.startButtonDisabled]} onPress={handleStartGame} disabled={isLoading}><Text style={styles.startButtonText}>{isLoading ? 'Iniciando...' : 'Iniciar Jogo'}</Text></TouchableOpacity>
                )}
            </View>
        </>
    );
  };
  
  const renderOutOfRoom = () => (
    <FlatList
      data={publicRooms}
      renderItem={({ item }) => (
        <SalaItem room={item} onJoin={handleJoinRoom} isLoading={isLoading} />
      )}
      keyExtractor={(item) => item.id}
      style={styles.content}
      contentContainerStyle={styles.listContentContainer}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Text style={styles.title}>🎮 Lobby</Text>
            <Text style={styles.subtitle}>{state.playerAvatar} {state.playerNickname} • {state.selectedDeck?.name}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Criar Nova Sala</Text>
            <View style={styles.createButtons}>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => handleCreateRoom(false)} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Criando...' : 'Sala Pública'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => handleCreateRoom(true)} disabled={isLoading}>
                <Text style={styles.buttonTextSecondary}>{isLoading ? 'Criando...' : 'Sala Privada'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entrar com Código</Text>
            <View style={styles.joinContainer}>
              <TextInput style={styles.codeInput} value={roomCode} onChangeText={(text) => setRoomCode(formatRoomCode(text))} placeholder="Digite o código" placeholderTextColor="#999" maxLength={6} autoCapitalize="characters" returnKeyType="join" onSubmitEditing={() => handleJoinRoom()} />
              <TouchableOpacity style={[styles.joinButton, (!validateRoomCode(roomCode) || isLoading) && styles.joinButtonDisabled]} onPress={() => handleJoinRoom()} disabled={!validateRoomCode(roomCode) || isLoading}>
                <Text style={styles.joinButtonText}>{isLoading ? '...' : 'Entrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.listHeaderSection}>
            <Text style={styles.sectionTitle}>Salas Públicas ({publicRooms.length})</Text>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma sala pública disponível.{'\n'}Seja o primeiro a criar uma!</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    />
  );

  return (
    <ImageBackground
      source={require('../assets/images/table-background.png')}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Toast message={toastMessage} animatedValue={toastAnim} />
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
        
        {state.currentRoom ? (
            <View style={styles.roomContainer}>{renderInRoom()}</View>
        ) : (
            renderOutOfRoom()
        )}
        
        {isLoading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#007AFF" /></View>)}
        {state.currentRoom && (
            <ChatModal visible={showChatModal} onClose={() => setShowChatModal(false)} roomId={state.currentRoom.id} playerNickname={state.playerNickname} />
        )}
        <SettingsModal
            visible={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            currentSetting={orientationSetting}
            onSettingChange={handleOrientationChange}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const Toast = ({ message, animatedValue }: { message: string, animatedValue: Animated.Value }) => {
    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: animatedValue }] }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, backgroundColor: '#d9534f', padding: 16, borderRadius: 8, zIndex: 9999, alignItems: 'center' },
  toastText: { color: '#FFF', fontWeight: '600', textAlign: 'center' },
  settingsButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  settingsButtonText: { fontSize: 28, color: '#FFF' },
  header: { padding: 24, paddingTop: 60, backgroundColor: 'transparent' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: '#DDD', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 },
  content: { flex: 1 },
  listContentContainer: { paddingHorizontal: 16 },
  section: { padding: 24, backgroundColor: 'rgba(255,255,255,0.9)', marginBottom: 8, borderRadius: 12 },
  listHeaderSection: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  createButtons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#007AFF' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#007AFF' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  buttonTextSecondary: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  joinContainer: { flexDirection: 'row', gap: 12 },
  codeInput: { flex: 1, height: 48, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontFamily: 'monospace', textAlign: 'center', color: '#333', backgroundColor: '#FFF' },
  joinButton: { paddingHorizontal: 24, height: 48, backgroundColor: '#007AFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  joinButtonDisabled: { backgroundColor: '#CCC' },
  joinButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  emptyContainer: { padding: 32, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  roomContainer: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: 'transparent' },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 },
  roomTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  roomSubtitle: { fontSize: 14, color: '#666' },
  leaveButton: { backgroundColor: '#F44336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  leaveButtonText: { color: '#FFF', fontWeight: '600' },
  botControlsSection: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, marginBottom: 16 },
  botButtonsContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  botButton: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBotButton: { backgroundColor: '#4CAF50' },
  removeBotButton: { backgroundColor: '#F44336' },
  botButtonDisabled: { backgroundColor: '#CCC', opacity: 0.6 },
  botButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  botInfo: { fontSize: 12, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  playersSection: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, marginBottom: 16 },
  playersList: { maxHeight: 200 },
  playerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  playerAvatar: { fontSize: 20, marginRight: 12 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  playerStatus: { fontSize: 14, color: '#999', marginRight: 16 },
  playerReady: { color: '#4CAF50', fontWeight: '600' },
  kickButton: { backgroundColor: '#F44336', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', },
  kickButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, lineHeight: 16 },
  emptyPlayersContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyPlayersText: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  chatButton: { flex: 1, height: 48, backgroundColor: '#FF9800', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chatButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  readyButton: { flex: 1, height: 48, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#4CAF50', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  readyButtonActive: { backgroundColor: '#4CAF50' },
  readyButtonText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },
  readyButtonTextActive: { color: '#FFF' },
  startButton: { flex: 2, height: 48, backgroundColor: '#4CAF50', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  startButtonDisabled: { backgroundColor: '#CCC', opacity: 0.6 },
  startButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default LobbyScreen;