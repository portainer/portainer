angular.module('portainer.docker').controller('HostBrowserViewController', [
  'SystemService',
  'Notifications',
  function HostBrowserViewController(SystemService, Notifications) {
    var ctrl = this;
    ctrl.$onInit = $onInit;

    function $onInit() {
      SystemService.info()
        .then(function onInfoLoaded(host) {
          ctrl.host = host;
        })
        .catch(function onError(err) {
          Notifications.error('Unable to retrieve host information', err);
        });
    }
  },
]);
