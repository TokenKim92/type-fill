export const primitiveType = Object.freeze({
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
});

export const checkType = (item, type) => {
  if (typeof item !== primitiveType[type]) {
    throw new Error(
      `This parameter type should be the ${primitiveType[type]}.`
    );
  }
};

export const distance = (x1, y1, x2, y2) => {
  const x = x2 - x1;
  const y = y2 - y1;

  return Math.sqrt(x * x + y * y);
};

export const randomPosInRect = (rect) => {
  const x = Math.round(rect.x + Math.random() * rect.width);
  const y = Math.round(rect.y + Math.random() * rect.height);
  return { x, y };
};

export const collideRipple = (pos1, pos2, radius) => {
  return distance(pos1.x, pos1.y, pos2.x, pos2.y) <= radius;
};

export const collideHorizontal = (pos1, pos2, width) => {
  return pos2.x - width.left <= pos1.x && pos1.x <= pos2.x + width.right;
};

export const collideVertical = (pos1, pos2, width) => {
  return pos2.y - width.top <= pos1.y && pos1.y <= pos2.y + width.bottom;
};

const errorMsgForRGB =
  "The color type should be 'rgb' or 'hex' like 'rgb(0, 0, 0)' or '#000000'.";

export const colorToRGB = (rgbText) => {
  if (typeof rgbText !== primitiveType.string) {
    throw new Error(errorMsgForRGB);
  }

  const rgbValues = parseIntForRGB(rgbText.toLowerCase());
  if ((rgbValues.length !== 3 && rgbValues.length !== 4) || rgbValues.includes(NaN)) {
    throw new Error(errorMsgForRGB);
  } // prettier-ignore

  rgbValues.forEach((colorValue) => {
    if (colorValue > 255 || colorValue < 0) {
      throw new Error(errorMsgForRGB);
    }
  });

  return {
    r: rgbValues[0],
    g: rgbValues[1],
    b: rgbValues[2],
    a: rgbValues[3] === undefined ? 1 : rgbValues[3],
  };
};

const parseIntForRGB = (rgbText) => {
  if (rgbText.includes('rgb')) {
    const openBracketIndex = rgbText.indexOf('(');
    const closeBracketIndex = rgbText.indexOf(')');

    return rgbText
      .substring(openBracketIndex + 1, closeBracketIndex)
      .split(', ')
      .map((colorValue) => parseFloat(colorValue));
  } else if (rgbText.includes('#')) {
    return rgbText
      .slice(1, rgbText.length)
      .match(/.{1,2}/g)
      .map((colorValue) => parseFloat(colorValue, 16));
  }

  throw new Error(errorMsgForRGB);
};

const parseIntForStyle = (style) => {
  const styleList = style.split(' ').map((styleItem) => parseInt(styleItem));

  switch (styleList.length) {
    case 1:
      return {
        top: styleList[0],
        right: styleList[0],
        bottom: styleList[0],
        left: styleList[0],
      };
    case 2:
      return {
        top: styleList[0],
        right: styleList[1],
        bottom: styleList[0],
        left: styleList[1],
      };
    case 3:
      return {
        top: styleList[0],
        right: styleList[1],
        bottom: styleList[2],
        left: 0,
      };
    case 4:
      return {
        top: styleList[0],
        right: styleList[1],
        bottom: styleList[2],
        left: styleList[3],
      };
  }
};

export const parseIntForPadding = (stylePadding) => {
  return parseIntForStyle(stylePadding);
};

export const parseIntForMargin = (styleMargin) => {
  return parseIntForStyle(styleMargin);
};
