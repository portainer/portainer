angular.module('volumes', [])
.controller('VolumesController', ['$q', '$scope', 'VolumeService', 'Notifications', 'Pagination',
function ($q, $scope, VolumeService, Notifications, Pagination) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('volumes');
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Id';
  $scope.sortReverse = false;

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('volumes', $scope.state.pagination_count);
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredVolumes, function (volume) {
      if (volume.Checked !== allSelected) {
        volume.Checked = allSelected;
        $scope.selectItem(volume);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function () {
    $('#loadVolumesSpinner').show();
    var counter = 0;

    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadVolumesSpinner').hide();
      }
    };

    angular.forEach($scope.volumes, function (volume) {
      if (volume.Checked) {
        counter = counter + 1;
        VolumeService.remove(volume)
        .then(function success() {
          Notifications.success('Volume deleted', volume.Id);
          var index = $scope.volumes.indexOf(volume);
          $scope.volumes.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove volume');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  };

  function initView() {
    $('#loadVolumesSpinner').show();
    VolumeService.volumes()
    .then(function success(data) {
      $scope.volumes = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve volumes');
      $scope.volumes = [];
    })
    .finally(function final() {
      $('#loadVolumesSpinner').hide();
    });
  }
  initView();
}]);
