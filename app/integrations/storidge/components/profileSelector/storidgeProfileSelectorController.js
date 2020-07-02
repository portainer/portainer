angular.module('portainer.integrations.storidge').controller('StoridgeProfileSelectorController', [
  'StoridgeProfileService',
  'Notifications',
  function (StoridgeProfileService, Notifications) {
    var ctrl = this;

    this.$onInit = $onInit;
    function $onInit() {
      StoridgeProfileService.profiles()
        .then(function success(data) {
          ctrl.profiles = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve Storidge profiles');
        });
    }
  },
]);
