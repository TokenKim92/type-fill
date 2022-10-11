class TextFrame {
  #fontFormat;
  #stageRect;
  #baseLinePos;

  constructor(parentElement, stageRect) {
    this.#fontFormat = window.getComputedStyle(parentElement);
    this.#stageRect = stageRect;
  }

  getMetrics(ctx, text) {
    ctx.save();

    const fillStyle = this.#isTransparentBackground
      ? 'rgb(255, 255, 255)'
      : this.#fontFormat.backgroundColor;

    ctx.font = `${this.#fontFormat.fontWeight} ${this.#fontFormat.fontSize} ${this.#fontFormat.fontFamily}`; //prettier-ignore
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
    this.#baseLinePos = {
      x: (this.#stageRect.width - totalTextMetrics.width) / 2,
      y:
        (this.#stageRect.height +
          totalTextMetrics.actualBoundingBoxAscent -
          totalTextMetrics.actualBoundingBoxDescent) /
        2,
    };

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

      // ctx.save();
      // ctx.strokeStyle = 'rgb(255, 0, 0)';
      // ctx.strokeRect(
      //   textField.x,
      //   textField.y,
      //   textField.width,
      //   textField.height
      // );
      // ctx.restore();
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
    const rgbaText = this.#fontFormat.backgroundColor;
    const openBracketIndex = rgbaText.indexOf('(');
    const closeBracketIndex = rgbaText.indexOf(')');
    const alpha = rgbaText
      .substring(openBracketIndex + 1, closeBracketIndex)
      .split(', ')
      .map((colorValue) => parseInt(colorValue))
      .at(3);

    return alpha === 0;
  }
}

export default TextFrame;
