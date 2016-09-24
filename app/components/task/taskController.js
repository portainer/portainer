angular.module('task', [])
.controller('TaskController', ['$scope', '$stateParams', '$state', 'Task', 'Service', 'Messages',
function ($scope, $stateParams, $state, Task, Service, Messages) {

  $scope.task = {};
  $scope.serviceName = 'service';
  $scope.isTaskRunning = false;

  function fetchTaskDetails() {
    $('#loadingViewSpinner').show();
    Task.get({id: $stateParams.id}, function (d) {
      $scope.task = d;
      fetchAssociatedServiceDetails(d.ServiceID);
      $('#loadingViewSpinner').hide();
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve task details");
    });
  }

  function fetchAssociatedServiceDetails(serviceId) {
    Service.get({id: serviceId}, function (d) {
      $scope.serviceName = d.Spec.Name;
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve associated service details");
    });
  }

  fetchTaskDetails();
}]);
