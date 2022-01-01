import { FeatureId } from '@/portainer/feature-flags/enums';

angular.module('portainer.app').controller('GroupAccessController', [
  '$scope',
  '$state',
  '$transition$',
  'GroupService',
  'Notifications',
  function ($scope, $state, $transition$, GroupService, Notifications) {
    $scope.limitedFeature = FeatureId.RBAC_ROLES;

    $scope.updateAccess = function () {
      $scope.state.actionInProgress = true;
      GroupService.updateGroup($scope.group, $scope.group.AssociatedEndpoints)
        .then(() => {
          Notifications.success('Access successfully updated');
          $state.reload();
        })
        .catch((err) => {
          $scope.state.actionInProgress = false;
          Notifications.error('Failure', err, 'Unable to update accesses');
        });
    };

    function initView() {
      var groupId = $transition$.params().id;

      $scope.state = { actionInProgress: false };
      GroupService.group(groupId)
        .then(function success(data) {
          $scope.group = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load view');
        });
    }

    initView();
  },
]);
