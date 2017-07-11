angular.module('portainer').component('porAccessControlPanel', {
  templateUrl: 'app/directives/accessControlPanel/porAccessControlPanel.html',
  controller: 'porAccessControlPanelController',
  bindings: {
    resourceControl: '=',
    resourceType: '<'
  }
});
