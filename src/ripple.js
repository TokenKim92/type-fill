import { distance, randomPosInRect } from './utils.js';

class Ripple {
  static BOUNCE = 0.82;

  #targetTime;
  #speed;
  #curRadius = 0;
  #targetRadius;
  #startPos;

  constructor(targetTime, fpsTime, stageRect, startPos = undefined) {
    this.#targetTime = targetTime;
    this.#startPos =
      startPos !== undefined ? startPos : randomPosInRect(stageRect);
    this.#targetRadius = this.#getMaxDistance(this.#startPos, stageRect);
    this.#speed = this.#calculateSpeed(this.#targetRadius, fpsTime);
  }

  #getMaxDistance(pos, rect) {
    const fromLeftTop = distance(rect.x, rect.y, pos.x, pos.y);
    const fromRightTop = distance(rect.x + rect.width - 1, rect.y, pos.x, pos.y); // prettier-ignore
    const fromLeftBottom = distance(rect.x, rect.y + rect.height - 1, pos.x, pos.y); // prettier-ignore
    const fromRightBottom = distance(rect.x + rect.y + rect.width - 1, rect.height - 1, pos.x, pos.y); // prettier-ignore

    return Math.max(fromLeftTop, fromRightTop, fromLeftBottom, fromRightBottom);
  }

  #calculateSpeed(targetRadius, fpsTime) {
    return (targetRadius / this.#targetTime) * fpsTime;
  }

  update() {
    this.#curRadius <= this.#targetRadius && (this.#curRadius += this.#speed);
  }

  get Metrics() {
    return {
      centerPoint: {
        x: this.#startPos.x,
        y: this.#startPos.y,
      },
      radius: this.#curRadius,
    };
  }
}

export default Ripple;
