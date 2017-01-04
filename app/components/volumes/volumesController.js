angular.module('volumes', [])
.controller('VolumesController', ['$scope', '$state', 'Volume', 'Messages', 'Settings',
function ($scope, $state, Volume, Messages, Settings) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.checkedAll = false;
  $scope.sortType = 'Name';
  $scope.sortReverse = true;
  $scope.config = {
    Name: ''
  };
  $scope.pagination_count = Settings.pagination_count;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };
  
  $scope.selectAllItem = function () {
    if($scope.state.selectedItemCount===$scope.volumes.length){
      angular.forEach($scope.volumes, function (i) {
        i.Checked = false;
        $scope.state.selectedItemCount--;
      });
    } else {
      angular.forEach($scope.volumes, function (i) {
        if (!i.Checked) {
          i.Checked = true;
          $scope.state.selectedItemCount++;
        }
      });
    }
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
      if($scope.state.selectedItemCount===$scope.volumes.length){
        $scope.state.checkedAll = true;
      }
    } else {
      $scope.state.selectedItemCount--;
      if($scope.state.checkedAll){
        $scope.state.checkedAll = false;
      }
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
            Messages.error("Unable to remove volume", {}, d.message);
          } else {
            Messages.send("Volume deleted", volume.Name);
            var index = $scope.volumes.indexOf(volume);
            $scope.volumes.splice(index, 1);
            $scope.state.selectedItemCount--;
            $scope.state.checkedAll = false;
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, "Unable to remove volume");
          complete();
        });
      }
    });
  };

  function fetchVolumes() {
    $('#loadVolumesSpinner').show();
    Volume.query({}, function (d) {
      $scope.volumes = d.Volumes || [];
      $('#loadVolumesSpinner').hide();
    }, function (e) {
      $('#loadVolumesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve volumes");
      $scope.volumes = [];
    });
  }
  fetchVolumes();
}]);
