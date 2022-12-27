import { randomPosInRect } from './utils.js';

class Vertical {
  #targetTime;
  #fpsTime;
  #speed;
  #curHeight = {
    top: 0,
    bottom: 0,
  };
  #targetHeight;
  #startPos;

  constructor(targetTime, fpsTime, stageRect, startPosRatio = undefined) {
    this.#targetTime = targetTime;
    this.#fpsTime = fpsTime;

    this.#startPos =
      startPosRatio !== undefined
        ? {
            x: stageRect.x + stageRect.width / 2,
            y: stageRect.y + stageRect.height * startPosRatio,
          }
        : {
            x: stageRect.x + stageRect.width / 2,
            y: randomPosInRect(stageRect).y,
          };

    this.#targetHeight = {
      top: this.#startPos.y - stageRect.y,
      bottom: stageRect.y + stageRect.height - this.#startPos.y,
    };
    this.#speed = this.#calculateSpeed(this.#targetHeight, fpsTime);
  }

  reset = () => {
    this.#curHeight = {
      top: 0,
      bottom: 0,
    };
  };

  #calculateSpeed = () => {
    return {
      top: (this.#targetHeight.top / this.#targetTime) * this.#fpsTime,
      bottom: (this.#targetHeight.bottom / this.#targetTime) * this.#fpsTime,
    };
  };

  update = () => {
    this.#curHeight.top <= this.#targetHeight.top &&
      (this.#curHeight.top += this.#speed.top);

    this.#curHeight.bottom <= this.#targetHeight.bottom &&
      (this.#curHeight.bottom += this.#speed.bottom);
  };

  get Metrics() {
    return {
      point: {
        x: this.#startPos.x,
        y: this.#startPos.y,
      },
      area: this.#curHeight,
    };
  }
}

export default Vertical;
