angular.module('portainer.app').component('extensionItem', {
  templateUrl: './extensionItem.html',
  controller: 'ExtensionItemController',
  bindings: {
    model: '<',
    currentDate: '<'
  }
});
