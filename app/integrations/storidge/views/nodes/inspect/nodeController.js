angular.module('portainer.integrations.storidge')
.controller('StoridgeNodeController', ['$scope', '$state', '$transition$', 'Notifications', 'StoridgeNodeService', 'ModalService',
function ($scope, $state, $transition$, Notifications, StoridgeNodeService, ModalService) {

  $scope.removeNodeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to remove the node from the cluster?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        remove(selectedItems);
      }
    });
  };

  function remove() {
    StoridgeNodeService.remove($scope.node.Name)
    .then(function success() {
      Notifications.success('Node successfully removed', $scope.node.Name);
      $state.go('storidge.cluster');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove node');
    });
  }

  $scope.cordonNodeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to put the node in maintenance mode?',
      buttons: {
        confirm: {
          label: 'Enter maintenance',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        cordonNode(selectedItems);
      }
    });
  };

  function cordonNode() {
    StoridgeNodeService.cordon($scope.node.Name)
    .then(function success() {
      Notifications.success('Node successfully put in maintenance');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to put node in maintenance mode');
    })
    .finally(function final() {
      $state.reload();
    });
  }

  $scope.uncordonNodeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to bring the nodes out of maintenance mode?',
      buttons: {
        confirm: {
          label: 'Exit maintenance',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        uncordonNode(selectedItems);
      }
    });
  };

  function uncordonNode() {
    StoridgeNodeService.uncordon($scope.node.Name)
    .then(function success() {
      Notifications.success('Node successfully bringed back');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to put node out of maintenance mode');
    })
    .finally(function final() {
      $state.reload();
    });
  }

  function initView() {
    $scope.name = $transition$.params().name;

    StoridgeNodeService.node($scope.name)
    .then(function success(data) {
      $scope.node = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve node details');
    });
  }

  initView();

}]);
