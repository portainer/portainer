import { ThemeColor } from '@/portainer/users/types';

export function applyTheme(color: ThemeColor) {
  if (color === 'auto' || !color) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.setAttribute('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('theme');
    }
  } else {
    document.documentElement.setAttribute('theme', color);
  }
}
