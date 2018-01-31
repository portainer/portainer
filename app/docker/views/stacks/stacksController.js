angular.module('portainer.docker')
.controller('StacksController', ['$scope', '$state', 'Notifications', 'StackService', 'ModalService',
function ($scope, $state, Notifications, StackService, ModalService) {
  $scope.state = {
    displayInformationPanel: false,
    displayExternalStacks: true
  };

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
    var actionCount = stacks.length;
    angular.forEach(stacks, function (stack) {
      StackService.remove(stack)
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

  function initView() {
    StackService.stacks(true)
    .then(function success(data) {
      var stacks = data;
      for (var i = 0; i < stacks.length; i++) {
        var stack = stacks[i];
        if (stack.External) {
          $scope.state.displayInformationPanel = true;
          break;
        }
      }
      $scope.stacks = stacks;
    })
    .catch(function error(err) {
      $scope.stacks = [];
      Notifications.error('Failure', err, 'Unable to retrieve stacks');
    });
  }

  initView();
}]);
