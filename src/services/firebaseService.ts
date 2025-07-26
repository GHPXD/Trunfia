// src/services/firebaseService.ts

import {
  ref,
  push,
  set,
  get,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  update
} from 'firebase/database';
import { database } from '../config/firebase';
import { Room, Player, ChatMessage } from '../types';
import { generateRoomCode } from '../utils/roomUtils';
import { RoomSchema } from '../types/schemas';
import { shuffleArray } from '../utils/gameUtils';

const ROOMS_PATH = 'rooms';
const CHAT_PATH = 'chat';

export const createRoom = async (
  hostNickname: string,
  hostAvatar: string,
  deckId: string,
  deckName: string,
  isPrivate: boolean = false
): Promise<Room> => {
  try {
    const roomCode = generateRoomCode();
    const roomRef = push(ref(database, ROOMS_PATH));
    const roomId = roomRef.key;
    
    if (!roomId) {
      throw new Error('Erro ao gerar ID da sala');
    }

    const hostPlayer: Player = {
      nickname: hostNickname,
      avatar: hostAvatar,
      isHost: true,
      joinedAt: new Date().toISOString(),
      isReady: true,
      status: 'active',
    };

    const newRoom: Omit<Room, 'gameState'> = {
      id: roomId,
      code: roomCode,
      hostNickname,
      deckId,
      deckName,
      players: {
        [hostNickname]: hostPlayer,
      },
      status: 'waiting',
      isPrivate,
      maxPlayers: 4,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    await set(roomRef, newRoom);
    return { ...newRoom, gameState: undefined };
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    throw new Error('Não foi possível criar a sala');
  }
};

export const joinRoom = async (
  roomCode: string,
  playerNickname: string,
  playerAvatar: string
): Promise<Room> => {
  try {
    const roomsRef = ref(database, ROOMS_PATH);
    const roomsQuery = query(roomsRef, orderByChild('code'), equalTo(roomCode.toUpperCase()));
    const snapshot = await get(roomsQuery);

    if (!snapshot.exists()) {
      throw new Error('Sala não encontrada');
    }

    const rooms = snapshot.val();
    const roomId = Object.keys(rooms)[0];
    const room: Room = rooms[roomId];

    if (room.status !== 'waiting') {
      throw new Error('Esta sala já iniciou o jogo');
    }

    if (Object.keys(room.players).length >= room.maxPlayers) {
      throw new Error('Sala lotada');
    }

    if (room.players[playerNickname]) {
      throw new Error('Já existe um jogador com este nickname na sala');
    }

    const newPlayer: Player = {
      nickname: playerNickname,
      avatar: playerAvatar,
      isHost: false,
      joinedAt: new Date().toISOString(),
      isReady: false,
      status: 'active',
    };

    const updates = {
      [`${ROOMS_PATH}/${roomId}/players/${playerNickname}`]: newPlayer,
      [`${ROOMS_PATH}/${roomId}/lastActivity`]: new Date().toISOString(),
    };

    await update(ref(database), updates);

    const updatedRoom = { ...room, players: { ...room.players, [playerNickname]: newPlayer } };
    return updatedRoom;
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    throw error;
  }
};

export const listRoomsByDeck = async (deckId: string): Promise<Room[]> => {
  try {
    const roomsRef = ref(database, ROOMS_PATH);
    const roomsQuery = query(roomsRef, orderByChild('deckId'), equalTo(deckId));
    const snapshot = await get(roomsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const rooms = snapshot.val();
    
    const publicRooms = Object.values(rooms as { [key: string]: Room })
      .filter(room => !room.isPrivate && room.status === 'waiting')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return publicRooms;
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    return [];
  }
};

export const leaveRoom = async (roomId: string, playerNickname: string): Promise<void> => {
  try {
    const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const room: Room = snapshot.val();

    // Use update para remover um jogador, é mais seguro que `remove` direto no path
    const updates = {
      [`${ROOMS_PATH}/${roomId}/players/${playerNickname}`]: null,
    };
    await update(ref(database), updates);

    const remainingPlayers = Object.keys(room.players).filter(p => p !== playerNickname);

    if (remainingPlayers.length === 0) {
      await remove(roomRef);
      return;
    }

    if (room.hostNickname === playerNickname) {
      const newHostNickname = remainingPlayers[0];
      const hostUpdates = {
        [`${ROOMS_PATH}/${roomId}/hostNickname`]: newHostNickname,
        [`${ROOMS_PATH}/${roomId}/players/${newHostNickname}/isHost`]: true,
        [`${ROOMS_PATH}/${roomId}/lastActivity`]: new Date().toISOString(),
      };
      await update(ref(database), hostUpdates);
    }
  } catch (error) {
    console.error('Erro ao sair da sala:', error);
  }
};

export const listenToRoom = (
  roomId: string,
  callback: (room: Room | null) => void
): (() => void) => {
  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const roomData = snapshot.exists() ? snapshot.val() : null;
    
    if (roomData) {
      const validationResult = RoomSchema.safeParse(roomData);

      if (validationResult.success) {
        callback(validationResult.data);
      } else {
        // Loga o erro mas não necessariamente limpa a sala para o usuário,
        // evitando que a tela pisque ou desmonte por um erro temporário de dados.
        console.error('❌ Erro de validação de dados da sala:', validationResult.error.flatten());
      }
    } else {
      callback(null);
    }
  });

  return () => off(roomRef, 'value', unsubscribe);
};

export const sendChatMessage = async (
  roomId: string,
  nickname: string,
  message: string
): Promise<void> => {
  try {
    const chatRef = ref(database, `${CHAT_PATH}/${roomId}`);
    const newMessageRef = push(chatRef);
    
    const chatMessage: ChatMessage = {
      id: newMessageRef.key || '',
      nickname,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    await set(newMessageRef, chatMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};

export const listenToChatMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const chatRef = ref(database, `${CHAT_PATH}/${roomId}`);
  const chatQuery = query(chatRef, orderByChild('timestamp'));
  
  const unsubscribe = onValue(chatQuery, (snapshot) => {
    if (snapshot.exists()) {
      const messages = snapshot.val();
      const messageList = Object.values(messages as { [key: string]: ChatMessage })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(messageList);
    } else {
      callback([]);
    }
  });

  return () => off(chatRef, 'value', unsubscribe);
};

export const findAndJoinQuickMatch = async (
    playerNickname: string,
    playerAvatar: string,
    deckId: string
): Promise<Room | null> => {
    try {
        const roomsRef = ref(database, ROOMS_PATH);
        const roomsQuery = query(
            roomsRef, 
            orderByChild('deckId'), 
            equalTo(deckId)
        );
        const snapshot = await get(roomsQuery);

        if (!snapshot.exists()) {
            return null;
        }

        const rooms = snapshot.val();
        
        const availableRooms = Object.values(rooms as { [key: string]: Room }).filter(
            (room) => 
                !room.isPrivate && 
                room.status === 'waiting' &&
                Object.keys(room.players).length < room.maxPlayers
        );

        if (availableRooms.length === 0) {
            return null;
        }

        const shuffledRooms = shuffleArray(availableRooms);
        const roomToJoin = shuffledRooms[0];

        return await joinRoom(roomToJoin.code, playerNickname, playerAvatar);

    } catch (error) {
        console.error("Erro ao procurar partida rápida:", error);
        throw new Error('Não foi possível encontrar uma partida');
    }
};

export const kickPlayerFromRoom = async (roomId: string, playerToKick: string): Promise<void> => {
  try {
    const playerRef = ref(database, `${ROOMS_PATH}/${roomId}/players/${playerToKick}`);
    await remove(playerRef);
    console.log(`Jogador ${playerToKick} expulso da sala ${roomId}.`);
  } catch (error) {
    console.error(`Erro ao expulsar jogador ${playerToKick}:`, error);
    throw new Error('Não foi possível expulsar o jogador.');
  }
};