angular.module('volumes', [])
.controller('VolumesController', ['$q', '$scope', 'VolumeService', 'Notifications', 'PaginationService',
function ($q, $scope, VolumeService, Notifications, PaginationService) {
  $scope.state = {};
  $scope.state.pagination_count = PaginationService.getPaginationCount('volumes');
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Id';
  $scope.sortReverse = false;

  $scope.changePaginationCount = function() {
    PaginationService.setPaginationCount('volumes', $scope.state.pagination_count);
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
    
    $q.all({
      attached: VolumeService.volumes({
        filters: { 
          'dangling': ['false']
        }
      }),
      dangling: VolumeService.volumes({
        filters: { 
          'dangling': ['true']
        }
      })
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
    })
    .finally(function final() {
      $('#loadVolumesSpinner').hide();
    });
  }
  initView();
}]);
