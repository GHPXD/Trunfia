// src/utils/botUtils.ts
import { Card, GameState, BotDifficulty } from '../types';

/**
 * Calcula a "força" de um atributo.
 * A força é a porcentagem de cartas restantes no jogo que este valor venceria.
 * @param attributeValue O valor do atributo a ser testado.
 * @param attributeName O nome do atributo (para checar regras especiais como 'Fundação').
 * @param remainingCards O conjunto de todas as cartas ainda em jogo.
 * @returns Uma pontuação de 0 a 1 representando a chance de vitória.
 */
const calculateAttributeStrength = (
  attributeValue: number,
  attributeName: string,
  remainingCards: Card[]
): number => {
  if (remainingCards.length === 0) return 1; // Se não houver outras cartas, ele sempre vence.

  const lowerIsBetter = attributeName === 'Fundação';
  let cardsBeaten = 0;

  remainingCards.forEach(card => {
    const opponentValue = card.attributes[attributeName];
    if (opponentValue === undefined) return;

    if (lowerIsBetter) {
      if (attributeValue < opponentValue) {
        cardsBeaten++;
      }
    } else {
      if (attributeValue > opponentValue) {
        cardsBeaten++;
      }
    }
  });

  return cardsBeaten / remainingCards.length;
};

/**
 * O bot seleciona o melhor movimento possível com base no estado atual do jogo.
 * @param botHand A mão atual do bot.
 * @param gameState O estado completo do jogo.
 * @param allCards Todas as cartas do baralho.
 * @param difficulty A dificuldade do bot (ainda não implementado, mas preparado para o futuro).
 * @returns A carta e o atributo escolhidos.
 */
export const selectBotMove = (
  botHand: Card[],
  gameState: GameState,
  allCards: Card[],
  difficulty: BotDifficulty
): { card: Card; attribute: string } | null => {
  if (botHand.length === 0) return null;

  // 1. Descobrir quais cartas ainda estão em jogo (não estão na mão do bot)
  const botHandIds = new Set(botHand.map(c => c.id));
  const allPlayerCardIds = new Set(Object.values(gameState.playerCards).flat());
  
  const remainingCardsInPlay = allCards.filter(
    card => allPlayerCardIds.has(card.id) && !botHandIds.has(card.id)
  );

  let bestMove = {
    card: botHand[0],
    attribute: Object.keys(botHand[0].attributes)[0],
    maxStrength: -1,
  };

  // 2. Iterar sobre cada carta na mão do bot
  botHand.forEach(card => {
    // 3. Para cada carta, iterar sobre seus atributos
    Object.entries(card.attributes).forEach(([attribute, value]) => {
      // 4. Calcular a força de cada atributo contra as cartas restantes
      const strength = calculateAttributeStrength(value, attribute, remainingCardsInPlay);
      
      // 5. Se esta jogada for mais forte que a melhor encontrada até agora, atualiza
      if (strength > bestMove.maxStrength) {
        bestMove = {
          card: card,
          attribute: attribute,
          maxStrength: strength,
        };
      }
    });
  });

  return { card: bestMove.card, attribute: bestMove.attribute };
};