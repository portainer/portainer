angular.module('stacks', [])
.controller('StacksController', ['$q', '$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Container', 'Messages', 'Pagination', 'Task', 'Node', 'Authentication', 'UserService', 'ModalService', 'ResourceControlService',
function ($q, $scope, $stateParams, $state, Service, ServiceHelper, Container, Messages, Pagination, Task, Node, Authentication, UserService, ModalService, ResourceControlService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('stacks');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.switchOwnership = function(volume) {
    ModalService.confirmServiceOwnershipChange(function (confirmed) {
      if(!confirmed) { return; }
      removeServiceResourceControl(volume);
    });
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('stacks', $scope.state.pagination_count);
  };

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  function fetchStacks() {
    $('#loadStacksSpinner').show();

    var userDetails = Authentication.getUserDetails();
    $scope.user = userDetails;

    var stacks = {};
    var composeStacks = {};

    $q.all({
      containers: Container.query({all: 1}).$promise,
      services: Service.query({}).$promise,
      tasks: Task.query({filters: {'desired-state': ['running']}}).$promise,
      nodes: Node.query({}).$promise,
    })
    .then(function success(data) {
      for (var k in data.services) {
        var service = data.services[k];
        if (!service.Spec || !service.Spec.Labels || !service.Spec.Labels["com.docker.stack.namespace"]) continue;
        var stackLabel = service.Spec.Labels["com.docker.stack.namespace"];

        if (stacks[stackLabel]) stacks[stackLabel]++;
        else stacks[stackLabel] = 1;
      }
      for (var k in data.containers) {
        var container = data.containers[k];
        if (!container.Labels || !container.Labels["com.docker.compose.project"]) continue;
        var stackLabel = container.Labels["com.docker.compose.project"];
        if (composeStacks[stackLabel]) composeStacks[stackLabel]++;
        else composeStacks[stackLabel] = 1;
      }
      var arr = [];
      for (var k in stacks) {
        arr.push(new StackViewModel({"Name": k, "Items": stacks[k], "Type": "SwarmMode"}));
      }
      for (var k in composeStacks) {
        arr.push(new StackViewModel({"Name": k, "Items": composeStacks[k], "Type": "Compose"}));
      }
      $scope.stacks = arr;

      $('#loadStacksSpinner').hide();
    })
    .catch(function error(err) {
      $scope.services = [];
      Messages.error("Failure", err, "Unable to retrieve services");
    })
    .finally(function final() {
      $('#loadStacksSpinner').hide();
    });
  }

  fetchStacks();
}]);
