angular.module('stacks', [])
.controller('StacksController', ['$scope', 'Notifications', 'Pagination', 'StackService', 'ModalService',
function ($scope, Notifications, Pagination, StackService, ModalService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('stacks');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;
  $scope.state.DisplayInformationPanel = false;
  $scope.state.DisplayExternalStacks = true;

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('stacks', $scope.state.pagination_count);
  };

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredStacks, function (stack) {
      if (stack.Id && stack.Checked !== allSelected) {
        stack.Checked = allSelected;
        $scope.selectItem(stack);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to remove the selected stack(s)? Associated services will be removed as well.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedStacks();
      }
    );
  };

  function deleteSelectedStacks() {
    angular.forEach($scope.stacks, function (stack) {
      if (stack.Checked) {
        StackService.remove(stack)
        .then(function success() {
          Notifications.success('Stack deleted', stack.Name);
          var index = $scope.stacks.indexOf(stack);
          $scope.stacks.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove stack ' + stack.Name);
        });
      }
    });
  }

  function initView() {
    StackService.stacks(true)
    .then(function success(data) {
      var stacks = data;
      for (var i = 0; i < stacks.length; i++) {
        var stack = stacks[i];
        if (stack.External) {
          $scope.state.DisplayInformationPanel = true;
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
