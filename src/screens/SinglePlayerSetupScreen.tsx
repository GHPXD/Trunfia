// src/screens/SinglePlayerSetupScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Deck, BotDifficulty } from '../types';
import { useGame } from '../contexts/GameContext';
import BaralhoCard from '../components/common/BaralhoCard';

const AVAILABLE_DECKS: Deck[] = [
    { id: 'paises', name: 'Países', description: 'Explore o mundo com dados de países como população, área e PIB', imageSource: require('../assets/images/paises-deck.png'), totalCards: 32, categories: ['População', 'Área', 'PIB', 'IDH'] },
    { id: 'capitais', name: 'Capitais', description: 'Descubra capitais mundiais com população, altitude e fundação', imageSource: require('../assets/images/capitais-deck.png'), totalCards: 28, categories: ['População', 'Altitude', 'Fundação', 'Área Urbana'] },
];

const DIFFICULTIES: { level: BotDifficulty, label: string }[] = [
    { level: 'easy', label: 'Fácil' },
    { level: 'medium', label: 'Médio' },
    { level: 'hard', label: 'Difícil' },
];

type SinglePlayerSetupNavigationProp = StackNavigationProp<RootStackParamList, 'SinglePlayerSetup'>;

interface Props {
  navigation: SinglePlayerSetupNavigationProp;
}

const SinglePlayerSetupScreen: React.FC<Props> = ({ navigation }) => {
  const { setSelectedDeck } = useGame();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('medium');

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    setSelectedDeck(deck);
  };

  const handleStartGame = () => {
    if (!selectedDeckId) {
      Alert.alert('Atenção', 'Por favor, selecione um baralho para jogar.');
      return;
    }
    navigation.navigate('Game', { 
        roomId: `local_${new Date().getTime()}`, // Gera um ID único local
        gameMode: 'singleplayer', 
        botDifficulty: selectedDifficulty,
    });
  };

  return (
    <ImageBackground
      source={require('../assets/images/table-background.png')}
      style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>🕹️ Jogo Solo</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Escolha o Baralho</Text>
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
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Escolha a Dificuldade</Text>
            <View style={styles.difficultyContainer}>
                {DIFFICULTIES.map(({ level, label }) => (
                    <TouchableOpacity
                        key={level}
                        style={[
                            styles.difficultyButton,
                            selectedDifficulty === level && styles.difficultySelected
                        ]}
                        onPress={() => setSelectedDifficulty(level)}
                    >
                        <Text style={styles.difficultyButtonText}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        
        <View style={styles.footer}>
            <TouchableOpacity
                style={[styles.button, !selectedDeckId && styles.buttonDisabled]}
                onPress={handleStartGame}
                disabled={!selectedDeckId}
            >
                <Text style={styles.buttonText}>Iniciar Jogo</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>Voltar ao Menu</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginVertical: 20, },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  section: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderRadius: 12, marginBottom: 16, },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, },
  decksContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', },
  difficultyContainer: { flexDirection: 'row', justifyContent: 'space-around', },
  difficultyButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 2, borderColor: '#007AFF' },
  difficultySelected: { backgroundColor: '#007AFF' },
  difficultyButtonText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  difficultySelectedText: { color: '#FFF' },
  footer: { paddingBottom: 20, },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4CAF50', marginBottom: 12, },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  backButton: { alignItems: 'center' },
  backButtonText: { fontSize: 16, color: 'white', textDecorationLine: 'underline' },
});

export default SinglePlayerSetupScreen;