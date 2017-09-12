angular.module('extension.storidge')
.controller('EditProfileController', ['$scope', '$state', '$stateParams', 'Notifications', 'StoridgeProfileService', 'ModalService',
function ($scope, $state, $stateParams, Notifications, StoridgeProfileService, ModalService) {

  $scope.state = {
    NoLimit: true,
    LimitIOPS: false,
    LimitBandwidth: false
  };

  $scope.RedundancyOptions = [
    { value: 2, label: '2-copy' },
    { value: 3, label: '3-copy' }
  ];

  $scope.updateProfile = function() {
    $('#createResourceSpinner').show();

    var profile = $scope.profile;

    if (!$scope.state.LimitIOPS) {
      delete profile.MinIOPS;
      delete profile.MaxIOPS;
    }

    if (!$scope.state.LimitBandwidth) {
      delete profile.MinBandwidth;
      delete profile.MaxBandwidth;
    }

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
      var profile = data;
      if ((profile.MinIOPS && profile.MinIOPS !== 0) || (profile.MaxIOPS && profile.MaxIOPS !== 0)) {
        $scope.state.LimitIOPS = true;
      } else if ((profile.MinBandwidth && profile.MinBandwidth !== 0) || (profile.MaxBandwidth && profile.MaxBandwidth !== 0)) {
        $scope.state.LimitBandwidth = true;
      } else {
        $scope.state.NoLimit = true;
      }
      $scope.profile = profile;
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
