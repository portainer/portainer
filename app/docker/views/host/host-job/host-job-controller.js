angular.module('portainer.docker').controller('HostJobController', [
  '$state', 'SystemService', 'Notifications', 'StateManager',
  function HostJobController($state, SystemService, Notifications, StateManager) {
    var ctrl = this;
    ctrl.$onInit = $onInit;

    function $onInit() {
      var hostManagementFeatures = StateManager.getState().application.enableHostManagementFeatures;
      if (!hostManagementFeatures) {
        $state.go('portainer.home');
      }

      SystemService.info()
      .then(function onInfoLoaded(host) {
        ctrl.host = host;
      })
      .catch(function onError(err) {
        Notifications.error('Unable to retrieve host information', err);
      });
    }
  }
]);
