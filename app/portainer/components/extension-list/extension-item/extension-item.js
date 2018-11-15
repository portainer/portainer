angular.module('portainer.app').component('extensionItem', {
  templateUrl: 'app/portainer/components/extension-list/extension-item/extensionItem.html',
  controller: 'ExtensionItemController',
  bindings: {
    model: '<',
    currentDate: '<'
  }
});
