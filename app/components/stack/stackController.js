angular.module('stack', [])
.controller('StackController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Task', 'Node', 'Messages', 'Pagination',
function ($scope, $stateParams, $state, Service, ServiceHelper, Task, Node, Messages, Pagination) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('service_tasks');
  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('service_tasks', $scope.state.pagination_count);
  };

  function fetchStackDetails() {
    $('#loadingViewSpinner').show();

    var label_filter = ["com.docker.stack.namespace=" + $stateParams.name];
    Service.query({filters: {label: label_filter}}, function (services) {
      $scope.stack = new StackViewModel({
        "Name": $stateParams.name,
        "Services": services.length
      });
      $scope.services = services.map(function (service) {
        return new ServiceViewModel(service);
      });
      Task.query({filters: {label: label_filter}}, function (tasks) {
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
        Messages.error("Failure", e, "Unable to retrieve tasks associated to the stack");
      });
    }, function(e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve services associated to the stack");
    });


    $('#loadingViewSpinner').hide();
    
  }

  fetchStackDetails();
}]);
