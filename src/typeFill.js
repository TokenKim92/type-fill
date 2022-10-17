import Ripple from './ripple.js';
import TextFrame from './textFrame.js';
import {
  checkType,
  collideRipple,
  primitiveType,
  colorToRGB,
  parseIntForPadding,
  parseIntForMargin,
  collideHorizontal,
  collideVertical,
} from './utils.js';
import Horizontal from './horizontal.js';
import Vertical from './vertical.js';

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
  #fillFigureList = [];
  #stopFillTimer;
  #textFrame;
  #textFrameMetrics;
  #stageSize;
  #fillTime;
  #targetFillCount;
  #curFillCount = 0;
  #fontRGB;
  #rootStyle;
  #textCount;
  #isProcessing = false;
  #canvasContainer;
  #imageData;
  #isInitialized = false;
  #fillAlgorithm;
  #collide;

  constructor(elementId, fillTime = 1000, fillAlgorithm = 'ripple') {
    checkType(elementId, primitiveType.string);
    checkType(fillTime, primitiveType.number);

    this.#elementObj = document.querySelector(`#${elementId}`);
    if (!this.#elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    if (fillTime <= 0) {
      throw new Error("'fillTime' should be greater then 0.");
    }

    this.#fillTime = fillTime;
    this.#targetFillCount = fillTime / TypeFill.FPS_TIME;
    this.#text = this.#elementObj.innerText;
    this.#rootStyle = window.getComputedStyle(this.#elementObj);
    this.#fontRGB = colorToRGB(this.#rootStyle.color);
    this.#fillAlgorithm = fillAlgorithm;

    this.#createRootElement();
    setTimeout(() => {
      this.#createCanvases();
      this.#textFrame = new TextFrame(
        this.#ctx,
        this.#rootStyle,
        this.#text,
        this.#fontRGB.a
      );
      this.#initFrameMetricsAndFillFigure();

      this.#isInitialized = true;
    }, 380);

    window.addEventListener('resize', this.#resize);
  }

  start = () => {
    if (!this.#isProcessing) {
      this.#setFillTimer();
      this.#isProcessing = true;
    }
  };

  stop = () => {
    if (this.#isProcessing) {
      this.#stopFillTimer();
      this.#isProcessing = false;
    }
  };

  restart = () => {
    if (this.#isProcessing) {
      this.#stopFillTimer();
    }

    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#imageData = this.#ctx.getImageData(0, 0, this.#stageSize.width, this.#stageSize.height); // prettier-ignore
    this.#curFillCount = 0;
    this.#fillFigureList.forEach((fillFigure) => fillFigure.reset());
    this.#isProcessing = true;

    this.#setFillTimer();
  };

  #createRootElement = () => {
    this.#rootElement = document.createElement('div');
    this.#elementObj.parentElement.insertBefore(
      this.#rootElement,
      this.#elementObj
    );
    this.#rootElement.append(this.#elementObj);

    this.#elementObj.style.transition = 'opacity 300ms ease-out';
    setTimeout(() => {
      this.#elementObj.style.opacity = 0;
    }, 1);
  };

  #createCanvases = () => {
    const padding = parseIntForPadding(this.#rootStyle.padding);
    const margin = parseIntForMargin(this.#rootStyle.margin);
    const backgroundSize = this.#getClientSize(this.#elementObj);

    this.#backgroundCanvas = document.createElement('canvas');
    this.#backgroundCtx = this.#backgroundCanvas.getContext('2d');
    this.#backgroundCanvas.style.cssText = `
      left: ${margin.left}px;
      top: ${margin.top}px;
    `;
    this.#resetBackground(backgroundSize);

    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d', { willReadFrequently: true });
    this.#canvas.style.top = `${padding.top + margin.top}px`;
    this.#resetStage(padding, margin);

    this.#canvasContainer = document.createElement('div');
    this.#canvasContainer.style.top = `-${
      backgroundSize.height + margin.top + margin.bottom
    }px`;

    this.#rootElement.style.position = 'relative';
    this.#canvasContainer.style.position = 'relative';
    this.#canvas.style.position = 'absolute';
    this.#backgroundCanvas.style.position = 'absolute';

    this.#canvasContainer.append(this.#backgroundCanvas);
    this.#canvasContainer.append(this.#canvas);
    this.#rootElement.append(this.#canvasContainer);
  };

  #resize = () => {
    const backgroundSize = this.#getClientSize(this.#elementObj);
    const isResized = backgroundSize.height !== this.#backgroundCanvas.height;
    const gap = backgroundSize.width - this.#backgroundCanvas.width;

    this.#resetBackground(backgroundSize);
    if (!isResized) {
      const adjustedGap =
        this.#rootStyle.textAlign === 'center' ? gap / 2 : gap;

      if (this.#rootStyle.textAlign === 'end' || this.#rootStyle.textAlign === 'center') {
        const prevLeft = parseInt(this.#canvas.style.left);
        this.#canvas.style.left = `${prevLeft + adjustedGap}px`;
      } // prettier-ignore

      return;
    }

    const padding = parseIntForPadding(this.#rootStyle.padding);
    const margin = parseIntForMargin(this.#rootStyle.margin);
    this.#canvasContainer.style.top = `-${
      backgroundSize.height + margin.top + margin.bottom
    }px`;

    this.#resetStage(padding, margin);
    this.#initFrameMetricsAndFillFigure();
    this.restart();
  };

  #resetStage = (padding, margin) => {
    this.#canvas.style.left = `${padding.left + margin.left}px`;

    this.#stageSize = this.#getClientSize(
      this.#elementObj,
      padding.left + padding.right,
      padding.top + padding.bottom
    );
    this.#canvas.width = this.#stageSize.width;
    this.#canvas.height = this.#stageSize.height;

    this.#imageData = this.#ctx.getImageData(
      0,
      0,
      this.#stageSize.width,
      this.#stageSize.height
    );
  };

  #resetBackground = (backgroundSize) => {
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
  };

  #initFrameMetricsAndFillFigure = () => {
    this.#textFrameMetrics = this.#textFrame.getMetrics(this.#stageSize);
    this.#fillFigureList = this.#textFrameMetrics.textFields.map((textField) =>
      this.#creteFillFigure(textField)
    );
    this.#textCount = this.#fillFigureList.length;
    this.#initCollideAlgorithm();
  };

  #creteFillFigure = (textField) => {
    switch (this.#fillAlgorithm) {
      case 'horizontal':
        return new Horizontal(this.#fillTime, TypeFill.FPS_TIME, textField);
      case 'vertical':
        return new Vertical(this.#fillTime, TypeFill.FPS_TIME, textField);
      case 'ripple':
      default:
        return new Ripple(this.#fillTime, TypeFill.FPS_TIME, textField);
    }
  };

  #initCollideAlgorithm = () => {
    switch (this.#fillAlgorithm) {
      case 'horizontal':
        this.#collide = collideHorizontal;
        break;
      case 'vertical':
        this.#collide = collideVertical;
        break;
      case 'ripple':
      default:
        this.#collide = collideRipple;
        break;
    }
  };

  #setFillTimer = () => {
    const intervalId = setInterval(() => {
      if (!this.#isInitialized) {
        return;
      }

      if (this.#curFillCount > this.#targetFillCount) {
        this.#stopFillTimer();
        return;
      }

      this.#fillText();
      this.#curFillCount++;
    }, TypeFill.FPS_TIME);

    this.#stopFillTimer = () => clearInterval(intervalId);
  };

  #fillText = () => {
    for (let i = 0; i < this.#textCount; i++) {
      const fillFigure = this.#fillFigureList[i];
      const dots = this.#textFrameMetrics.dotPositions[i];

      fillFigure.update();
      dots
        .filter((dot) =>
          this.#collide(dot, fillFigure.Metrics.point, fillFigure.Metrics.area)
        )
        .forEach((dot) => {
          const index = dot.x + dot.y * this.#stageSize.width;

          this.#imageData.data[index * 4] = this.#fontRGB.r;
          this.#imageData.data[index * 4 + 1] = this.#fontRGB.g;
          this.#imageData.data[index * 4 + 2] = this.#fontRGB.b;
          this.#imageData.data[index * 4 + 3] = dot.alpha;
        });
    }
    this.#ctx.putImageData(this.#imageData, 0, 0);
  };

  #getClientSize = (elementObj, paddingWidth = 0, paddingHeight = 0) => {
    return {
      width: Math.round(
        elementObj.getBoundingClientRect().width - paddingWidth
      ),
      height: Math.round(
        elementObj.getBoundingClientRect().height - paddingHeight
      ),
    };
  };
}

export default TypeFill;
