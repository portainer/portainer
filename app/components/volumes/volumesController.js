angular.module('volumes', [])
.controller('VolumesController', ['$q', '$scope', '$state', 'VolumeService', 'Notifications',
function ($q, $scope, $state, VolumeService, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (volume) {
      VolumeService.remove(volume)
      .then(function success() {
        Notifications.success('Volume successfully removed', volume.Id);
        var index = $scope.volumes.indexOf(volume);
        $scope.volumes.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove volume');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function initView() {
    $q.all({
      attached: VolumeService.volumes({ filters: { 'dangling': ['false'] } }),
      dangling: VolumeService.volumes({ filters: { 'dangling': ['true'] } })
    })
    .then(function success(data) {
      $scope.volumes = data.attached.map(function(volume) {
        volume.dangling = false;
        return volume;
      }).concat(data.dangling.map(function(volume) {
        volume.dangling = true;
        return volume;
      }));
    }).catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve volumes');
    });
  }
  initView();
}]);
