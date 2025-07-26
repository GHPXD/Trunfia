// src/services/soundService.ts

import Sound from 'react-native-sound';

// Habilita o som mesmo no modo silencioso do iOS
Sound.setCategory('Playback');

// Mapeamento de chaves para nomes de arquivos
const soundMap = {
  CLICK: 'button_click.mp3',
  SELECT: 'card_select.mp3',
  PLAY: 'card_play.mp3',
  WIN: 'round_win.mp3',
  LOSE: 'round_lose.mp3',
};

type SoundKey = keyof typeof soundMap;

// Cache para os sons já carregados
const soundCache: { [key in SoundKey]?: Sound } = {};

const playSound = (soundKey: SoundKey) => {
  const soundName = soundMap[soundKey];

  const play = (sound: Sound) => {
    sound.play(success => {
      if (!success) {
        console.log('Sound playback failed');
      }
    });
  };

  // Se o som já estiver em cache, toca diretamente
  if (soundCache[soundKey]) {
    const soundInstance = soundCache[soundKey];
    if (soundInstance) {
      soundInstance.getCurrentTime(seconds => {
        // Se o som já estiver tocando, reinicia
        if (seconds > 0) {
          soundInstance.stop(() => play(soundInstance));
        } else {
          play(soundInstance);
        }
      });
    }
    return;
  }

  // Se não, carrega o som, toca e armazena em cache
  const soundInstance = new Sound(soundName, Sound.MAIN_BUNDLE, error => {
    if (error) {
      console.log('Failed to load the sound', soundName, error);
      return;
    }
    soundCache[soundKey] = soundInstance;
    play(soundInstance);
  });
};

export default playSound;