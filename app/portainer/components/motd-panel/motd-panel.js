angular.module('portainer.app').component('motdPanel', {
  templateUrl: './motdPanel.html',
  bindings: {
    motd: '<',
    dismissAction: '&?'
  },
  transclude: true
});
