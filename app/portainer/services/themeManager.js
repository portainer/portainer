angular.module('portainer.app').service('ThemeManager', ThemeManager);

/* @ngInject */

export function ThemeManager(StateManager) {
  return {
    setTheme,
    autoTheme,
    defaultTheme,
  };

  function setTheme(theme) {
    if (!theme) {
      document.documentElement.removeAttribute('theme');
    } else {
      document.documentElement.setAttribute('theme', theme);
      StateManager.updateTheme(theme);
    }
  }

  function autoTheme() {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
    this.setTheme(systemTheme);
  }

  function defaultTheme() {
    document.documentElement.removeAttribute('theme');
  }
}
