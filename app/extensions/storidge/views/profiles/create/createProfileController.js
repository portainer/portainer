angular.module('extension.storidge')
.controller('CreateProfileController', ['$scope', '$state', 'Notifications', 'StoridgeProfileService',
function ($scope, $state, Notifications, StoridgeProfileService) {

  $scope.formValues = {
    LimitIOPS: false,
    LimitBandwidth: false
  };

  $scope.model = new StoridgeProfileDefaultModel();

  $scope.createProfile = function () {
    $('#resourceCreationSpinner').show();
    StoridgeProfileService.create($scope.model)
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
}]);
