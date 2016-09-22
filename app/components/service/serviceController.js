angular.module('service', [])
.controller('ServiceController', ['$scope', '$stateParams', '$state', 'Service', 'Task', 'Node', 'Messages',
function ($scope, $stateParams, $state, Service, Task, Node, Messages) {

  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.removeService = function removeService() {
    $('#loadingViewSpinner').show();
    Service.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Messages.send("Service removed", $stateParams.id);
        $state.go('services', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to remove service");
    });
  };

  function fetchServiceDetails() {
    $('#loadingViewSpinner').show();
    Service.get({id: $stateParams.id}, function (d) {
      var service = new ServiceViewModel(d);
      $scope.service = service;
      Task.query({filters: {service: [service.Name]}}, function (tasks) {
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
          Messages.error("Failure", e, "Unable to retrieve node information");
        });
      }, function (e) {
        $('#loadingViewSpinner').hide();
        Messages.error("Failure", e, "Unable to retrieve tasks associated to the service");
      });
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve service details");
    });
  }

  fetchServiceDetails();
}]);
