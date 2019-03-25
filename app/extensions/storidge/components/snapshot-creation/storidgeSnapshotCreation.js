angular.module('portainer.docker').component('storidgeSnapshotCreation', {
  templateUrl: './storidgeSnapshotCreation.html',
  controller: 'StoridgeSnapshotCreationController',
  bindings: {
    volumeId: '<'
  }
});
