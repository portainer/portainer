angular.module('volumes', [])
.controller('VolumesController', ['$scope', '$state', 'Volume', 'Messages', 'errorMsgFilter',
function ($scope, $state, Volume, Messages, errorMsgFilter) {
  $scope.state = {};
  $scope.state.toggle = false;
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Driver';
  $scope.sortReverse = true;

  $scope.config = {
    Name: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredVolumes, function (i) {
      i.Checked = $scope.state.toggle;
    });
    if ($scope.state.toggle) {
      $scope.state.selectedItemCount = $scope.state.filteredVolumes.length;
    } else {
      $scope.state.selectedItemCount = 0;
    }
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  function prepareVolumeConfiguration() {
    var config = angular.copy($scope.config);
    config.Driver = 'local-persist';
    config.DriverOpts = {};
    config.DriverOpts.mountpoint = '/volume/' + config.Name;
    return config;
  }

  $scope.createVolume = function() {
    $('#createVolumeSpinner').show();
    var config = prepareVolumeConfiguration();
    Volume.create(config, function (d) {
      if (d.Name) {
        Messages.send("Volume created", d.Name);
        $('#createVolumeSpinner').hide();
        $state.go('volumes', {}, {reload: true});
      } else {
        $('#createVolumeSpinner').hide();
        Messages.error('Unable to create volume', errorMsgFilter(d));
      }
    }, function (e) {
      $('#createVolumeSpinner').hide();
      Messages.error('Unable to create volume', e.data);
    });
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
          Messages.send("Volume deleted", volume.Name);
          var index = $scope.volumes.indexOf(volume);
          $scope.volumes.splice(index, 1);
          complete();
        }, function (e) {
          Messages.error("Failure", e.data);
          complete();
        });
      }
    });
  };

  function fetchVolumes() {
    $('#loadVolumesSpinner').show();
    Volume.query({}, function (d) {
      $scope.volumes = _.uniqBy(d.Volumes, 'Name');
      $('#loadVolumesSpinner').hide();
    }, function (e) {
      Messages.error("Failure", e.data);
      $('#loadVolumesSpinner').hide();
    });
  }
  fetchVolumes();
}]);
