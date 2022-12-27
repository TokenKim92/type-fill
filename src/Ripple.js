import { distance, randomPosInRect } from './utils.js';

class Ripple {
  #targetTime;
  #speed;
  #curRadius = 0;
  #targetRadius;
  #startPos;

  constructor(targetTime, fpsTime, stageRect, startPosRatio = undefined) {
    this.#targetTime = targetTime;
    this.#startPos =
      startPosRatio !== undefined
        ? {
            x: stageRect.x + stageRect.width * startPosRatio,
            y: stageRect.y + stageRect.height * startPosRatio,
          }
        : randomPosInRect(stageRect);
    this.#targetRadius = this.#getMaxDistance(this.#startPos, stageRect);
    this.#speed = this.#calculateSpeed(this.#targetRadius, fpsTime);
  }

  reset = () => {
    this.#curRadius = 0;
  };

  #getMaxDistance = (pos, rect) => {
    const fromLeftTop = distance(rect.x, rect.y, pos.x, pos.y);
    const fromRightTop = distance(rect.x + rect.width - 1, rect.y, pos.x, pos.y); // prettier-ignore
    const fromLeftBottom = distance(rect.x, rect.y + rect.height - 1, pos.x, pos.y); // prettier-ignore
    const fromRightBottom = distance(rect.x + rect.width - 1, rect.y +  rect.height - 1, pos.x, pos.y); // prettier-ignore

    return Math.max(fromLeftTop, fromRightTop, fromLeftBottom, fromRightBottom);
  };

  #calculateSpeed = (targetRadius, fpsTime) => {
    return (targetRadius / this.#targetTime) * fpsTime;
  };

  update = () => {
    this.#curRadius <= this.#targetRadius && (this.#curRadius += this.#speed);
  };

  get Metrics() {
    return {
      point: {
        x: this.#startPos.x,
        y: this.#startPos.y,
      },
      area: this.#curRadius,
    };
  }
}

export default Ripple;
