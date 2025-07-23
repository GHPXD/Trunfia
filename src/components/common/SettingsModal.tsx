// src/components/common/SettingsModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export type OrientationSetting = 'automatic' | 'portrait' | 'landscape';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  currentSetting: OrientationSetting;
  onSettingChange: (setting: OrientationSetting) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  currentSetting,
  onSettingChange,
}) => {
  const options: { key: OrientationSetting; label: string }[] = [
    { key: 'automatic', label: 'Automático' },
    { key: 'portrait', label: 'Sempre Vertical' },
    { key: 'landscape', label: 'Sempre Horizontal' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Orientação da Tela de Jogo</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionButton,
                currentSetting === option.key && styles.optionButtonSelected,
              ]}
              onPress={() => onSettingChange(option.key)}
            >
              <Text style={[
                  styles.optionText,
                  currentSetting === option.key && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#007AFF',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SettingsModal;