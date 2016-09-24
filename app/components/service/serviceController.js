angular.module('service', [])
.controller('ServiceController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Task', 'Node', 'Messages',
function ($scope, $stateParams, $state, Service, ServiceHelper, Task, Node, Messages) {

  $scope.service = {};
  $scope.tasks = [];
  $scope.displayNode = false;
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.renameService = function renameService(service) {
    $('#loadServicesSpinner').show();
    var serviceName = service.Name;
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Name = service.newServiceName;
    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully renamed", "New name: " + service.newServiceName);
      $state.go('service', {id: service.Id}, {reload: true});
    }, function (e) {
      $('#loadServicesSpinner').hide();
      service.EditName = false;
      service.Name = serviceName;
      Messages.error("Failure", e, "Unable to rename service");
    });
  };

  $scope.scaleService = function scaleService(service) {
    $('#loadServicesSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully scaled", "New replica count: " + service.Replicas);
      $state.go('service', {id: service.Id}, {reload: true});
    }, function (e) {
      $('#loadServicesSpinner').hide();
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
      Messages.error("Failure", e, "Unable to scale service");
    });
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
      service.newServiceName = service.Name;
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
