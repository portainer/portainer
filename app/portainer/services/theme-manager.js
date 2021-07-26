angular.module('portainer.app').factory('ThemeManager', [
  /* @ngInject */
  function ThemeManagerFactory() {
    var service = {};

    service.setTheme = function (theme) {
      document.documentElement.setAttribute('theme', theme);
    };

    return service;
  },
]);
