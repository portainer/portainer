angular.module('docker', [])
.controller('DockerController', ['$scope', 'Info', 'Version', 'Notifications',
function ($scope, Info, Version, Notifications) {
  $scope.state = {
    loaded: false
  };
  $scope.info = {};
  $scope.version = {};

  Info.get({}, function (infoData) {
    $scope.info = infoData;
    Version.get({}, function (versionData) {
      $scope.version = versionData;
      $scope.state.loaded = true;
      $('#loadingViewSpinner').hide();
    }, function (e) {
      Notifications.error("Failure", e, 'Unable to retrieve engine details');
      $('#loadingViewSpinner').hide();
    });
  }, function (e) {
    Notifications.error("Failure", e, 'Unable to retrieve engine information');
    $('#loadingViewSpinner').hide();
  });
}]);
