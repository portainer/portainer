angular.module('portainer.app').component('informationPanel', {
  templateUrl: './informationPanel.html',
  bindings: {
    titleText: '@',
    dismissAction: '&?'
  },
  transclude: true
});
