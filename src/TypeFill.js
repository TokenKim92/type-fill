import BaseType from './BaseType.js';
import {
  checkType,
  primitiveType,
  collideRipple,
  collideHorizontal,
  collideVertical,
} from './utils.js';
import Ripple from './Ripple.js';
import Horizontal from './Horizontal.js';
import Vertical from './Vertical.js';

export default class TypeFill extends BaseType {
  static DEFAULT_CREATOR = Ripple;
  static DEFAULT_COLLIDE = collideRipple;

  #fillFigureList = [];
  #pixelInfosList;
  #fillTime;
  #targetFillCount;
  #curFillCount = 0;
  #textCount;
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
    super(elementId);

    checkType(fillTime, primitiveType.number);
    if (fillTime <= 0) {
      throw new Error("'fillTime' should be greater then 0.");
    }

    this.#initFillAttributes(fillAttributes);
    this.#fillTime = fillTime;
    this.#targetFillCount = fillTime / TypeFill.FPS_TIME;

    this.#initFrameMetricsAndFillFigure();
  }

  onRestart = () => {
    this.#curFillCount = 0;
    this.#fillFigureList.forEach((fillFigure) => fillFigure.reset());
    this.#pixelInfosList = this.getPixelInfosList(this.canvasSize);
  };

  onResize = () => {
    this.#initFrameMetricsAndFillFigure();
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

  #initFrameMetricsAndFillFigure = () => {
    this.#fillFigureList = this.getTextFields(this.canvasSize).map(
      (textField) =>
        new this.#fillCreator(
          this.#fillTime,
          TypeFill.FPS_TIME,
          textField,
          this.#fillRatio
        )
    );
    this.#textCount = this.#fillFigureList.length;
    this.#pixelInfosList = this.getPixelInfosList(this.canvasSize);
  };

  onDraw = () => {
    let fillFigure;
    let pixelInfos;

    for (let i = 0; i < this.#textCount; i++) {
      fillFigure = this.#fillFigureList[i];
      pixelInfos = this.#pixelInfosList[i];

      fillFigure.update();

      this.#pixelInfosList[i] = pixelInfos.filter((pixel) => {
        const result = this.#fillCollide(
          pixel,
          fillFigure.Metrics.point,
          fillFigure.Metrics.area
        );

        if (result) {
          const index = pixel.x + pixel.y * this.canvasSize.width;
          this.setPixelOnStage(index, pixel.alpha);
        }

        return !result;
      });
    }

    this.stageDraw();
    this.#curFillCount++;
  };

  onDrawFinish = () => {
    this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    this.drawText();
  };

  isDrawFinished = () => {
    return this.#curFillCount > this.#targetFillCount;
  };
}
