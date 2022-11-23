import TypeFill from '../src/typeFill.js';

const type = new TypeFill('type', 2000, {
  ratio: 0.5,
});
type.start();

setTimeout(() => {
  type.restart();
}, 3000);
