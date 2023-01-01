# type-fill

A project to show how many animation effects can be shown in HTML5.

A library of type effects that animate text in windows.

This project includes a webpack config file to package this project into a library for easier use.( use `npm run build` or `npm run build-prod` )

## How to use

This is really all you need to get going.

```html
<h1 id="type">Berlin</h1>
```

```js
import TypeFill from './src/TypeFill.js';

new TypeFill('type').start();
```

You need to write your text in plain HTML tags with id and insert it as a parameter of your TypeFill class.

It has three main functions: `start()`, `stop()` and `restart()`.

As the name suggests. This is a function to start, stop and restart animations.

## Parameter of class

`TypeFill(elementId, fillTime, fillAttributes)`

1. `elementId`: the id of html tag ( Any ID can be used )
2. `fillTime`: time required to animate text
3. `fillAttributes`: an object that initializes this class. This object has two keys: `figure` and `ratio`.
   `figure` is the key to setting how the text is filled. There are three `String` types `horizontal`, `vertical` and `ripple`. `ripple` is the default fill type here.
   `ratio` is the key to setting where to start writing. This value must be a `Number` between 0 and 1. Horizontal and vertical cannot be set separately. The default ratio is random.

for example

```js
const type = new TypeFill('type', 2000, {
  figure: 'horizontal',
  ratio: 0.5,
});
```

## Used tools

- JavaScript

This is a pure JavaScript library with no other libraries. So you don't need to install any other libraries to use or contribute to this project.

## Overview

Take a look at this site to see how to animate as a example.

https://tokenkim92.github.io/type-fill/
