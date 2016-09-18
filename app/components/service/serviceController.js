angular.module('service', [])
.controller('ServiceController', ['$scope', '$stateParams', '$state', 'Service', 'Task', 'Node', 'Messages',
function ($scope, $stateParams, $state, Service, Task, Node, Messages) {

  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;

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
      $scope.service = new ServiceViewModel(d);
      $('#loadingViewSpinner').hide();
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve service details");
    });

    Task.query({}, function (d) {
      var tasks = d.filter(function (task) {
        if (task.ServiceID === $stateParams.id) {
          return task;
        }
      });
      Node.query({}, function (nodes) {
        $scope.displayNode = true;
        $scope.tasks = tasks.map(function (task) {
          return new TaskViewModel(task, nodes);
        });
      }, function (e) {
        $scope.tasks = tasks.map(function (task) {
          return new TaskViewModel(task, null);
        });
        Messages.error("Failure", e, "Unable to retrieve node information");
      });
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve tasks associated to the service");
    });
  }

  fetchServiceDetails();
}]);
