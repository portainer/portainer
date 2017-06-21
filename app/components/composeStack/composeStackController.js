angular.module('composeStack', [])
.controller('ComposeStackController', ['$scope', '$filter', '$stateParams', '$state', 'Container', 'ServiceHelper', 'Task', 'Node', 'Notifications', 'Pagination',
function ($scope, $filter, $stateParams, $state, Container, ServiceHelper, Task, Node, Notifications, Pagination) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('composeStack');
  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('composeStack', $scope.state.pagination_count);
  };

  function fetchComposeStackDetails() {
    $('#loadingViewSpinner').show();

    var label_filter = ['com.docker.compose.project=' + $stateParams.name];
    Container.query({all: 1, filters: {label: label_filter}}, function (containers) {
      $scope.stack = new StackViewModel({
        'Name': $stateParams.name,
        'Items': containers.length,
        'Type': 'Compose'
      });
		
      $scope.containers = containers.map(function (container) {
        var model = new ContainerViewModel(container);
        model.Status = $filter('containerstatus')(model.Status);

        if (model.IP) {
          $scope.state.displayIP = true;
        }
        if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
          model.hostIP = $scope.swarm_hosts[_.split(container.Names[0], '/')[1]];
        }
        return model;
      });

      $('#loadingViewSpinner').hide();

    }, function(e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Unable to retrieve containers associated to the stack');
    });
  }

  fetchComposeStackDetails();
}]);
