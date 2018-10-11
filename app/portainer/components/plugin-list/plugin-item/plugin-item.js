angular.module('portainer.app').component('pluginItem', {
  templateUrl: 'app/portainer/components/plugin-list/plugin-item/pluginItem.html',
  controller: 'PluginItemController',
  bindings: {
    model: '<',
    currentDate: '<'
  }
});
