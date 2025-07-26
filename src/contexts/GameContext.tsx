// src/contexts/GameContext.tsx

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Deck, GameContextState, Room, User } from '../types';

// Ações do contexto
type GameAction =
  | { type: 'SET_USER_DATA'; payload: User }
  | { type: 'SET_SELECTED_DECK'; payload: Deck | null }
  | { type: 'SET_PLAYER_NICKNAME'; payload: string }
  | { type: 'SET_PLAYER_AVATAR'; payload: string | null }
  | { type: 'SET_CURRENT_ROOM'; payload: Room | null }
  | { type: 'SET_IN_ROOM'; payload: boolean }
  | { type: 'RESET_GAME' };

const initialState: GameContextState = {
  selectedDeck: null,
  playerNickname: '',
  playerAvatar: null,
  currentRoom: null,
  isInRoom: false,
  gameCards: [],
  playerHand: [],
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_USER_DATA':
      return {
        ...state,
        playerNickname: action.payload.nickname,
        playerAvatar: action.payload.avatar || null,
      };
    case 'SET_SELECTED_DECK':
      return { ...state, selectedDeck: action.payload };
    case 'SET_PLAYER_NICKNAME':
      return { ...state, playerNickname: action.payload };
    case 'SET_PLAYER_AVATAR':
      return { ...state, playerAvatar: action.payload };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload, isInRoom: action.payload !== null };
    case 'SET_IN_ROOM':
      return { ...state, isInRoom: action.payload };
    case 'RESET_GAME':
      return {
        ...initialState,
        playerNickname: state.playerNickname,
        playerAvatar: state.playerAvatar,
      };
    default:
      return state;
  }
};

interface GameContextType {
  state: GameContextState;
  setUserData: (userData: User) => void; // AQUI ESTÁ A CORREÇÃO
  setSelectedDeck: (deck: Deck | null) => void;
  setPlayerNickname: (nickname: string) => void;
  setPlayerAvatar: (avatar: string | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setInRoom: (inRoom: boolean) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setUserData = useCallback((userData: User) => {
    dispatch({ type: 'SET_USER_DATA', payload: userData });
  }, []);

  const setSelectedDeck = useCallback((deck: Deck | null) => {
    dispatch({ type: 'SET_SELECTED_DECK', payload: deck });
  }, []);

  const setPlayerNickname = useCallback((nickname: string) => {
    dispatch({ type: 'SET_PLAYER_NICKNAME', payload: nickname });
  }, []);

  const setPlayerAvatar = useCallback((avatar: string | null) => {
    dispatch({ type: 'SET_PLAYER_AVATAR', payload: avatar });
  }, []);

  const setCurrentRoom = useCallback((room: Room | null) => {
    dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
  }, []);

  const setInRoom = useCallback((inRoom: boolean) => {
    dispatch({ type: 'SET_IN_ROOM', payload: inRoom });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const value = React.useMemo(() => ({
    state,
    setUserData, // AQUI ESTÁ A CORREÇÃO
    setSelectedDeck,
    setPlayerNickname,
    setPlayerAvatar,
    setCurrentRoom,
    setInRoom,
    resetGame,
  }), [state, setUserData, setSelectedDeck, setPlayerNickname, setPlayerAvatar, setCurrentRoom, setInRoom, resetGame]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
};