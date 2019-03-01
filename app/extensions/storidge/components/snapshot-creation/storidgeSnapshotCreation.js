angular.module('portainer.docker').component('storidgeSnapshotCreation', {
  templateUrl: 'app/extensions/storidge/components/snapshot-creation/storidgeSnapshotCreation.html',
  controller: 'StoridgeSnapshotCreationController',
  bindings: {
    volumeId: '<'
  }
});
