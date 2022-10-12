import Ripple from './ripple.js';
import TextFrame from './textFrame.js';
import { checkType, collide, primitiveType, colorToRGB } from './utils.js';

class TypeFill {
  static FPS = 60;
  static FPS_TIME = 1000 / TypeFill.FPS;

  #canvas;
  #ctx;
  #backgroundCanvas;
  #backgroundCtx;
  #rootElement;
  #text;
  #rippleList = [];
  #stopRippleTimer;
  #targetRippleCount;
  #curRippleCount = 0;
  #textFrameMetrics;
  #stageSize;
  #rippleTime;
  #fontRGB;
  #rootStyle;

  constructor(elementId, rippleTime = 1000) {
    checkType(elementId, primitiveType.string);
    checkType(rippleTime, primitiveType.number);

    const elementObj = document.querySelector(`#${elementId}`);
    if (!elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    this.#rippleTime = rippleTime;
    this.#stageSize = {
      width: Math.round(elementObj.getBoundingClientRect().width),
      height: Math.round(elementObj.getBoundingClientRect().height),
    };
    this.#text = elementObj.innerText;
    this.#rootStyle = window.getComputedStyle(elementObj);
    this.#fontRGB = colorToRGB(this.#rootStyle.color);

    this.#createRootElement(elementObj);
    this.#createCanvases();

    this.#textFrameMetrics = new TextFrame(
      this.#rootStyle,
      this.#stageSize
    ).getMetrics(this.#ctx, this.#text);

    this.#rippleList = this.#textFrameMetrics.textFields.map(
      (textField) => new Ripple(this.#rippleTime, TypeFill.FPS_TIME, textField)
    );

    this.#targetRippleCount = this.#rippleTime / TypeFill.FPS_TIME;

    this.#setFillTimer();
  }

  #createRootElement(elementObj) {
    this.#rootElement = document.createElement('div');
    elementObj.parentElement.append(this.#rootElement);
    this.#rootElement.append(elementObj);

    elementObj.style.display = 'none';
  }

  #createCanvases() {
    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');
    this.#canvas.width = this.#stageSize.width;
    this.#canvas.height = this.#stageSize.height;

    this.#backgroundCanvas = document.createElement('canvas');
    this.#backgroundCtx = this.#backgroundCanvas.getContext('2d');
    this.#backgroundCanvas.width = this.#stageSize.width;
    this.#backgroundCanvas.height = this.#stageSize.height;

    this.#rootElement.style.position = 'relative';
    this.#canvas.style.position = 'absolute';
    this.#backgroundCanvas.style.position = 'absolute';

    this.#rootElement.append(this.#backgroundCanvas);
    this.#rootElement.append(this.#canvas);

    this.#backgroundCtx.fillStyle = this.#rootStyle.backgroundColor;
    this.#backgroundCtx.fillRect(
      0,
      0,
      this.#stageSize.width,
      this.#stageSize.height
    );
  }

  #setFillTimer() {
    const intervalId = setInterval(() => {
      if (this.#curRippleCount > this.#targetRippleCount) {
        this.#stopRippleTimer();
        return;
      }

      this.#fillText();
      this.#curRippleCount++;
    }, TypeFill.FPS_TIME);

    this.#stopRippleTimer = () => clearInterval(intervalId);
  }

  #fillText() {
    const imageData = this.#ctx.getImageData(
      0,
      0,
      this.#stageSize.width,
      this.#stageSize.height
    );

    for (let i = 0; i < this.#text.length; i++) {
      const ripple = this.#rippleList[i];
      const dots = this.#textFrameMetrics.dotPositions[i];

      ripple.update();
      dots
        .filter((dot) =>
          collide(dot, ripple.Metrics.centerPoint, ripple.Metrics.radius)
        )
        .forEach((dot) => {
          const index = dot.x + dot.y * this.#stageSize.width;

          imageData.data[index * 4] = this.#fontRGB.r;
          imageData.data[index * 4 + 1] = this.#fontRGB.g;
          imageData.data[index * 4 + 2] = this.#fontRGB.b;
          imageData.data[index * 4 + 3] = dot.alpha;
        });
    }
    this.#ctx.putImageData(imageData, 0, 0);
  }
}

export default TypeFill;
