angular.module('stack', [])
.controller('StackController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Task', 'Node', 'Notifications', 'Pagination',
function ($scope, $stateParams, $state, Service, ServiceHelper, Task, Node, Notifications, Pagination) {

  $scope.state = {};
  $scope.state.pagination_count_services = Pagination.getPaginationCount('stack_services');
  $scope.state.pagination_count_tasks = Pagination.getPaginationCount('stack_tasks');
  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortServicesType = 'Name';
  $scope.sortServicesReverse = false;
  $scope.sortTasksType = 'Status';
  $scope.sortTasksReverse = false;

  $scope.orderServices = function (sortServicesType) {
    $scope.sortServicesReverse = ($scope.sortServicesType === sortServicesType) ? !$scope.sortServicesReverse : false;
    $scope.sortServicesType = sortServicesType;
  };

  $scope.orderTasks = function (sortTasksType) {
    $scope.sortTasksReverse = ($scope.sortTasksType === sortTasksType) ? !$scope.sortTasksReverse : false;
    $scope.sortTasksType = sortTasksType;
  };

  $scope.changePaginationCountServices = function() {
    Pagination.setPaginationCount('stack_services', $scope.state.pagination_count_services);
  };

  $scope.changePaginationCountTasks = function() {
    Pagination.setPaginationCount('stack_tasks', $scope.state.pagination_count_tasks);
  };

  function fetchStackDetails() {
    $('#loadingViewSpinner').show();

    var label_filter = ["com.docker.stack.namespace=" + $stateParams.name];
    Service.query({filters: {label: label_filter}}, function (services) {
      $scope.stack = new StackViewModel({
        "Name": $stateParams.name,
        "Items": services.length,
        "Type": "SwarmMode"
      });

      /*$scope.services = services.map(function (service) {
        return new ServiceViewModel(service);
      });*/
      Task.query({filters: {label: label_filter}}, function (tasks) {
        $scope.services = services.map(function (service) {
          var serviceTasks = tasks.filter(function (task) {
            return task.ServiceID === service.ID && task.DesiredState === 'running';
          });
          return new ServiceViewModel(service, serviceTasks);
        });
        Node.query({}, function (nodes) {
          $scope.displayNode = true;
          $scope.tasks = tasks.map(function (task) {
            return new TaskViewModel(task, nodes);
          });
          $('#loadingViewSpinner').hide();
        }, function (e) {
          $('#loadingViewSpinner').hide();
          $scope.tasks = tasks.map(function (task) {
            return new TaskViewModel(task, null);
          });
        });
      }, function(e) {
        $('#loadingViewSpinner').hide();
        Notifications.error("Failure", e, "Unable to retrieve tasks associated to the stack");
      });
    }, function(e) {
      $('#loadingViewSpinner').hide();
      Notifications.error("Failure", e, "Unable to retrieve services associated to the stack");
    });


    $('#loadingViewSpinner').hide();
    
  }

  fetchStackDetails();
}]);
