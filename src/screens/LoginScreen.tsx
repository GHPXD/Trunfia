// src/screens/LoginScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { validateNickname, formatNickname } from '../utils/validation';
import { saveUserData, getUserData } from '../services/storageService';
import { CHARACTER_AVATARS, COLORS } from '../constants';
import { scaleWidth, scaleFont } from '../utils/dimensions';
import { useGame } from '../contexts/GameContext'; // Importar o hook do contexto

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { setUserData } = useGame(); // Obter a função para definir os dados do usuário
  const [nickname, setNickname] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const checkExistingUser = useCallback(async () => {
    try {
      const savedUser = await getUserData();
      if (savedUser?.nickname && savedUser.avatar) {
        // LÓGICA DE LOGIN AUTOMÁTICO
        setUserData(savedUser); // 1. Preenche o estado global com os dados salvos
        navigation.replace('MainMenu'); // 2. Pula a tela de login
      } else {
        // Se não houver usuário, exibe a tela de login
        setIsCheckingStorage(false);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário existente:', error);
      setIsCheckingStorage(false); // Garante que a tela apareça em caso de erro
    }
  }, [navigation, setUserData]);

  useEffect(() => {
    checkExistingUser();
  }, [checkExistingUser]);

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    if (text.length > 0) {
      const validation = validateNickname(text);
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleLogin = async () => {
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Nickname inválido');
      return;
    }
    if (!selectedAvatarId) {
        Alert.alert('Atenção', 'Por favor, escolha um avatar.');
        return;
    }

    setIsLoading(true);
    try {
      const formattedNickname = formatNickname(nickname);
      const userData = {
        nickname: formattedNickname,
        avatar: selectedAvatarId,
        createdAt: new Date().toISOString(),
      };
      await saveUserData(userData);
      setUserData(userData); // Atualiza o estado global
      navigation.replace('MainMenu'); 
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar seus dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validateNickname(nickname).isValid && selectedAvatarId !== null;

  if (isCheckingStorage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Trunfia</Text>
          <Text style={styles.subtitle}>Crie seu perfil para começar a jogar</Text>
        </View>

        <View style={styles.avatarSection}>
            <Text style={styles.inputLabel}>Escolha seu avatar:</Text>
            <View style={styles.avatarGrid}>
                {CHARACTER_AVATARS.map((avatar) => (
                    <TouchableOpacity
                        key={avatar.id}
                        style={[
                            styles.avatarContainer,
                            selectedAvatarId === avatar.id && styles.avatarSelected
                        ]}
                        onPress={() => setSelectedAvatarId(avatar.id)}
                    >
                        <Image source={avatar.source} style={styles.avatarImage} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Seu apelido:</Text>
          <TextInput
            style={[
              styles.input,
              validationError ? styles.inputError :
              (nickname.length > 0 && !validationError) ? styles.inputValid : null
            ]}
            value={nickname}
            onChangeText={handleNicknameChange}
            placeholder="Digite seu apelido"
            placeholderTextColor={COLORS.mediumGray}
            maxLength={15}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Text style={styles.characterCount}>{nickname.length}/15 caracteres</Text>
          {validationError && (<Text style={styles.errorText}>{validationError}</Text>)}
        </View>

        <TouchableOpacity
          style={[styles.button, isFormValid ? styles.buttonEnabled : styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (<ActivityIndicator color={COLORS.white} />) : (<Text style={styles.buttonText}>Entrar</Text>)}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.lightGray },
  loadingText: { marginTop: scaleWidth(16), fontSize: scaleFont(16), color: COLORS.textLight },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: scaleWidth(32) },
  header: { alignItems: 'center', marginBottom: scaleWidth(32) },
  title: { fontSize: scaleFont(32), fontWeight: 'bold', color: COLORS.darkGray, marginBottom: scaleWidth(8) },
  subtitle: { fontSize: scaleFont(16), color: COLORS.textLight, textAlign: 'center', lineHeight: scaleFont(22) },
  avatarSection: { marginBottom: scaleWidth(24) },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: scaleWidth(12) },
  avatarContainer: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    padding: scaleWidth(3),
    overflow: 'hidden',
  },
  avatarSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    transform: [{ scale: 1.1 }],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleWidth(30),
  },
  inputSection: { marginBottom: scaleWidth(24) },
  inputLabel: { fontSize: scaleFont(16), fontWeight: '600', color: COLORS.darkGray, marginBottom: scaleWidth(8) },
  input: {
    height: scaleWidth(56),
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: scaleWidth(12),
    paddingHorizontal: scaleWidth(16),
    fontSize: scaleFont(16),
    backgroundColor: COLORS.white,
    color: COLORS.darkGray,
  },
  inputValid: { borderColor: COLORS.success },
  inputError: { borderColor: COLORS.danger },
  characterCount: { fontSize: scaleFont(12), color: COLORS.mediumGray, textAlign: 'right', marginTop: scaleWidth(4) },
  errorText: { fontSize: scaleFont(14), color: COLORS.danger, marginTop: scaleWidth(8) },
  button: { height: scaleWidth(56), borderRadius: scaleWidth(12), justifyContent: 'center', alignItems: 'center', marginBottom: scaleWidth(24) },
  buttonEnabled: { backgroundColor: COLORS.primary },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { fontSize: scaleFont(18), fontWeight: '600', color: COLORS.white },
});

export default LoginScreen;