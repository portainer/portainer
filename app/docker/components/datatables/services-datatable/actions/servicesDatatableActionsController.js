angular.module('portainer.docker')
.controller('ServicesDatatableActionsController', ['$state', 'ServiceService', 'ServiceHelper', 'Notifications', 'ModalService',
function ($state, ServiceService, ServiceHelper, Notifications, ModalService) {

  this.scaleAction = function scaleService(service) {
    var config = ServiceHelper.serviceToConfig(service.Model);
    config.Mode.Replicated.Replicas = service.Replicas;
    ServiceService.update(service, config)
    .then(function success(data) {
      Notifications.success('Service successfully scaled', 'New replica count: ' + service.Replicas);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to scale service');
      service.Scale = false;
      service.Replicas = service.ReplicaCount;
    });
  };

  this.updateAction = function(selectedItems) {
    ModalService.confirmServiceForceUpdate(
      'Do you want to force update of selected service(s)? All the tasks associated to the selected service(s) will be recreated.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        forceUpdateServices(selectedItems);
      }
    );
  };

  this.removeAction = function(selectedItems) {
    ModalService.confirmDeletion(
      'Do you want to remove the selected service(s)? All the containers associated to the selected service(s) will be removed too.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeServices(selectedItems);
      }
    );
  };

  function forceUpdateServices(services) {
    var actionCount = services.length;
    angular.forEach(services, function (service) {
      var config = ServiceHelper.serviceToConfig(service.Model);
      // As explained in https://github.com/docker/swarmkit/issues/2364 ForceUpdate can accept a random
      // value or an increment of the counter value to force an update.
      config.TaskTemplate.ForceUpdate++;
      ServiceService.update(service, config)
      .then(function success(data) {
        Notifications.success('Service successfully updated', service.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to force update service', service.Name);
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  function removeServices(services) {
    var actionCount = services.length;
    angular.forEach(services, function (service) {
      ServiceService.remove(service)
      .then(function success() {
        Notifications.success('Service successfully removed', service.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove service');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }
}]);
