angular.module('portainer.app').controller('InformationPanelOfflineController', ['EndpointProvider', 'EndpointService', 'Notifications',
function StackDuplicationFormController(EndpointProvider, EndpointService, Notifications) {
  var ctrl = this;

  this.$onInit = onInit;

  function onInit() {
    var endpointId = EndpointProvider.endpointID();

    EndpointService.endpoint(endpointId)
    .then(function onSuccess(data) {
      ctrl.snapshotTime = data.Snapshots[0].Time;
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
    });
  }

}]);
