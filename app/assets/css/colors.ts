import colors from './colors.json';

const element = document.createElement('style');

element.innerHTML = `:root {  
  ${Object.entries(colors)
    .map(([color, hex]) => `--ui-${color}: ${hex}`)
    .join(';\n')}
}`;

document.head.prepend(element);
