angular.module('volumes', [])
.controller('VolumesController', ['$scope', '$state', 'Volume', 'Notifications', 'Pagination', 'ModalService', 'Authentication', 'ResourceControlService', 'UserService',
function ($scope, $state, Volume, Notifications, Pagination, ModalService, Authentication, ResourceControlService, UserService) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('volumes');
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.config = {
    Name: ''
  };

  function removeVolumeResourceControl(volume) {
    ResourceControlService.removeVolumeResourceControl(volume.Metadata.ResourceControl.OwnerId, volume.Name)
    .then(function success() {
      delete volume.Metadata.ResourceControl;
      Notifications.success('Ownership changed to public', volume.Name);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to change volume ownership");
    });
  }

  $scope.switchOwnership = function(volume) {
    ModalService.confirmVolumeOwnershipChange(function (confirmed) {
      if(!confirmed) { return; }
      removeVolumeResourceControl(volume);
    });
  };

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
        Volume.remove({name: volume.Name}, function (d) {
          if (d.message) {
            Notifications.error("Unable to remove volume", {}, d.message);
          } else {
            if (volume.Metadata && volume.Metadata.ResourceControl) {
              ResourceControlService.removeVolumeResourceControl(volume.Metadata.ResourceControl.OwnerId, volume.Name)
              .then(function success() {
                Notifications.success("Volume deleted", volume.Name);
                var index = $scope.volumes.indexOf(volume);
                $scope.volumes.splice(index, 1);
              })
              .catch(function error(err) {
                Notifications.error("Failure", err, "Unable to remove volume ownership");
              });
            } else {
              Notifications.success("Volume deleted", volume.Name);
              var index = $scope.volumes.indexOf(volume);
              $scope.volumes.splice(index, 1);
            }
          }
          complete();
        }, function (e) {
          Notifications.error("Failure", e, "Unable to remove volume");
          complete();
        });
      }
    });
  };

  function mapUsersToVolumes(users) {
    angular.forEach($scope.volumes, function (volume) {
      if (volume.Metadata) {
        var volumeRC = volume.Metadata.ResourceControl;
        if (volumeRC && volumeRC.OwnerId !== $scope.user.ID) {
          angular.forEach(users, function (user) {
            if (volumeRC.OwnerId === user.Id) {
              volume.Owner = user.Username;
            }
          });
        }
      }
    });
  }

  function fetchVolumes() {
    $('#loadVolumesSpinner').show();
    var userDetails = Authentication.getUserDetails();
    $scope.user = userDetails;

    Volume.query({}, function (d) {
      var volumes = d.Volumes || [];
      $scope.volumes = volumes.map(function (v) {
        return new VolumeViewModel(v);
      });
      if (userDetails.role === 1) {
        UserService.users()
        .then(function success(data) {
          mapUsersToVolumes(data);
        })
        .catch(function error(err) {
          Notifications.error("Failure", err, "Unable to retrieve users");
        })
        .finally(function final() {
          $('#loadVolumesSpinner').hide();
        });
      } else {
        $('#loadVolumesSpinner').hide();
      }
    }, function (e) {
      $('#loadVolumesSpinner').hide();
      Notifications.error("Failure", e, "Unable to retrieve volumes");
      $scope.volumes = [];
    });
  }
  fetchVolumes();
}]);
