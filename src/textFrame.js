class TextFrame {
  #ctx;
  #rootStyle;
  #text;
  #baseLinePos;

  constructor(ctx, rootStyle, text) {
    this.#ctx = ctx;
    this.#rootStyle = rootStyle;
    this.#text = text;
  }

  getMetrics(stageRect) {
    this.#baseLinePos = [];
    this.#ctx.save();

    const fillStyle = this.#isTransparentBackground
      ? 'rgb(255, 255, 255)'
      : this.#rootStyle.backgroundColor;

    this.#ctx.font = `${this.#rootStyle.fontWeight} ${this.#rootStyle.fontSize} ${this.#rootStyle.fontFamily}`; //prettier-ignore
    this.#ctx.fillStyle = fillStyle;
    this.#ctx.textBaseline = 'middle';

    const textFields = [];
    if (this.#calculateLineCount(stageRect) === 1) {
      this.#drawTextFrame(stageRect, this.#text);
      this.#getTextFields(this.#text).forEach((textField) =>
        textFields.push(textField)
      );
    } else {
      const textList = this.#getTextList(stageRect);
      textList.forEach((lineText, index) => {
        this.#drawTextFrame(stageRect, lineText, index);
        this.#getTextFields(lineText, index).forEach((textField) =>
          textFields.push(textField)
        );
      });
    }

    const dotPositions = this.#getDotPositions(stageRect, textFields);
    this.#ctx.restore();

    return {
      textFields,
      dotPositions,
    };
  }

  #getTextList(stageRect) {
    const textList = this.#text.split(' ');
    const newTextList = [];
    let lineText = '';
    let isOutOfStage = false;
    let isLastText = false;

    textList.forEach((text, index) => {
      isOutOfStage =
        this.#ctx.measureText(lineText + text).width > stageRect.width;
      isLastText = index === textList.length - 1;

      if (isOutOfStage) {
        newTextList.push(lineText.trimEnd());
        isLastText ? newTextList.push(text) : (lineText = text + ' ');
      } else {
        isLastText
          ? newTextList.push(lineText + text)
          : (lineText = lineText + text + ' ');
      }
    });

    return newTextList;
  }

  #drawTextFrame(stageRect, text, index = 0) {
    const totalTextMetrics = this.#ctx.measureText(text);
    const baseLinePos = this.#calculateBaseLinePos(
      stageRect,
      totalTextMetrics,
      index
    );
    this.#baseLinePos.push(baseLinePos);

    this.#ctx.fillText(text, baseLinePos.x, baseLinePos.y);
  }

  #getTextFields(text, index = 0) {
    const textFields = [];
    const textWidthList = [];
    const baseLinePos = this.#baseLinePos[index];
    let character;
    let textMetrics;
    let textField;

    for (let i = 0; i < text.length; i++) {
      character = text[i];
      textMetrics = this.#ctx.measureText(character);

      if (character === ' ') {
        textWidthList.push(textMetrics.width);
        continue;
      }

      // TODO:: find more correcter x and width
      textField = {
        x:
          i === 0
            ? baseLinePos.x
            : Math.round(
                textWidthList.reduce(
                  (sum, textWidth) => sum + textWidth,
                  baseLinePos.x
                )
              ),
        y: Math.round(baseLinePos.y - textMetrics.actualBoundingBoxAscent),
        width: Math.round(textMetrics.width),
        height: Math.round(
          textMetrics.actualBoundingBoxAscent +
            textMetrics.actualBoundingBoxDescent * 1
        ),
      };

      textWidthList.push(Math.round(textMetrics.width));
      textFields.push(textField);
    }

    return textFields;
  }

  #getDotPositions(stageRect, textFields) {
    const dots = [];
    const imageData = this.#ctx.getImageData(
      0, 0, stageRect.width, stageRect.height
    ); // prettier-ignore

    let alpha = 0;
    textFields.forEach((textField, index) => {
      dots.push(new Array());

      for (let y = textField.y; y < textField.y + textField.height; y++) {
        for (let x = textField.x; x < textField.x + textField.width; x++) {
          alpha = imageData.data[(x + y * stageRect.width) * 4 + 3];
          alpha && dots[index].push({ x, y, alpha });
        }
      }
    });

    return dots;
  }

  get #isTransparentBackground() {
    const rgbaText = this.#rootStyle.backgroundColor;
    const openBracketIndex = rgbaText.indexOf('(');
    const closeBracketIndex = rgbaText.indexOf(')');
    const alpha = rgbaText
      .substring(openBracketIndex + 1, closeBracketIndex)
      .split(', ')
      .map((colorValue) => parseInt(colorValue))
      .at(3);

    return alpha === 0;
  }

  #calculateBaseLinePos(stageRect, textMetrics, index) {
    const calculateBaseLinePosX = () => {
      switch (this.#rootStyle.textAlign) {
        case 'end':
          return Math.round(stageRect.width - textMetrics.width);
        case 'center':
          return Math.round((stageRect.width - textMetrics.width) / 2);
        case 'justify':
          console.error("'justify' option doesn't work.");
        case 'start':
        default:
          return 0;
      }
    };

    // TODO: find more case
    const calculateBaseLinePosY = (index) => {
      const lineHeight = this.#calculateLineHeight(stageRect);
      const baseLinePosY =
        (lineHeight +
          textMetrics.actualBoundingBoxAscent -
          textMetrics.actualBoundingBoxDescent) /
        2;
      return Math.round(baseLinePosY + lineHeight * index);
    };

    return {
      x: calculateBaseLinePosX(),
      y: calculateBaseLinePosY(index),
    };
  }

  #calculateLineHeight(stageRect) {
    if (this.#rootStyle.lineHeight !== 'normal') {
      return parseInt(this.#rootStyle.lineHeight);
    }

    //TODO: This is an estimate and may not be accurate!
    const height = parseInt(this.#rootStyle.fontSize) * 1.2;
    const lineCount = Math.round(stageRect.height / height);

    return stageRect.height / lineCount;
  }

  #calculateLineCount(stageRect) {
    return Math.round(stageRect.height / this.#calculateLineHeight(stageRect));
  }
}

export default TextFrame;
