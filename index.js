import TypeFill from './src/TypeFill.js';

const type = new TypeFill('type', 2000);
type.start();

setTimeout(() => {
  type.restart();
}, 3000);
