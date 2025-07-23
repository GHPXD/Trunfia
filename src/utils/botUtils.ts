// src/utils/botUtils.ts

import { Card, BotDecision } from '../types';

/**
 * Gera nomes aleatórios para bots
 */
const BOT_NAMES = [
  'Boteco do Alphinha',     // Sempre no bar, nunca no código 🍻
  'Betadinho Nervoso',      // Vive em beta e surtando 😬
  'Gamagrelado',            // Magrelo e bugado 🦴
  'Deltarado',              // Fala cada bobagem... 🤪
  'Sigmãe',                 // Lidera, mas com carinho ❤️
  'Omega 3',                // O único saudável do grupo 🐟
  'Bot Primeira Dose',      // Só funciona depois da vacina 💉
  'NeoCóptero',             // Vive voando, nunca no chão 🚁
  'Zezeta do Grau',         // Dá grau até no terminal 🏍️
  'Kappacete',              // Vive caindo, mas usa capacete 🪖
  'Lambdinha do Grau',      // Curte matemática e rolezera 🤓
  'Tetinha 3000'            // Ícone, lenda, patrimônio nacional 🐄
];

export const generateBotName = (existingPlayers: string[]): string => {
  const availableNames = BOT_NAMES.filter(name => !existingPlayers.includes(name));

  if (availableNames.length === 0) {
    let counter = 1;
    let botName = `Bot ${counter}`;
    while (existingPlayers.includes(botName)) {
      counter++;
      botName = `Bot ${counter}`;
    }
    return botName;
  }

  const randomIndex = Math.floor(Math.random() * availableNames.length);
  return availableNames[randomIndex];
};

/**
 * Encontra o melhor atributo de uma carta (maior valor)
 */
export const findBestAttribute = (card: Card): { attribute: string; value: number } => {
  let bestAttribute = '';
  let bestValue = -Infinity;

  Object.entries(card.attributes).forEach(([attribute, value]) => {
    // Exceção para o atributo 'Fundação', onde menor é melhor.
    const isLowerBetter = attribute === 'Fundação';
    if (isLowerBetter) {
      // Temporariamente não implementado para manter a lógica simples,
      // mas aqui seria o local para uma estratégia diferente.
      // Por enquanto, o bot não será especialista em 'Fundação'.
    }

    if (value > bestValue) {
      bestValue = value;
      bestAttribute = attribute;
    }
  });

  return { attribute: bestAttribute, value: bestValue };
};

/**
 * Estratégia de seleção para bots (MELHORADA).
 */
export const selectBestCard = (
  playerCards: string[],
  allCards: Card[]
): BotDecision => {
  const availableCards = playerCards
    .map(cardId => allCards.find(card => card.id === cardId))
    .filter(Boolean) as Card[];

  if (availableCards.length === 0) {
    throw new Error('Nenhuma carta disponível para o bot');
  }

  let bestCardOverall: Card | null = null;
  let bestAttributeOverall = { attribute: '', value: -Infinity };
  
  // Itera sobre todas as cartas para encontrar a melhor jogada possível
  for (const card of availableCards) {
    const cardBestAttribute = findBestAttribute(card);
    if (cardBestAttribute.value > bestAttributeOverall.value) {
      bestAttributeOverall = cardBestAttribute;
      bestCardOverall = card;
    }
  }

  if (!bestCardOverall) {
      // Fallback para o caso de nenhuma carta ser encontrada (improvável)
      bestCardOverall = availableCards[0];
      bestAttributeOverall = findBestAttribute(bestCardOverall);
  }

  const reasoning = `Analisou ${availableCards.length} cartas e escolheu '${bestCardOverall.name}' por causa do seu melhor atributo: '${bestAttributeOverall.attribute}'.`;
  const confidence = 0.95; // Confiança maior, pois a decisão é baseada em dados

  return {
    selectedCardId: bestCardOverall.id,
    selectedAttribute: bestAttributeOverall.attribute,
    confidence,
    reasoning,
  };
};

/**
 * Calcula tempo de "pensamento" do bot.
 */
export const getBotThinkingTime = (): number => {
  return Math.random() * 1500 + 1000; // 1-2.5s
};

/**
 * Gera mensagem de chat ocasional para bots (opcional)
 */
const BOT_MESSAGES = [
  'Boa jogada!',
  'Interessante...',
  'Vamos ver...',
  'Essa foi difícil!',
  'Parabéns!',
  'Próxima rodada!',
];

export const generateBotChatMessage = (): string | null => {
  if (Math.random() < 0.2) {
    const randomIndex = Math.floor(Math.random() * BOT_MESSAGES.length);
    return BOT_MESSAGES[randomIndex];
  }
  return null;
};