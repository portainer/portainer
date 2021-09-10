import angular from 'angular';

angular.module('portainer.app').component('showHide', {
  templateUrl: './show-hide.html',
  bindings: {
    value: '<',
    useAsterisk: '<',
  },
});
