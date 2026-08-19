import colors from './colors.json';

const element = document.createElement('style');

element.innerHTML = `:root {
  ${Object.entries(colors)
    .map(([color, hex]) => {
      if (typeof hex === 'string') {
        return `--ui-${color}: ${hex}`;
      }

      return Object.entries(hex)
        .map(([key, value]) => `--ui-${color}-${key}: ${value}`)
        .join(';\n');
    })
    .join(';\n')}
}`;

document.head.prepend(element);
