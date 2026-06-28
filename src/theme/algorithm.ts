import type { DerivativeToken } from './interface';

export const getLineHeight = (fontSize: number) => (fontSize + 8) / fontSize;

export const genFontSizes = (base: number) => {
  const fontSizes = Array.from({
    length: 10,
  }).map((_, index) => {
    const i = index - 1;
    const baseSize = base * Math.pow(Math.E, i / 5);
    const intSize = index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize);

    return Math.floor(intSize / 2) * 2;
  });

  fontSizes[1] = base;

  return fontSizes.map((size) => ({
    size,
    lineHeight: getLineHeight(size),
  }));
};

export const genFontMapToken = (fontSize: number) => {
  const fontSizePairs = genFontSizes(fontSize);
  const fontSizes = fontSizePairs.map((pair) => pair.size);
  const lineHeights = fontSizePairs.map((pair) => pair.lineHeight);
  const fontSizeMD = fontSizes[1];
  const fontSizeSM = fontSizes[0];
  const fontSizeLG = fontSizes[2];
  const lineHeight = lineHeights[1];
  const lineHeightSM = lineHeights[0];
  const lineHeightLG = lineHeights[2];

  return {
    fontSizeSM,
    fontSize: fontSizeMD,
    fontSizeLG,
    fontSizeXL: fontSizes[3],
    lineHeight,
    lineHeightLG,
    lineHeightSM,
    fontHeight: Math.round(lineHeight * fontSizeMD),
    fontHeightLG: Math.round(lineHeightLG * fontSizeLG),
    fontHeightSM: Math.round(lineHeightSM * fontSizeSM),
  };
};

export const genRadius = (radiusBase: number) => {
  let radiusLG = radiusBase;
  let radiusSM = radiusBase;
  let radiusXS = radiusBase;
  let radiusOuter = radiusBase;

  if (radiusBase < 6 && radiusBase >= 5) {
    radiusLG = radiusBase + 1;
  }

  if (radiusBase < 16 && radiusBase >= 6) {
    radiusLG = radiusBase + 2;
  }

  if (radiusBase >= 16) {
    radiusLG = 16;
  }

  if (radiusBase < 7 && radiusBase >= 5) {
    radiusSM = 4;
  } else if (radiusBase < 8 && radiusBase >= 7) {
    radiusSM = 5;
  } else if (radiusBase < 14 && radiusBase >= 8) {
    radiusSM = 6;
  } else if (radiusBase < 16 && radiusBase >= 14) {
    radiusSM = 7;
  } else if (radiusBase >= 16) {
    radiusSM = 8;
  }

  if (radiusBase < 6 && radiusBase >= 2) {
    radiusXS = 1;
  } else if (radiusBase >= 6) {
    radiusXS = 2;
  }

  if (radiusBase > 4 && radiusBase < 8) {
    radiusOuter = 4;
  } else if (radiusBase >= 8) {
    radiusOuter = 6;
  }

  return {
    borderRadius: radiusBase,
    borderRadiusXS: radiusXS,
    borderRadiusSM: radiusSM,
    borderRadiusLG: radiusLG,
    borderRadiusOuter: radiusOuter,
  };
};

export const derivativeSource = {
  fontSizeBase: 14,
  borderRadius: 6,
};

export const defaultDerivativeToken = {
  ...genFontMapToken(derivativeSource.fontSizeBase),
  ...genRadius(derivativeSource.borderRadius),
} as DerivativeToken;
