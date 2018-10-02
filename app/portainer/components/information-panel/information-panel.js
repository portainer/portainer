angular.module('portainer.app').component('informationPanel', {
  templateUrl: 'app/portainer/components/information-panel/informationPanel.html',
  bindings: {
    titleText: '@',
    dismissAction: '&',
    cantDismiss: '<'
  },
  transclude: true
});
