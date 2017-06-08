angular.module('portainer')
.controller('porImageRegistryController', ['RegistryService', 'Notifications',
function (RegistryService, Notifications) {

  var ctrl = this;

  function initComponent() {
    RegistryService.registries()
    .then(function success(data) {
      var registries = data;
      ctrl.availableRegistries = registries;
      ctrl.registry = registries[0].Name;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registries');
    });
  }

  initComponent();
}]);
