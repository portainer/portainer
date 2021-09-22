angular.module('portainer.app').controller('InformationPanelOfflineController', [
  '$state',
  'EndpointProvider',
  'EndpointService',
  'Authentication',
  'Notifications',
  function StackDuplicationFormController($state, EndpointProvider, EndpointService, Authentication, Notifications) {
    var ctrl = this;

    this.$onInit = onInit;
    this.triggerSnapshot = triggerSnapshot;

    function triggerSnapshot() {
      var endpointId = EndpointProvider.endpointID();

      EndpointService.snapshotEndpoint(endpointId)
        .then(function onSuccess() {
          $state.reload();
        })
        .catch(function onError(err) {
          Notifications.error('Failure', err, 'An error occured during environment snapshot');
        });
    }

    function onInit() {
      var endpointId = EndpointProvider.endpointID();
      ctrl.showRefreshButton = Authentication.isAdmin();

      EndpointService.endpoint(endpointId)
        .then(function onSuccess(data) {
          ctrl.snapshotTime = data.Snapshots[0].Time;
        })
        .catch(function onError(err) {
          Notifications.error('Failure', err, 'Unable to retrieve environment information');
        });
    }
  },
]);
