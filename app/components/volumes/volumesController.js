angular.module('volumes', [])
.controller('VolumesController', ['$q', '$scope', '$state', '$filter', 'VolumeService', 'Notifications', 'PaginationService',
function ($q, $scope, $state, $filter, VolumeService, Notifications, PaginationService) {
  // $scope.state = {};
  // $scope.state.pagination_count = PaginationService.getPaginationCount('volumes');
  // $scope.state.selectedItemCount = 0;
  // $scope.sortType = 'Id';
  // $scope.sortReverse = false;

  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('volumes', $scope.state.pagination_count);
  // };
  //
  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.selectItems = function (allSelected) {
  //   angular.forEach($scope.state.filteredVolumes, function (volume) {
  //     if (volume.Checked !== allSelected) {
  //       volume.Checked = allSelected;
  //       $scope.selectItem(volume);
  //     }
  //   });
  // };
  //
  // $scope.selectItem = function (item) {
  //   if (item.Checked) {
  //     $scope.state.selectedItemCount++;
  //   } else {
  //     $scope.state.selectedItemCount--;
  //   }
  // };

  $scope.renderFieldId = function(item, value) {
    return '<span class="monospaced">' + $filter('truncate')(value, 25) + '</span>';
  };

  $scope.renderFieldOwnership = function(item, value) {
    switch (item.ResourceControl.Ownership) {
      case 'private':
        return '<span><i class="fa fa-eye-slash" aria-hidden="true" style="margin-right: 5px"></i>private</span>';
      case 'administrators':
        return '<span><i class="fa fa-eye-slash" aria-hidden="true" style="margin-right: 5px"></i>administrators</span>';
      case 'restricted':
        return '<span><i class="fa fa-users" aria-hidden="true" style="margin-right: 5px"></i>restricted</span>';
      default:
        return '<span><i class="fa fa-eye" aria-hidden="true" style="margin-right: 5px"></i>public</span>';
    }
  };

  $scope.renderLabel = function(item) {
    if (item.dangling) {
      return '<span style="margin-left: 10px;" class="label label-warning image-tag">Unused</span>';
    }
    return '';
  };

  $scope.goToVolumeCreation = function() {
    $state.go('actions.create.volume');
  };

  $scope.removeAction = function () {
    angular.forEach($scope.volumes, function (volume) {
      if (volume.Checked) {
        VolumeService.remove(volume)
        .then(function success() {
          Notifications.success('Volume deleted', volume.Id);
          var index = $scope.volumes.indexOf(volume);
          $scope.volumes.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove volume');
        });
      }
    });
  };

  function initView() {

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
    });
  }
  initView();
}]);
