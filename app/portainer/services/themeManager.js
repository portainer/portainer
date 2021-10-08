angular.module('portainer.app').service('ThemeManager', ThemeManager);

/* @ngInject */

export function ThemeManager(StateManager) {
  return {
    setTheme,
    defaultTheme,
  };

  function setTheme(theme) {
    if (!theme) {
      document.documentElement.removeAttribute('theme');
    } else {
      document.documentElement.setAttribute('theme', theme);
    }
    StateManager.updateTheme(theme);
  }

  function defaultTheme() {
    document.documentElement.removeAttribute('theme');
  }
}
