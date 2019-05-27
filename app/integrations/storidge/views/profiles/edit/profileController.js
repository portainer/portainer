angular.module('portainer.integrations.storidge')
.controller('StoridgeProfileController', ['$scope', '$state', '$transition$', 'Notifications', 'StoridgeProfileService', 'ModalService',
function ($scope, $state, $transition$, Notifications, StoridgeProfileService, ModalService) {

  $scope.formValues = {
    Labels: []
  };

  $scope.state = {
    NoLimit: false,
    LimitIOPS: false,
    LimitBandwidth: false,
    updateInProgress: false,
    deleteInProgress: false,
    RecurringSnapshotEnabled: false
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ name: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  function prepareLabels(profile) {
    var labels = {};
    $scope.formValues.Labels.forEach(function (label) {
      if (label.name && label.value) {
        labels[label.name] = label.value;
      }
    });
    profile.Labels = labels;
  }

  function initLabels(labels) {
    $scope.formValues.Labels = Object.keys(labels).map(function(key) {
      return { name:key, value:labels[key] };
    });
  }

  $scope.RedundancyOptions = [
    { value: 2, label: '2-copy' },
    { value: 3, label: '3-copy' }
  ];

  $scope.update = function() {
    var profile = $scope.profile;

    if (!$scope.state.LimitIOPS) {
      delete profile.MinIOPS;
      delete profile.MaxIOPS;
    }

    if (!$scope.state.LimitBandwidth) {
      delete profile.MinBandwidth;
      delete profile.MaxBandwidth;
    }

    if (profile.SnapshotEnabled) {
      if (!profile.SnapshotMax || profile.SnapshotMax <= 0) {
        profile.SnapshotMax = 1;
      }
      if (!$scope.state.RecurringSnapshotEnabled) {
        delete profile.SnapshotInterval;
      }
      if ($scope.state.RecurringSnapshotEnabled && (!profile.SnapshotInterval || profile.SnapshotInterval <= 0)) {
        profile.SnapshotInterval = 1440;
      }
    } else {
      delete profile.SnapshotMax;
      delete profile.SnapshotInterval;
    }

    prepareLabels(profile);

    $scope.state.updateInProgress = true;
    StoridgeProfileService.update(profile)
    .then(function success() {
      Notifications.success('Profile successfully updated');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update profile');
    })
    .finally(function final() {
      $scope.state.updateInProgress = false;
    });
  };

  $scope.delete = function() {
    ModalService.confirmDeletion(
      'Do you want to remove this profile?',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteProfile();
      }
    );
  };

  function deleteProfile() {
    var profile = $scope.profile;

    $scope.state.deleteInProgress = true;
    StoridgeProfileService.delete(profile.Name)
    .then(function success() {
      Notifications.success('Profile successfully deleted');
      $state.go('storidge.profiles');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to delete profile');
    })
    .finally(function final() {
      $scope.state.deleteInProgress = false;
    });
  }

  function initView() {
    StoridgeProfileService.profile($transition$.params().id)
    .then(function success(data) {
      var profile = data;
      if ((profile.MinIOPS && profile.MinIOPS !== 0) || (profile.MaxIOPS && profile.MaxIOPS !== 0)) {
        $scope.state.LimitIOPS = true;
      } else if ((profile.MinBandwidth && profile.MinBandwidth !== 0) || (profile.MaxBandwidth && profile.MaxBandwidth !== 0)) {
        $scope.state.LimitBandwidth = true;
      } else {
        $scope.state.NoLimit = true;
      }
      if (profile.SnapshotEnabled && profile.SnapshotInterval !== 0) {
        $scope.state.RecurringSnapshotEnabled = true;
      }
      initLabels(profile.Labels);
      $scope.profile = profile;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve profile details');
    });
  }

  initView();

}]);
