// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { OrientationSetting } from '../components/common/SettingsModal';

const STORAGE_KEYS = {
  USER_DATA: '@trunfia_user_data',
  ORIENTATION_SETTING: '@trunfia_orientation_setting', // Nova chave
} as const;

/**
 * Salva os dados do usuário (nickname e avatar) no AsyncStorage
 */
export const saveUserData = async (userData: User): Promise<void> => {
  try {
    const dataToSave = JSON.stringify(userData);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, dataToSave);
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    throw new Error('Não foi possível salvar os dados do usuário');
  }
};

/**
 * Recupera os dados completos do usuário do AsyncStorage
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Erro ao recuperar dados do usuário:', error);
    return null;
  }
};

/**
 * Salva a preferência de orientação da tela
 */
export const saveOrientationSetting = async (setting: OrientationSetting): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ORIENTATION_SETTING, setting);
  } catch (error) {
    console.error('Erro ao salvar a configuração de orientação:', error);
  }
};

/**
 * Recupera a preferência de orientação da tela
 */
export const getOrientationSetting = async (): Promise<OrientationSetting | null> => {
  try {
    const setting = await AsyncStorage.getItem(STORAGE_KEYS.ORIENTATION_SETTING);
    return setting as OrientationSetting | null;
  } catch (error) {
    console.error('Erro ao recuperar a configuração de orientação:', error);
    return null;
  }
};


/**
 * Remove todos os dados do usuário
 */
export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
  }
};