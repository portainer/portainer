angular.module('portainer.docker')
.controller('StoridgeSnapshotCreationController', ['StoridgeSnapshotService', 'Notifications', '$state',
function (StoridgeSnapshotService, Notifications, $state) {
  var ctrl = this;

  this.formValues = {};
  this.state = {
    actionInProgress: false
  };

  this.createSnapshot = function () {
    ctrl.state.actionInProgress = true;
    StoridgeSnapshotService.create(ctrl.volumeId, ctrl.formValues.Description)
      .then(function success() {
        Notifications.success('Success', 'Snapshot successfully created');
        $state.reload();
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create snapshot');
      })
      .finally(function final() {
        ctrl.state.actionInProgress = false;
      });
  };

}]);
