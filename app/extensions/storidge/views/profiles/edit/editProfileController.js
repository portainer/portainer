angular.module('extension.storidge')
.controller('EditProfileController', ['$scope', '$state', '$stateParams', 'Notifications', 'StoridgeProfileService',
function ($scope, $state, $stateParams, Notifications, StoridgeProfileService) {

  $scope.formValues = {
    LimitIOPS: true,
    LimitBandwidth: false
  };

  $scope.updateProfile = function() {
    Notifications.success('Profile successfully updated');
    $state.go('storidge.profiles');
  };

  function initView() {
    $('#loadingViewSpinner').show();

    StoridgeProfileService.profile($stateParams.id)
    .then(function success(data) {
      $scope.profile = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve profile details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
