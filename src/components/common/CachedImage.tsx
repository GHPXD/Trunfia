// src/components/common/CachedImage.tsx

import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import FastImage, { ResizeMode, Source, ImageStyle as FastImageStyle } from 'react-native-fast-image'; // 1. Importar o tipo de estilo do FastImage

interface CachedImageProps {
  uri: string;
  style: StyleProp<ImageStyle>;
  resizeMode?: ResizeMode;
}

const CachedImage: React.FC<CachedImageProps> = ({ uri, style, resizeMode = 'cover' }) => {
  const source: Source = {
    uri: uri,
    priority: FastImage.priority.normal,
  };

  return (
    <FastImage
      // 2. Fazer a coerção do tipo para StyleProp<FastImageStyle>
      style={style as StyleProp<FastImageStyle>}
      source={source}
      resizeMode={resizeMode}
    />
  );
};

export default React.memo(CachedImage);