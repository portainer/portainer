import angular from 'angular';

angular.module('portainer.docker').component('containerCapabilities', {
  templateUrl: './containerCapabilities.html',
  bindings: {
    capabilities: '='
  }
});
