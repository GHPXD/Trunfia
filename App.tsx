// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { GameProvider } from './src/contexts/GameContext';
import { AnimationCoordinateProvider } from './src/contexts/AnimationCoordinateContext'; // Importe o novo provedor
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
        {/* Envolvemos o AppNavigator para que todas as telas tenham acesso */}
        <AnimationCoordinateProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
          <AppNavigator />
        </AnimationCoordinateProvider>
      </GameProvider>
    </GestureHandlerRootView>
  );
};

export default App;