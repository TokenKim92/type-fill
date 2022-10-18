import Ripple from './ripple.js';
import TextFrame from './textFrame.js';
import {
  checkType,
  primitiveType,
  colorToRGB,
  parseIntForPadding,
  parseIntForMargin,
  collideRipple,
  collideHorizontal,
  collideVertical,
} from './utils.js';
import Horizontal from './horizontal.js';
import Vertical from './vertical.js';

class TypeFill {
  static FPS = 60;
  static FPS_TIME = 1000 / TypeFill.FPS;
  static DEFAULT_CREATOR = Ripple;
  static DEFAULT_COLLIDE = collideRipple;

  #canvas;
  #ctx;
  #backgroundCanvas = undefined;
  #backgroundCtx;
  #rootElement;
  #elementObj;
  #text;
  #fillFigureList = [];
  #stopFillTimer;
  #textFrame;
  #textFrameMetrics;
  #stageSize;
  #backgroundSize;
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
  #fillCollide;
  #fillCreator;
  #fillRatio;
  #fillAlgorithms = [
    {
      figure: 'horizontal',
      creator: Horizontal,
      collide: collideHorizontal,
    },
    {
      figure: 'vertical',
      creator: Vertical,
      collide: collideVertical,
    },
    {
      figure: 'ripple',
      creator: Ripple,
      collide: collideRipple,
    },
  ];

  constructor(elementId, fillTime = 1000, fillAttributes = undefined) {
    checkType(elementId, primitiveType.string);
    checkType(fillTime, primitiveType.number);

    this.#elementObj = document.querySelector(`#${elementId}`);
    if (!this.#elementObj) {
      throw new Error("This element id doesn't exit.");
    }
    if (fillTime <= 0) {
      throw new Error("'fillTime' should be greater then 0.");
    }
    this.#initFillAttributes(fillAttributes);

    this.#fillTime = fillTime;
    this.#targetFillCount = fillTime / TypeFill.FPS_TIME;
    this.#text = this.#elementObj.innerText;
    this.#rootStyle = window.getComputedStyle(this.#elementObj);
    this.#fontRGB = colorToRGB(this.#rootStyle.color);

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

  #initFillAttributes = (fillAttributes) => {
    if (fillAttributes === undefined) {
      const defaultFillAttributes = {
        figure: 'ripple',
        ratio: undefined,
      };

      this.#initFillAlgorithm(defaultFillAttributes);
      return;
    }

    if (fillAttributes.figure !== undefined) {
      checkType(fillAttributes.figure, primitiveType.string);
      const result = !!this.#fillAlgorithms.filter(
        (algorithm) => algorithm.figure === fillAttributes.figure
      ).length;

      if (!result) {
        console.warn(
          "Since this figure is not valid, 'ripple' is used as the default."
        );
      }
    }

    if (fillAttributes.ratio !== undefined) {
      checkType(fillAttributes.ratio, primitiveType.number);
      const result = 0 <= fillAttributes.ratio && fillAttributes.ratio <= 1;

      if (!result) {
        fillAttributes.ratio = undefined;
        console.warn(
          'The ratio must be a number between 0 and 1. The starting position is randomly set due to the invalidation of the ratio.'
        );
      }
    }

    this.#initFillAlgorithm(fillAttributes);
  };

  #initFillAlgorithm = (fillAttributes) => {
    const algorithmCount = this.#fillAlgorithms.length;
    let i;
    let fillAlgorithm;

    this.#fillRatio = fillAttributes.ratio;

    for (i = 0; i < algorithmCount; i++) {
      fillAlgorithm = this.#fillAlgorithms[i];

      if (fillAttributes.figure === fillAlgorithm.figure) {
        this.#fillCreator = fillAlgorithm.creator;
        this.#fillCollide = fillAlgorithm.collide;
        return;
      }
    }

    if (i === algorithmCount) {
      this.#fillCreator = TypeFill.DEFAULT_CREATOR;
      this.#fillCollide = TypeFill.DEFAULT_COLLIDE;
    }
  };

  #createRootElement = () => {
    this.#rootElement = document.createElement('div');
    this.#elementObj.parentElement.insertBefore(
      this.#rootElement,
      this.#elementObj
    );
    this.#rootElement.append(this.#elementObj);

    this.#rootElement.style.position = 'relative';
    this.#elementObj.style.transition = 'opacity 300ms ease-out';
    setTimeout(() => {
      this.#elementObj.style.opacity = 0;
    }, 1);
  };

  #createCanvases = () => {
    const padding = parseIntForPadding(this.#rootStyle.padding);
    const margin = parseIntForMargin(this.#rootStyle.margin);
    const toBeCreatedBackground =
      colorToRGB(this.#rootStyle.backgroundColor).a !== 0;
    this.#backgroundSize = this.#getClientSize(this.#elementObj);

    this.#canvasContainer = document.createElement('div');
    this.#canvasContainer.style.top = `-${
      this.#backgroundSize.height + margin.top + margin.bottom
    }px`;
    this.#canvasContainer.style.position = 'relative';

    if (toBeCreatedBackground) {
      this.#backgroundCanvas = document.createElement('canvas');
      this.#backgroundCtx = this.#backgroundCanvas.getContext('2d');
      this.#backgroundCanvas.style.cssText = `
        left: ${margin.left}px;
        top: ${margin.top}px;
      `;
      this.#resetBackground();
      this.#backgroundCanvas.style.position = 'absolute';
      this.#canvasContainer.append(this.#backgroundCanvas);
    }

    this.#canvas = document.createElement('canvas');
    this.#ctx = this.#canvas.getContext('2d', { willReadFrequently: true });
    this.#canvas.style.top = `${padding.top + margin.top}px`;
    this.#canvas.style.position = 'absolute';
    this.#resetStage(padding, margin);

    this.#canvasContainer.append(this.#canvas);
    this.#rootElement.append(this.#canvasContainer);
  };

  #resize = () => {
    const newBackgroundSize = this.#getClientSize(this.#elementObj);
    const isResized = newBackgroundSize.height !== this.#backgroundSize.height;
    const gap = newBackgroundSize.width - this.#backgroundSize.width;

    this.#backgroundSize = newBackgroundSize;
    this.#backgroundCanvas && this.#resetBackground();

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
      newBackgroundSize.height + margin.top + margin.bottom
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

  #resetBackground = () => {
    this.#backgroundCanvas.width = this.#backgroundSize.width;
    this.#backgroundCanvas.height = this.#backgroundSize.height;

    this.#backgroundCtx.fillStyle = this.#rootStyle.backgroundColor;
    this.#backgroundCtx.fillRect(
      0,
      0,
      this.#backgroundSize.width,
      this.#backgroundSize.height
    );
  };

  #initFrameMetricsAndFillFigure = () => {
    this.#textFrameMetrics = this.#textFrame.getMetrics(this.#stageSize);
    this.#fillFigureList = this.#textFrameMetrics.textFields.map(
      (textField) =>
        new this.#fillCreator(
          this.#fillTime,
          TypeFill.FPS_TIME,
          textField,
          this.#fillRatio
        )
    );
    this.#textCount = this.#fillFigureList.length;
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
          this.#fillCollide(
            dot,
            fillFigure.Metrics.point,
            fillFigure.Metrics.area
          )
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
