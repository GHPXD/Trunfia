// src/screens/DeckSelectionScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ImageBackground, // 1. Importar ImageBackground
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Deck } from '../types';
import { useGame } from '../contexts/GameContext';
import BaralhoCard from '../components/common/BaralhoCard';
import { getUserData } from '../services/storageService';
import HapticFeedback from 'react-native-haptic-feedback';
import playSound from '../services/soundService';

type DeckSelectionNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DeckSelection'
>;

interface Props {
  navigation: DeckSelectionNavigationProp;
}

const AVAILABLE_DECKS: Deck[] = [
  {
    id: 'paises',
    name: 'Países',
    description:
      'Explore o mundo com dados de países como população, área e PIB',
    imageSource: require('../assets/images/paises-deck.png'),
    totalCards: 32,
    categories: ['População', 'Área', 'PIB', 'IDH'],
  },
  {
    id: 'capitais',
    name: 'Capitais',
    description:
      'Descubra capitais mundiais com população, altitude e fundação',
    imageSource: require('../assets/images/capitais-deck.png'),
    totalCards: 28,
    categories: ['População', 'Altitude', 'Fundação', 'Área Urbana'],
  },
];

const DeckSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setSelectedDeck, setPlayerNickname, setPlayerAvatar } = useGame();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        setPlayerNickname(userData.nickname);
        setPlayerAvatar(userData.avatar || null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }, [setPlayerNickname, setPlayerAvatar]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleDeckSelect = (deck: Deck) => {
    HapticFeedback.trigger('selection');
    playSound('SELECT');
    setSelectedDeckId(deck.id);
    setSelectedDeck(deck);
  };

  const handleContinueToLobby = async () => {
    if (!state.selectedDeck) {
      Alert.alert('Atenção', 'Por favor, selecione um baralho para continuar.');
      return;
    }
    HapticFeedback.trigger('impactMedium');
    playSound('CLICK');
    navigation.navigate('Lobby');
  };

  return (
    // 2. Usar o ImageBackground como container principal
    <ImageBackground
      source={require('../assets/images/table-background.png')}
      style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎴 Escolha seu Baralho</Text>
          <Text style={styles.subtitle}>
            Olá, {state.playerAvatar} {state.playerNickname}! Selecione um baralho:
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.decksContainer}>
            {AVAILABLE_DECKS.map(deck => (
              <BaralhoCard
                key={deck.id}
                deck={deck}
                isSelected={selectedDeckId === deck.id}
                onSelect={handleDeckSelect}
              />
            ))}
          </View>

          {state.selectedDeck && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedTitle}>
                Baralho Selecionado: {state.selectedDeck.name}
              </Text>
              <Text style={styles.selectedDescription}>
                Categorias: {state.selectedDeck.categories.join(', ')}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              !state.selectedDeck && styles.buttonDisabled,
            ]}
            onPress={handleContinueToLobby}
            disabled={!state.selectedDeck}>
            <Text style={styles.buttonText}>
              Continuar para o Lobby
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

// 3. Ajustar os estilos para o novo layout
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Overlay escuro para legibilidade
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#DDD',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  decksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    backgroundColor: 'rgba(227, 242, 253, 0.9)', // Ligeiramente transparente
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: '#1565C0',
  },
  footer: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default DeckSelectionScreen;