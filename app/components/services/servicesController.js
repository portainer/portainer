angular.module('services', [])
.controller('ServicesController', ['$q', '$scope', '$stateParams', '$state', 'Service', 'ServiceHelper', 'Notifications', 'Pagination', 'Task', 'Node', 'NodeHelper', 'Authentication', 'UserService', 'ModalService', 'ResourceControlService',
function ($q, $scope, $stateParams, $state, Service, ServiceHelper, Notifications, Pagination, Task, Node, NodeHelper, Authentication, UserService, ModalService, ResourceControlService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('services');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  function removeServiceResourceControl(service) {
    volumeResourceControlQueries = [];
    angular.forEach(service.Mounts, function (mount) {
      if (mount.Type === 'volume') {
        volumeResourceControlQueries.push(ResourceControlService.removeVolumeResourceControl(service.Metadata.ResourceControl.OwnerId, mount.Source));
      }
    });

    $q.all(volumeResourceControlQueries)
    .then(function success() {
      return ResourceControlService.removeServiceResourceControl(service.Metadata.ResourceControl.OwnerId, service.Id);
    })
    .then(function success() {
      delete service.Metadata.ResourceControl;
      Notifications.success('Ownership changed to public', service.Id);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to change service ownership');
    });
  }

  $scope.switchOwnership = function(volume) {
    ModalService.confirmServiceOwnershipChange(function (confirmed) {
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
      Notifications.success('Service successfully scaled', 'New replica count: ' + service.Replicas);
      $state.reload();
    }, function (e) {
      $('#loadServicesSpinner').hide();
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
      Notifications.error('Failure', e, 'Unable to scale service');
    });
  };

  $scope.removeAction = function() {
    ModalService.confirmDeletion(
      'Do you want to remove the selected service(s)? All the containers associated to the selected service(s) will be removed too.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeServices();
      }
    );
  };

  function removeServices() {
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
            Notifications.error('Unable to remove service', {}, d[0].message);
          } else {
            if (service.Metadata && service.Metadata.ResourceControl) {
              ResourceControlService.removeServiceResourceControl(service.Metadata.ResourceControl.OwnerId, service.Id)
              .then(function success() {
                Notifications.success('Service deleted', service.Id);
                var index = $scope.services.indexOf(service);
                $scope.services.splice(index, 1);
              })
              .catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to remove service ownership');
              });
            } else {
              Notifications.success('Service deleted', service.Id);
              var index = $scope.services.indexOf(service);
              $scope.services.splice(index, 1);
            }
          }
          complete();
        }, function (e) {
          Notifications.error('Failure', e, 'Unable to remove service');
          complete();
        });
      }
    });
  }

  function mapUsersToServices(users) {
    angular.forEach($scope.services, function (service) {
      if (service.Metadata) {
        var serviceRC = service.Metadata.ResourceControl;
        if (serviceRC && serviceRC.OwnerId !== $scope.user.ID) {
          angular.forEach(users, function (user) {
            if (serviceRC.OwnerId === user.Id) {
              service.Owner = user.Username;
            }
          });
        }
      }
    });
  }

  function initView() {
    $('#loadServicesSpinner').show();

    var userDetails = Authentication.getUserDetails();
    $scope.user = userDetails;

    $q.all({
      services: Service.query({}).$promise,
      tasks: Task.query({filters: {'desired-state': ['running']}}).$promise,
      nodes: Node.query({}).$promise
    })
    .then(function success(data) {
      $scope.swarmManagerIP = NodeHelper.getManagerIP(data.nodes);
      $scope.services = data.services.map(function (service) {
        var serviceTasks = data.tasks.filter(function (task) {
          return task.ServiceID === service.ID && task.Status.State === 'running';
        });
        var taskNodes = data.nodes.filter(function (node) {
          return node.Spec.Availability === 'active' && node.Status.State === 'ready';
        });
        return new ServiceViewModel(service, serviceTasks, taskNodes);
      });
      if (userDetails.role === 1) {
        UserService.users(true)
        .then(function success(data) {
          mapUsersToServices(data);
        })
        .finally(function final() {
          $('#loadServicesSpinner').hide();
        });
      }
    })
    .catch(function error(err) {
      $scope.services = [];
      Notifications.error('Failure', err, 'Unable to retrieve services');
    })
    .finally(function final() {
      $('#loadServicesSpinner').hide();
    });
  }

  initView();
}]);
