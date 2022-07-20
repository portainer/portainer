import controller from './container-capabilities.controller';

angular.module('portainer.docker').component('containerCapabilities', {
  templateUrl: './containerCapabilities.html',
  bindings: {
    capabilities: '=',
  },
  controller,
});
