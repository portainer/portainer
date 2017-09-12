angular.module('extension.storidge')
.controller('CreateProfileController', ['$scope', '$state', '$stateParams', 'Notifications', 'StoridgeProfileService',
function ($scope, $state, $stateParams, Notifications, StoridgeProfileService) {

  $scope.state = {
    NoLimit: true,
    LimitIOPS: false,
    LimitBandwidth: false,
    ManualInputDirectory: false
  };

  $scope.createProfile = function () {
    $('#resourceCreationSpinner').show();
    var profile = $scope.model;

    if (!$scope.state.LimitIOPS) {
      delete profile.MinIOPS;
      delete profile.MaxIOPS;
    }

    if (!$scope.state.LimitBandwidth) {
      delete profile.MinBandwidth;
      delete profile.MaxBandwidth;
    }

    StoridgeProfileService.create(profile)
    .then(function success(data) {
      Notifications.success('Profile successfully created');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create profile');
    })
    .finally(function final() {
      $('#resourceCreationSpinner').hide();
    });
  };

  $scope.updatedName = function() {
    if (!$scope.state.ManualInputDirectory) {
      var profile = $scope.model;
      profile.Directory = '/cio/' + profile.Name;
    }
  };

  $scope.updatedDirectory = function() {
    if (!$scope.state.ManualInputDirectory) {
      $scope.state.ManualInputDirectory = true;
    }
  };

  function initView() {
    var profile = new StoridgeProfileDefaultModel();
    profile.Name = $stateParams.profileName;
    profile.Directory = '/cio/' + profile.Name;
    $scope.model = profile;
  }

  initView();
}]);
