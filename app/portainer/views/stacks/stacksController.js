import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';

angular.module('portainer.app').controller('StacksController', StacksController);

/* @ngInject */
function StacksController($scope, $state, Notifications, StackService, ModalService, Authentication, endpoint) {
  $scope.removeAction = function (selectedItems) {
    ModalService.confirmDeletion('Do you want to remove the selected stack(s)? Associated services will be removed as well.', function onConfirm(confirmed) {
      if (!confirmed) {
        return;
      }
      deleteSelectedStacks(selectedItems);
    });
  };

  function deleteSelectedStacks(stacks) {
    const endpointId = endpoint.Id;
    let actionCount = stacks.length;
    angular.forEach(stacks, function (stack) {
      StackService.remove(stack, stack.External, endpointId)
        .then(function success() {
          Notifications.success('Stack successfully removed', stack.Name);
          var index = $scope.stacks.indexOf(stack);
          $scope.stacks.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove stack ' + stack.Name);
        })
        .finally(function final() {
          --actionCount;
          if (actionCount === 0) {
            $state.reload();
          }
        });
    });
  }

  $scope.offlineMode = false;
  $scope.createEnabled = false;

  $scope.getStacks = getStacks;

  function getStacks() {
    const endpointMode = $scope.applicationState.endpoint.mode;
    const endpointId = endpoint.Id;

    const includeOrphanedStacks = Authentication.isAdmin();
    StackService.stacks(true, endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER', endpointId, includeOrphanedStacks)
      .then(function success(stacks) {
        $scope.stacks = stacks;
        $scope.offlineMode = isOfflineEndpoint(endpoint);
      })
      .catch(function error(err) {
        $scope.stacks = [];
        Notifications.error('Failure', err, 'Unable to retrieve stacks');
      });
  }

  async function loadCreateEnabled() {
    return endpoint.SecuritySettings.allowStackManagementForRegularUsers || Authentication.isAdmin();
  }

  async function initView() {
    getStacks();
    $scope.createEnabled = await loadCreateEnabled();
  }

  initView();
}
