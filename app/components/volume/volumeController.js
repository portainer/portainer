angular.module('volume', [])
.controller('VolumeController', ['$scope', '$state', '$stateParams', 'VolumeService', 'Notifications',
function ($scope, $state, $stateParams, VolumeService, Notifications) {

  $scope.removeVolume = function removeVolume() {
    $('#loadingViewSpinner').show();
    VolumeService.remove($scope.volume)
    .then(function success(data) {
      Notifications.success("Volume successfully removed", $stateParams.id);
      $state.go('volumes', {});
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to remove volume");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    VolumeService.volume($stateParams.id)
    .then(function success(data) {
      $scope.volume = data;
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to retrieve volume details");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
