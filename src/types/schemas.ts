// src/types/schemas.ts

import { z } from 'zod';

// Esquema para um jogador individual
export const PlayerSchema = z.object({
  nickname: z.string(),
  avatar: z.string().nullable(),
  isHost: z.boolean(),
  joinedAt: z.string(),
  isReady: z.boolean(),
  status: z.enum(['active', 'eliminated']).optional(),
  isBot: z.boolean().optional(),
  botDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  cardsCount: z.number().optional(),
});

// Esquema para o estado do jogo
export const GameStateSchema = z.object({
  currentRound: z.number(),
  currentPlayer: z.string(),
  gamePhase: z.enum(['spinning', 'selecting', 'revealing', 'comparing', 'finished', 'tie']),
  playerCards: z.record(z.string(), z.array(z.string())),
  currentRoundCards: z.record(z.string(), z.string()),
  selectedAttribute: z.string().nullable(),
  roundWinner: z.string().nullable(),
  gameWinner: z.string().nullable(),
  roundHistory: z.array(z.any()),
  spinResult: z.string().optional(),
  botActions: z.record(z.string(), z.any()).optional(),
  tiePot: z.array(z.string()).optional(),
});

// Esquema para uma sala de jogo
// AQUI ESTÁ A CORREÇÃO PRINCIPAL:
// Usamos .refine() para criar uma regra condicional.
export const RoomSchema = z.object({
  id: z.string(),
  code: z.string(),
  hostNickname: z.string(),
  deckId: z.string(),
  deckName: z.string(),
  players: z.record(z.string(), PlayerSchema),
  status: z.enum(['waiting', 'playing', 'finished']),
  isPrivate: z.boolean(),
  maxPlayers: z.number(),
  createdAt: z.string(),
  lastActivity: z.string(),
  gameState: GameStateSchema.optional(), // O campo é opcional...
}).refine(data => {
    // ...MAS, se o status for 'playing' ou 'finished', ele DEVE existir.
    if (data.status === 'playing' || data.status === 'finished') {
        return data.gameState != null;
    }
    return true; // Se o status for 'waiting', não validamos o gameState.
}, {
    message: "gameState é obrigatório quando o jogo está em andamento ou finalizado",
    path: ["gameState"], // Caminho do erro
});