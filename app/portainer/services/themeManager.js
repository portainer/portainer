import { applyTheme } from '@/react/portainer/services/applyTheme';

angular.module('portainer.app').service('ThemeManager', ThemeManager);

// @deprecated use applyTheme instead
export function ThemeManager() {
  return {
    setTheme,
    autoTheme,
    defaultTheme,
  };

  function setTheme(theme) {
    applyTheme(theme);
  }

  function autoTheme() {
    applyTheme('auto');
  }

  function defaultTheme() {
    document.documentElement.removeAttribute('theme');
  }
}
