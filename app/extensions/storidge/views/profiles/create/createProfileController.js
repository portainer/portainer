angular.module('extension.storidge')
.controller('CreateProfileController', ['$scope', '$state', 'Notifications',
function ($scope, $state, Notifications) {

  $scope.formValues = {
    Directory: '/cio/volumes',
    Capacity: 20,
    Redundancy: '2',
    Provisioning: 'thin',
    Type: 'ssd',
    MinIOPS: 100,
    MaxIOPS: 2000,
    MinBandwidth: 1,
    MaxBandwidth: 100
  };

  $scope.createProfile = function () {
    Notifications.success('Profile successfully created');
    $state.go('storidge.profiles');
  };
}]);
