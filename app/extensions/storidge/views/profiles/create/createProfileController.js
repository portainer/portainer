angular.module('extension.storidge')
.controller('StoridgeCreateProfileController', ['$scope', '$state', '$transition$', 'Notifications', 'StoridgeProfileService', 'StoridgeManager',
function ($scope, $state, $transition$, Notifications, StoridgeProfileService, StoridgeManager) {

  $scope.state = {
    NoLimit: true,
    LimitIOPS: false,
    LimitBandwidth: false,
    ManualInputDirectory: false,
    actionInProgress: false
  };

  $scope.RedundancyOptions = [
    { value: 2, label: '2-copy' },
    { value: 3, label: '3-copy' }
  ];

  $scope.create = function () {
    var profile = $scope.model;

    if (!$scope.state.LimitIOPS) {
      delete profile.MinIOPS;
      delete profile.MaxIOPS;
    }

    if (!$scope.state.LimitBandwidth) {
      delete profile.MinBandwidth;
      delete profile.MaxBandwidth;
    }

    $scope.state.actionInProgress = true;
    StoridgeProfileService.create(profile)
    .then(function success(data) {
      Notifications.success('Profile successfully created');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create profile');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
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
    profile.Name = $transition$.params().profileName;
    profile.Directory = '/cio/' + profile.Name;
    $scope.model = profile;
  }

  StoridgeManager.init()
  .then(function success() {
    initView();
  })
  .catch(function error(err) {
    Notifications.error('Failure', err, 'Unable to communicate with Storidge API');
  });
}]);
