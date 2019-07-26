import _ from 'lodash-es';
import { StoridgeProfileDefaultModel } from '../../models/profile';

angular.module('portainer.integrations.storidge')
.controller('StoridgeProfilesController', ['$q', '$scope', '$state', 'Notifications', 'StoridgeProfileService',
function ($q, $scope, $state, Notifications, StoridgeProfileService) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Name: ''
  };

  $scope.removeAction = function(selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (profile) {
      StoridgeProfileService.delete(profile.Name)
      .then(function success() {
        Notifications.success('Profile successfully removed', profile.Name);
        var index = $scope.profiles.indexOf(profile);
        $scope.profiles.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove profile');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.create = function() {
    var model = new StoridgeProfileDefaultModel();
    model.Labels = {};
    model.Name = $scope.formValues.Name;
    model.Directory = model.Directory + _.toLower(model.Name);
    delete model.MinBandwidth;
    delete model.MaxBandwidth;
    delete model.MinIOPS;
    delete model.MaxIOPS;

    $scope.state.actionInProgress = true;
    StoridgeProfileService.create(model)
    .then(function success() {
      Notifications.success('Profile successfully created');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create profile');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    StoridgeProfileService.profiles()
    .then(function success(data) {
      $scope.profiles = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve profiles');
    });
  }

  initView();
}]);
