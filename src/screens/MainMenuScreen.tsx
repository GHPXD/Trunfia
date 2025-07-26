// src/screens/MainMenuScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Deck } from '../types';
import { useGame } from '../contexts/GameContext';
import { findAndJoinQuickMatch } from '../services/firebaseService';
import { getAvatarSourceById } from '../constants';
import { scaleWidth, scaleFont } from '../utils/dimensions';

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
  navigation: MainMenuNavigationProp;
}

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setCurrentRoom, setSelectedDeck } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const avatarSource = getAvatarSourceById(state.playerAvatar);

  // Corrigido para ser mais específico com os tipos
  const handleNavigation = (screen: 'SinglePlayerSetup' | 'DeckSelection') => {
    navigation.navigate(screen);
  };

  const handleComingSoon = () => {
    Alert.alert('Em Breve!', 'Esta funcionalidade ainda está em desenvolvimento.');
  };

  const handleQuickMatch = async () => {
    setIsLoading(true);
    const decks: Pick<Deck, 'id' | 'name'>[] = [ { id: 'paises', name: 'Países' }, { id: 'capitais', name: 'Capitais' } ];
    const randomDeckInfo = decks[Math.floor(Math.random() * decks.length)];
    
    // Apenas para o contexto, não precisa de todos os dados
    const randomDeck: Deck = { ...randomDeckInfo, description: '', imageSource: '', totalCards: 0, categories: [] };
    setSelectedDeck(randomDeck);

    if (state.playerNickname && state.playerAvatar) {
      try {
        const room = await findAndJoinQuickMatch(state.playerNickname, state.playerAvatar, randomDeck.id);
        if (room) {
          setCurrentRoom(room);
          navigation.navigate('Lobby');
        } else {
          Alert.alert('Nenhuma sala encontrada', 'Não há salas públicas com vagas no momento. Que tal criar uma?');
        }
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível encontrar uma partida.');
      }
    } else {
      Alert.alert('Erro', 'Não foi possível obter os dados do jogador.');
    }
    
    setIsLoading(false);
  };

  return (
    <ImageBackground
      source={require('../assets/images/table-background.png')}
      style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {avatarSource ? (
            <View style={styles.avatarContainer}>
              <Image source={avatarSource} style={styles.avatarImage} />
            </View>
          ) : (
            <Text style={styles.avatarText}>{state.playerAvatar}</Text>
          )}
          <Text style={styles.welcomeText}>Bem-vindo, {state.playerNickname}!</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => handleNavigation('SinglePlayerSetup')}
          >
            <Text style={styles.menuButtonText}>🕹️ Singleplayer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => handleNavigation('DeckSelection')}
          >
            <Text style={styles.menuButtonText}>🌐 Multiplayer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, isLoading && styles.buttonDisabled]}
            onPress={handleQuickMatch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.menuButtonText}>⚡ Partida Rápida</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.secondaryButton]} 
            onPress={handleComingSoon}
          >
            <Text style={styles.secondaryButtonText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.secondaryButton]} 
            onPress={handleComingSoon}
          >
            <Text style={styles.secondaryButtonText}>Sobre</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: scaleWidth(24) },
  header: { alignItems: 'center', marginBottom: scaleWidth(48) },
  avatarContainer: { width: scaleWidth(100), height: scaleWidth(100), borderRadius: scaleWidth(50), backgroundColor: 'rgba(255,255,255,0.2)', padding: scaleWidth(5), borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: scaleWidth(45) },
  avatarText: { fontSize: scaleFont(64) },
  welcomeText: { fontSize: scaleFont(22), fontWeight: 'bold', color: '#FFF', marginTop: scaleWidth(16), textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  menuContainer: { width: '100%', maxWidth: 400 },
  menuButton: { backgroundColor: '#007AFF', paddingVertical: scaleWidth(18), borderRadius: scaleWidth(12), alignItems: 'center', marginBottom: scaleWidth(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, minHeight: scaleWidth(58) },
  buttonDisabled: { backgroundColor: '#999' },
  menuButtonText: { fontSize: scaleFont(18), color: '#FFF', fontWeight: '600' },
  secondaryButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.5)' },
  secondaryButtonText: { fontSize: scaleFont(16), color: '#FFF', fontWeight: '500' },
});

export default MainMenuScreen;