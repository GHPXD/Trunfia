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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { validateNickname, formatNickname } from '../utils/validation';
import { saveUserData, getUserData } from '../services/storageService';
import { AVATARS, COLORS } from '../constants'; // Importado de constants

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const checkExistingUser = useCallback(async () => {
    try {
      const savedUser = await getUserData();
      if (savedUser?.nickname) {
        setNickname(savedUser.nickname);
        setSelectedAvatar(savedUser.avatar || null);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário existente:', error);
    } finally {
      setIsCheckingStorage(false);
    }
  }, []);

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
    if (!selectedAvatar) {
        Alert.alert('Atenção', 'Por favor, escolha um avatar.');
        return;
    }

    setIsLoading(true);
    try {
      const formattedNickname = formatNickname(nickname);
      await saveUserData({
        nickname: formattedNickname,
        avatar: selectedAvatar,
        createdAt: new Date().toISOString(),
      });
      navigation.replace('DeckSelection');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar seus dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validateNickname(nickname).isValid && selectedAvatar !== null;

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
                {AVATARS.map((avatar) => (
                    <TouchableOpacity
                        key={avatar}
                        style={[
                            styles.avatarContainer,
                            selectedAvatar === avatar && styles.avatarSelected
                        ]}
                        onPress={() => setSelectedAvatar(avatar)}
                    >
                        <Text style={styles.avatarText}>{avatar}</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarSection: {
    marginBottom: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  avatarSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    transform: [{ scale: 1.1 }],
  },
  avatarText: {
    fontSize: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.darkGray,
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonEnabled: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default LoginScreen;