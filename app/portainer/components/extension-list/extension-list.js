angular.module('portainer.app').component('extensionList', {
  templateUrl: 'app/portainer/components/extension-list/extensionList.html',
  bindings: {
    extensions: '<',
    currentDate: '<'
  }
});
