import { ThemeColor } from '@/portainer/users/types';

let removeAutoThemeListener: (() => void) | null = null;

export function applyTheme(color: ThemeColor) {
  removeAutoThemeListener?.();
  removeAutoThemeListener = null;

  if (color === 'auto' || !color) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange() {
      applyAutoTheme(mediaQuery);
    }

    applyAutoTheme(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    removeAutoThemeListener = () =>
      mediaQuery.removeEventListener('change', handleChange);
  } else {
    document.documentElement.setAttribute('theme', color);
  }
}

function applyAutoTheme(mediaQuery: MediaQueryList) {
  if (mediaQuery.matches) {
    document.documentElement.setAttribute('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('theme');
  }
}
