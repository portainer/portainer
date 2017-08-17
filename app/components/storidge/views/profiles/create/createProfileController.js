angular.module('extension.storidge')
.controller('CreateProfileController', ['$scope', '$state', 'Notifications',
function ($scope, $state, Notifications) {

  $scope.config = {
    Driver: 'bridge',
    CheckDuplicate: true,
    Internal: false,
    // Force IPAM Driver to 'default', should not be required.
    // See: https://github.com/docker/docker/issues/25735
    IPAM: {
      Driver: 'default',
      Config: []
    },
    Labels: {}
  };

  $scope.createProfile = function () {
    Notifications.success('Profile successfully created');
    $state.go('storidge.profiles');
  };
}]);
