// src/components/game/BotController.tsx
import React, { useEffect, useRef } from 'react';
import { GameState, Card, Player } from '../../types';
import { executeBotTurn } from '../../services/botService';
import { selectBotMove } from '../../utils/botUtils';

interface BotControllerProps {
  roomId: string;
  gameState: GameState;
  players: { [key: string]: Player };
  allCards: Card[];
}

const BotController: React.FC<BotControllerProps> = ({ roomId, gameState, players, allCards }) => {
  const previousCurrentPlayer = useRef<string | null>(null);

  useEffect(() => {
    // Evita rodar a lógica se o gameState não estiver pronto ou se a fase não for de seleção
    if (!gameState || gameState.gamePhase !== 'selecting') {
      previousCurrentPlayer.current = gameState?.currentPlayer || null;
      return;
    }

    // Roda apenas quando o turno muda para um novo jogador
    if (gameState.currentPlayer !== previousCurrentPlayer.current) {
      previousCurrentPlayer.current = gameState.currentPlayer;

      const currentPlayerInfo = players[gameState.currentPlayer];
      
      // Verifica se o jogador do turno atual é um bot
      if (currentPlayerInfo && currentPlayerInfo.isBot) {
        // Atraso para simular o bot "pensando"
        const thinkTime = 1500 + Math.random() * 1000;

        setTimeout(() => {
          const botHandIds = gameState.playerCards[gameState.currentPlayer] || [];
          const botHand = botHandIds.map(id => allCards.find(c => c.id === id)).filter(Boolean) as Card[];
          
          if (botHand.length > 0) {
            // 1. Chamar a nova função de decisão inteligente
            const move = selectBotMove(
                botHand, 
                gameState, 
                allCards,
                currentPlayerInfo.botDifficulty || 'medium' // Usa a dificuldade definida ou um padrão
            );
            
            if (move) {
              // 2. Executar o turno com a carta e o atributo escolhidos
              executeBotTurn(roomId, gameState.currentPlayer, move.card, move.attribute);
            }
          }
        }, thinkTime);
      }
    }
  }, [gameState, players, allCards, roomId]);

  return null; // Este componente não renderiza nada
};

export default BotController;