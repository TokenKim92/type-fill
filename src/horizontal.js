import { randomPosInRect } from './utils.js';

class Horizontal {
  #targetTime;
  #fpsTime;
  #speed;
  #curWidth = {
    left: 0,
    right: 0,
  };
  #targetWidth;
  #startPos;

  constructor(targetTime, fpsTime, stageRect, startPosRatio = undefined) {
    this.#targetTime = targetTime;
    this.#fpsTime = fpsTime;

    this.#startPos =
      startPosRatio !== undefined
        ? {
            x: stageRect.x + stageRect.width * startPosRatio,
            y: stageRect.y + stageRect.height / 2,
          }
        : {
            x: randomPosInRect(stageRect).x,
            y: stageRect.y + stageRect.height / 2,
          };

    this.#targetWidth = {
      left: this.#startPos.x - stageRect.x,
      right: stageRect.x + stageRect.width - this.#startPos.x,
    };
    this.#speed = this.#calculateSpeed(this.#targetWidth, fpsTime);
  }

  reset = () => {
    this.#curWidth = {
      left: 0,
      right: 0,
    };
  };

  #calculateSpeed = () => {
    return {
      left: (this.#targetWidth.left / this.#targetTime) * this.#fpsTime,
      right: (this.#targetWidth.right / this.#targetTime) * this.#fpsTime,
    };
  };

  update = () => {
    this.#curWidth.left <= this.#targetWidth.left &&
      (this.#curWidth.left += this.#speed.left);

    this.#curWidth.right <= this.#targetWidth.right &&
      (this.#curWidth.right += this.#speed.right);
  };

  get Metrics() {
    return {
      point: {
        x: this.#startPos.x,
        y: this.#startPos.y,
      },
      area: this.#curWidth,
    };
  }
}

export default Horizontal;
