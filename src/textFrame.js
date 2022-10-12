class TextFrame {
  #rootStyle;
  #stageRect;
  #baseLinePos = [];

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

    let textFields = [];
    if (this.#lineCount === 1) {
      this.#drawTextFrame(ctx, text);
      textFields = this.#getTextFields(ctx, text);
    } else {
      const textList = this.#getTextList(ctx, text);
      textList.forEach((text, index) => {
        this.#drawTextFrame(ctx, text, index);
        this.#getTextFields(ctx, text, index).forEach((textField) =>
          textFields.push(textField)
        );
      });
    }

    const dotPositions = this.#getDotPositions(ctx, textFields);
    ctx.restore();

    return {
      textFields,
      dotPositions,
    };
  }

  #getTextList(ctx, text) {
    const textList = text.split(' ');
    const newTextList = [];
    let lineText = '';
    let isOutOfStage = false;
    let isLastText = false;

    textList.forEach((text, index) => {
      isOutOfStage =
        ctx.measureText(lineText + text).width > this.#stageRect.width;
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

  #drawTextFrame(ctx, text, index = 0) {
    const totalTextMetrics = ctx.measureText(text);
    const baseLinePos = this.#calculateBaseLinePos(totalTextMetrics, index);
    this.#baseLinePos.push(baseLinePos);

    ctx.fillText(text, baseLinePos.x, baseLinePos.y);
  }

  #getTextFields(ctx, text, index = 0) {
    const textFields = [];

    for (let i = 0; i < text.length; i++) {
      const textMetrics = ctx.measureText(text[i]);
      const baseLinePos = this.#baseLinePos[index];

      const textField = {
        x:
          i === 0
            ? baseLinePos.x
            : Math.round(
                textFields.reduce(
                  (sum, textField) => sum + textField.width,
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

      textFields.push(textField);
    }

    return textFields;
  }

  #getDotPositions(ctx, textFields) {
    const dots = [];
    const imageData = ctx.getImageData(
      0, 0, this.#stageRect.width, this.#stageRect.height
    ); // prettier-ignore

    textFields.forEach((textField, index) => {
      dots.push(new Array());

      for (let y = textField.y; y < textField.y + textField.height; y++) {
        for (let x = textField.x; x < textField.x + textField.width; x++) {
          const alpha = imageData.data[(x + y * this.#stageRect.width) * 4 + 3];
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

  #calculateBaseLinePos(textMetrics, index) {
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
    const calculateBaseLinePosY = (index) => {
      const baseLinePosY =
        (this.#lineHeight +
          textMetrics.actualBoundingBoxAscent -
          textMetrics.actualBoundingBoxDescent) /
        2;
      return Math.round(baseLinePosY + this.#lineHeight * index);
    };

    return {
      x: calculateBaseLinePosX(),
      y: calculateBaseLinePosY(index),
    };
  }

  get #lineHeight() {
    if (this.#rootStyle.lineHeight !== 'normal') {
      return parseInt(this.#rootStyle.lineHeight);
    }

    //TODO: This is an estimate and may not be accurate!
    const height = parseInt(this.#rootStyle.fontSize) * 1.2;
    const lineCount = Math.round(this.#stageRect.height / height);

    return this.#stageRect.height / lineCount;
  }

  get #lineCount() {
    return Math.round(this.#stageRect.height / this.#lineHeight);
  }
}

export default TextFrame;
