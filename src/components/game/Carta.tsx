// src/components/game/Carta.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Card } from '../../types';
import { formatAttributeValue } from '../../utils/gameUtils';
import CachedImage from '../common/CachedImage'; // 1. Importar o novo componente

interface CartaProps {
  card: Card;
  isRevealed: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  selectedAttribute?: string;
  onSelect?: () => void;
  isAttributeSelectable?: boolean;
  onAttributeSelect?: (attribute: string) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.45, 200);
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const CartaComponent: React.FC<CartaProps> = ({
  card,
  isRevealed,
  isSelected,
  isSelectable,
  selectedAttribute,
  onSelect,
  isAttributeSelectable = false,
  onAttributeSelect,
}) => {
  const rotate = useSharedValue(isRevealed ? 180 : 0);

  useEffect(() => {
    rotate.value = withTiming(isRevealed ? 180 : 0, { duration: 400 });
  }, [isRevealed, rotate]);

  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value}deg` }],
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value + 180}deg` }],
  }));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
      ]}
      onPress={handlePress}
      disabled={!isSelectable && !isAttributeSelectable}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.cardBase, styles.cardBack, frontAnimatedStyle]}>
        <Image source={require('../../assets/images/logo-verso.png')} style={styles.backImage} />
      </Animated.View>

      <Animated.View style={[styles.cardBase, styles.cardFront, backAnimatedStyle]}>
        <View style={styles.imageContainer}>
          {/* 2. Substituir o Image pelo CachedImage */}
          {card.image ? (
            <CachedImage
              uri={card.image}
              style={styles.cardImage}
            />
          ) : (
            <Text style={styles.imagePlaceholder}>{card.name}</Text>
          )}
        </View>

        <View style={styles.attributesWrapper}>
          <View style={styles.attributesContainer}>
              {Object.entries(card.attributes).map(([key, value]) => (
              <TouchableOpacity
                  key={key}
                  style={[
                    styles.attributeRow,
                    isAttributeSelectable && styles.attributeSelectable,
                    selectedAttribute === key && styles.selectedAttribute,
                  ]}
                  onPress={() => onAttributeSelect?.(key)}
                  disabled={!isAttributeSelectable}
              >
                  <Text style={styles.attributeName}>{key}:</Text>
                  <Text style={styles.attributeValue}>{formatAttributeValue(key, value)}</Text>
              </TouchableOpacity>
              ))}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  selectedContainer: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#007AFF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  cardBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: '#CCC',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardBack: {
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cardFront: {
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  imageContainer: {
    height: '35%',
    width: '100%',
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6c757d',
    padding: 5,
  },
  attributesWrapper: {
    height: '65%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  attributesContainer: {
    width: '90%',
    height: '100%',
    justifyContent: 'space-around',
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  attributeSelectable: {
    backgroundColor: '#FFF',
  },
  selectedAttribute: {
    backgroundColor: '#d1ecf1',
    borderColor: '#007bff',
    transform: [{ scale: 1.05 }],
    elevation: 2,
  },
  attributeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#212529',
  },
});

export default React.memo(CartaComponent);