import Ripple from './ripple.js';
import TextFrame from './textFrame.js';
import {
  checkType,
  collide,
  primitiveType,
  colorToRGB,
  parseIntForPadding,
} from './utils.js';

class TypeFill {
  static FPS = 60;
  static FPS_TIME = 1000 / TypeFill.FPS;

  #canvas;
  #ctx;
  #backgroundCanvas;
  #backgroundCtx;
  #rootElement;
  #elementObj;
  #text;
  #rippleList = [];
  #stopRippleTimer;
  #textFrame;
  #textFrameMetrics;
  #stageSize;
  #rippleTime;
  #targetRippleCount;
  #curRippleCount = 0;
  #fontRGB;
  #rootStyle;
  #textCount;
  #isProcessing = false;
  #canvasContainer;

  constructor(elementId, rippleTime = 1000) {
    checkType(elementId, primitiveType.string);
    checkType(rippleTime, primitiveType.number);

    this.#elementObj = document.querySelector(`#${elementId}`);
    if (!this.#elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    this.#rippleTime = rippleTime;
    this.#targetRippleCount = rippleTime / TypeFill.FPS_TIME;
    this.#text = this.#elementObj.innerText;
    this.#rootStyle = window.getComputedStyle(this.#elementObj);
    this.#fontRGB = colorToRGB(this.#rootStyle.color);

    this.#createRootElement(this.#elementObj);
    this.#createCanvases();
    this.#textFrame = new TextFrame(this.#ctx, this.#rootStyle, this.#text);
    this.#initFrameMetricsAndRipple();

    window.addEventListener('resize', this.#resize);
  }

  start() {
    if (!this.#isProcessing) {
      this.#setFillTimer();
      this.#isProcessing = true;
    }
  }

  stop() {
    if (this.#isProcessing) {
      this.#stopRippleTimer();
      this.#isProcessing = false;
    }
  }

  restart() {
    if (this.#isProcessing) {
      this.#stopRippleTimer();
    }

    this.#curRippleCount = 0;
    this.#rippleList.forEach((ripple) => ripple.reset());
    this.#setFillTimer();
    this.#isProcessing = true;
  }

  #createCanvases() {
    const backgroundSize = this.#getClientSize(this.#elementObj);

    this.#backgroundCanvas = document.createElement('canvas');
    this.#backgroundCtx = this.#backgroundCanvas.getContext('2d');
    this.#backgroundCanvas.width = backgroundSize.width;
    this.#backgroundCanvas.height = backgroundSize.height;

    const padding = parseIntForPadding(this.#rootStyle.padding);
    this.#stageSize = this.#getClientSize(
      this.#elementObj,
      padding.left + padding.right,
      padding.top + padding.bottom
    );

    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d');
    this.#canvas.width = this.#stageSize.width;
    this.#canvas.height = this.#stageSize.height;

    this.#canvas.style.cssText = `
      left: ${padding.left}px;
      top: ${padding.top}px;
    `;

    this.#canvasContainer = document.createElement('div');

    this.#rootElement.style.position = 'relative';
    this.#canvasContainer.style.position = 'relative';
    this.#canvas.style.position = 'absolute';
    this.#backgroundCanvas.style.position = 'absolute';

    this.#canvasContainer.append(this.#backgroundCanvas);
    this.#canvasContainer.append(this.#canvas);
    this.#rootElement.append(this.#canvasContainer);

    this.#backgroundCtx.fillStyle = this.#rootStyle.backgroundColor;
    this.#backgroundCtx.fillRect(
      0,
      0,
      this.#backgroundCanvas.width,
      this.#backgroundCanvas.height
    );
  }

  #resize = () => {
    const backgroundSize = this.#getClientSize(this.#elementObj);
    const isResized = backgroundSize.height === this.#backgroundCanvas.height;

    this.#resetBackground(backgroundSize);
    if (isResized) {
      return;
    }

    const padding = parseIntForPadding(this.#rootStyle.padding);
    this.#stageSize = this.#getClientSize(
      this.#elementObj,
      padding.left + padding.right,
      padding.top + padding.bottom
    );
    this.#canvas.width = this.#stageSize.width;
    this.#canvas.height = this.#stageSize.height;

    this.#initFrameMetricsAndRipple();
    this.restart();
  };

  #resetBackground(backgroundSize) {
    this.#backgroundCtx.clearRect(
      0,
      0,
      this.#backgroundCanvas.width,
      this.#backgroundCanvas.height
    );

    this.#backgroundCanvas.width = backgroundSize.width;
    this.#backgroundCanvas.height = backgroundSize.height;

    this.#backgroundCtx.fillStyle = this.#rootStyle.backgroundColor;
    this.#backgroundCtx.fillRect(
      0,
      0,
      this.#backgroundCanvas.width,
      this.#backgroundCanvas.height
    );
  }

  #initFrameMetricsAndRipple() {
    this.#textFrameMetrics = this.#textFrame.getMetrics(this.#stageSize);
    this.#rippleList = this.#textFrameMetrics.textFields.map(
      (textField) => new Ripple(this.#rippleTime, TypeFill.FPS_TIME, textField)
    );
    this.#textCount = this.#rippleList.length;
  }

  #createRootElement(elementObj) {
    this.#rootElement = document.createElement('div');
    elementObj.parentElement.append(this.#rootElement);
    this.#rootElement.append(elementObj);

    elementObj.style.position = 'absolute';
    elementObj.style.opacity = 0;
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

    for (let i = 0; i < this.#textCount; i++) {
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

  #getClientSize(elementObj, paddingWidth = 0, paddingHeight = 0) {
    return {
      width: Math.round(
        this.#elementObj.getBoundingClientRect().width - paddingWidth
      ),
      height: Math.round(
        this.#elementObj.getBoundingClientRect().height - paddingHeight
      ),
    };
  }
}

export default TypeFill;
