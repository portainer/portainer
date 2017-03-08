angular.module('services', [])
.controller('ServicesController', ['$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Messages', 'Pagination', 'Authentication', 'UserService', 'ModalService', 'ResourceControlService',
function ($scope, $stateParams, $state, Service, ServiceHelper, Messages, Pagination, Authentication, UserService, ModalService, ResourceControlService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('services');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  function removeServiceResourceControl(service) {
    ResourceControlService.removeServiceResourceControl(service.Metadata.ResourceControl.OwnerId, service.Id)
    .then(function success() {
      delete service.Metadata.ResourceControl;
      Messages.send('Ownership changed to public', service.Id);
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to change service ownership");
    });
  }

  $scope.switchOwnership = function(volume) {
    ModalService.confirmOwnershipChange(function (confirmed) {
      if(!confirmed) { return; }
      removeServiceResourceControl(volume);
    });
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('services', $scope.state.pagination_count);
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

  $scope.scaleService = function scaleService(service) {
    $('#loadServicesSpinner').show();
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      $('#loadServicesSpinner').hide();
      Messages.send("Service successfully scaled", "New replica count: " + service.Replicas);
      $state.reload();
    }, function (e) {
      $('#loadServicesSpinner').hide();
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
      Messages.error("Failure", e, "Unable to scale service");
    });
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
            if (service.Metadata && service.Metadata.ResourceControl) {
              ResourceControlService.removeServiceResourceControl(service.Metadata.ResourceControl.OwnerId, service.Id)
              .then(function success() {
                Messages.send("Service deleted", service.Id);
                var index = $scope.services.indexOf(service);
                $scope.services.splice(index, 1);
              })
              .catch(function error(err) {
                Messages.error("Failure", err, "Unable to remove service ownership");
              });
            } else {
              Messages.send("Service deleted", service.Id);
              var index = $scope.services.indexOf(service);
              $scope.services.splice(index, 1);
            }
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, 'Unable to remove service');
          complete();
        });
      }
    });
  };

  function mapUsersToServices(users) {
    angular.forEach($scope.services, function (service) {
      if (service.Metadata) {
        var serviceRC = service.Metadata.ResourceControl;
        if (serviceRC && serviceRC.OwnerId != $scope.user.ID) {
          angular.forEach(users, function (user) {
            if (serviceRC.OwnerId === user.Id) {
              service.Owner = user.Username;
            }
          });
        }
      }
    });
  }

  function fetchServices() {
    $('#loadServicesSpinner').show();
    var userDetails = Authentication.getUserDetails();
    $scope.user = userDetails;

    Service.query({}, function (d) {
      $scope.services = d.map(function (service) {
        return new ServiceViewModel(service);
      });
      if (userDetails.role === 1) {
        UserService.users()
        .then(function success(data) {
          mapUsersToServices(data);
        })
        .catch(function error(err) {
          Messages.error("Failure", err, "Unable to retrieve users");
        })
        .finally(function final() {
          $('#loadServicesSpinner').hide();
        });
      }
      $('#loadServicesSpinner').hide();
    }, function(e) {
      $('#loadServicesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve services");
      $scope.services = [];
    });
  }

  fetchServices();
}]);
