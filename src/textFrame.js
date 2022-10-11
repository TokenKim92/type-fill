class TextFrame {
  #rootStyle;
  #stageRect;
  #baseLinePos;

  constructor(rootStyle, stageRect) {
    this.#rootStyle = rootStyle;
    this.#stageRect = stageRect;
  }

  getMetrics(ctx, text) {
    ctx.save();

    const fillStyle = this.#isTransparentBackground
      ? 'rgb(255, 255, 255)'
      : this.#rootStyle.backgroundColor;

    ctx.font = `${this.#rootStyle.fontWeight} ${this.#rootStyle.fontSize} ${this.#rootStyle.fontFamily}`; //prettier-ignore
    ctx.fillStyle = fillStyle;
    ctx.textBaseline = 'middle';

    this.#drawTextFrame(ctx, text);
    const textFields = this.#getTextFields(ctx, text);
    const dotPositions = this.#getDotPositions(ctx, textFields);

    ctx.restore();

    return {
      textFields,
      dotPositions,
    };
  }

  #drawTextFrame(ctx, text) {
    const totalTextMetrics = ctx.measureText(text);
    this.#baseLinePos = this.#calculateBaseLinePos(totalTextMetrics);

    ctx.fillText(text, this.#baseLinePos.x, this.#baseLinePos.y);
  }

  #getTextFields(ctx, text) {
    const textFields = [];

    for (let i = 0; i < text.length; i++) {
      const textMetrics = ctx.measureText(text[i]);
      const textField = {
        x: i === 0 ? this.#baseLinePos.x : Math.round(textFields.reduce((sum, textField) => sum + textField.width, this.#baseLinePos.x)),
        y: Math.round(this.#baseLinePos.y - textMetrics.actualBoundingBoxAscent),
        width: Math.round(textMetrics.width),
        height: Math.round(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent * 1),
      }; // prettier-ignore

      textFields.push(textField);
    }

    return textFields;
  }

  #getDotPositions(ctx, textFields) {
    const dots = [];

    textFields.forEach((textField, index) => {
      dots.push(new Array());
      const imageData = ctx.getImageData(
        textField.x,
        textField.y,
        textField.width,
        textField.height
      );

      for (let y = 0; y < textField.height; y++) {
        for (let x = 0; x < textField.width; x++) {
          const alpha = imageData.data[(x + y * textField.width) * 4 + 3];
          if (alpha) {
            dots[index].push({ x: x + textField.x, y: y + textField.y, alpha });
          }
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

  #calculateBaseLinePos(textMetrics) {
    const calculateBaseLinePosX = () => {
      switch (this.#rootStyle.textAlign) {
        case 'end':
          return Math.round(this.#stageRect.width - textMetrics.width);
        case 'center':
          return Math.round((this.#stageRect.width - textMetrics.width) / 2);
        case 'justify':
          console.error("'justify' option doesn't work.");
        case 'start':
        default:
          return 0;
      }
    };

    // TODO: find more case
    const calculateBaseLinePosY = () => {
      return Math.round(
        (this.#stageRect.height +
          textMetrics.actualBoundingBoxAscent -
          textMetrics.actualBoundingBoxDescent) /
          2
      );
    };

    return {
      x: calculateBaseLinePosX(),
      y: calculateBaseLinePosY(),
    };
  }
}

export default TextFrame;
