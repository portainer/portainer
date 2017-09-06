angular.module('extension.storidge')
.controller('EditProfileController', ['$scope', '$state', '$stateParams', 'Notifications', 'StoridgeProfileService', 'ModalService',
function ($scope, $state, $stateParams, Notifications, StoridgeProfileService, ModalService) {

  $scope.formValues = {
    LimitIOPS: true,
    LimitBandwidth: false
  };

  $scope.updateProfile = function() {
    $('#createResourceSpinner').show();

    var profile = $scope.profile;
    StoridgeProfileService.update(profile)
    .then(function success(data) {
      Notifications.success('Profile successfully updated');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update profile');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

  $scope.deleteProfile = function() {
    ModalService.confirmDeletion(
      'Do you want to remove this profile?',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteProfile();
      }
    );
  };

  function deleteProfile() {
    $('#createResourceSpinner').show();

    var profile = $scope.profile;
    StoridgeProfileService.delete(profile.Name)
    .then(function success(data) {
      Notifications.success('Profile successfully deleted');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to delete profile');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  }

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
