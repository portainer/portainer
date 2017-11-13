angular.module('services', [])
.controller('ServicesController', ['$q', '$scope', '$transition$', '$state', 'Service', 'ServiceService', 'ServiceHelper', 'Notifications', 'Pagination', 'Task', 'Node', 'NodeHelper', 'ModalService', 'ResourceControlService',
function ($q, $scope, $transition$, $state, Service, ServiceService, ServiceHelper, Notifications, Pagination, Task, Node, NodeHelper, ModalService, ResourceControlService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('services');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

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
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    Service.update({ id: service.Id, version: service.Version }, config, function (data) {
      Notifications.success('Service successfully scaled', 'New replica count: ' + service.Replicas);
      $state.reload();
    }, function (e) {
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
    angular.forEach($scope.services, function (service) {
      if (service.Checked) {
        ServiceService.remove(service)
        .then(function success(data) {
          Notifications.success('Service successfully deleted');
          var index = $scope.services.indexOf(service);
          $scope.services.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove service');
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
    $q.all({
      services: Service.query({}).$promise,
      tasks: Task.query({filters: {'desired-state': ['running','accepted']}}).$promise,
      nodes: Node.query({}).$promise
    })
    .then(function success(data) {
      $scope.swarmManagerIP = NodeHelper.getManagerIP(data.nodes);
      $scope.services = data.services.map(function (service) {
        var runningTasks = data.tasks.filter(function (task) {
          return task.ServiceID === service.ID && task.Status.State === 'running';
        });
        var allTasks = data.tasks.filter(function (task) {
          return task.ServiceID === service.ID;
        });
        var taskNodes = data.nodes.filter(function (node) {
          return node.Spec.Availability === 'active' && node.Status.State === 'ready';
        });
        return new ServiceViewModel(service, runningTasks, allTasks, taskNodes);
      });
    })
    .catch(function error(err) {
      $scope.services = [];
      Notifications.error('Failure', err, 'Unable to retrieve services');
    });
  }

  initView();
}]);
