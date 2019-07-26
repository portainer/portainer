angular.module('portainer.app')
.controller('StacksController', ['$scope', '$state', 'Notifications', 'StackService', 'ModalService', 'EndpointProvider',
function ($scope, $state, Notifications, StackService, ModalService, EndpointProvider) {
  $scope.removeAction = function(selectedItems) {
    ModalService.confirmDeletion(
      'Do you want to remove the selected stack(s)? Associated services will be removed as well.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedStacks(selectedItems);
      }
    );
  };

  function deleteSelectedStacks(stacks) {
    var endpointId = EndpointProvider.endpointID();
    var actionCount = stacks.length;
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

  $scope.getStacks = getStacks;
  function getStacks() {
    var endpointMode = $scope.applicationState.endpoint.mode;
    var endpointId = EndpointProvider.endpointID();

    StackService.stacks(
      true,
      endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER',
      endpointId
    )
    .then(function success(data) {
      var stacks = data;
      $scope.stacks = stacks;
      $scope.offlineMode = EndpointProvider.offlineMode();
    })
    .catch(function error(err) {
      $scope.stacks = [];
      Notifications.error('Failure', err, 'Unable to retrieve stacks');
    });
  }

  function initView() {
    getStacks();
  }

  initView();
}]);
