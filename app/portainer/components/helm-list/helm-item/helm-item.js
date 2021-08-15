import angular from 'angular';

import './helm-item.css';

angular.module('portainer.app').component('helmItem', {
  templateUrl: './helm-item.html',
  bindings: {
    model: '<',
    onSelect: '<',
  },
  transclude: {
    actions: '?templateItemActions',
  },
});
