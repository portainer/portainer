angular.module('services', [])
.controller('ServicesController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Messages',
function ($scope, $stateParams, $state, Service, ServiceHelper, Messages) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.scaleService = function scaleService(service) {
    $('#loadServicesSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully scaled", "New replica count: " + service.Replicas);
      $state.go('services', {}, {reload: true});
    }, function (e) {
      $('#loadServicesSpinner').hide();
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
      Messages.error("Failure", e, "Unable to scale service");
    });
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

  $scope.removeAction = function () {
    $('#loadServicesSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadServicesSpinner').hide();
      }
    };
    angular.forEach($scope.services, function (service) {
      if (service.Checked) {
        counter = counter + 1;
        Service.remove({id: service.Id}, function (d) {
          if (d.message) {
            $('#loadServicesSpinner').hide();
            Messages.error("Unable to remove service", {}, d[0].message);
          } else {
            Messages.send("Service deleted", service.Id);
            var index = $scope.services.indexOf(service);
            $scope.services.splice(index, 1);
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, 'Unable to remove service');
          complete();
        });
      }
    });
  };

  function fetchServices() {
    $('#loadServicesSpinner').show();
    Service.query({}, function (d) {
      $scope.services = d.map(function (service) {
        return new ServiceViewModel(service);
      });
      $('#loadServicesSpinner').hide();
    }, function(e) {
      $('#loadServicesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve services");
      $scope.services = [];
    });
  }

  fetchServices();
}]);
