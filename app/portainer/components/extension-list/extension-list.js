angular.module('portainer.app').component('extensionList', {
  templateUrl: './extensionList.html',
  bindings: {
    extensions: '<',
    currentDate: '<'
  }
});
