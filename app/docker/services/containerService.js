angular.module('portainer.docker')
.factory('ContainerService', ['$q', 'Container', 'ResourceControlService', function ContainerServiceFactory($q, Container, ResourceControlService) {
  'use strict';
  var service = {};

  service.container = function(id, nodeName) {
    var deferred = $q.defer();

    Container.get({ id: id, nodeName: nodeName }).$promise
    .then(function success(data) {
      var container = new ContainerDetailsViewModel(data);
      deferred.resolve(container);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve container information', err: err });
    });

    return deferred.promise;
  };

  service.containers = function(all, filters) {
    var deferred = $q.defer();
    Container.query({ all : all, filters: filters }).$promise
    .then(function success(data) {
      var containers = data.map(function (item) {
        return new ContainerViewModel(item);
      });
      deferred.resolve(containers);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve containers', err: err });
    });

    return deferred.promise;
  };

  service.createContainer = function(configuration) {
    var deferred = $q.defer();
    Container.create(configuration).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create container', err: err });
    });
    return deferred.promise;
  };

  service.startContainer = function(id, nodeName) {
    return Container.start({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.stopContainer = function(id, nodeName) {
    return Container.stop({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.restartContainer = function(id, nodeName) {
    return Container.restart({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.killContainer = function(id, nodeName) {
    return Container.kill({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.pauseContainer = function(id, nodeName) {
    return Container.pause({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.resumeContainer = function(id, nodeName) {
    return Container.unpause({ id: id, nodeName: nodeName }, {}).$promise;
  };

  service.createAndStartContainer = function(configuration) {
    var deferred = $q.defer();
    var containerID;
    service.createContainer(configuration)
    .then(function success(data) {
      containerID = data.Id;
      return service.startContainer(containerID);
    })
    .then(function success() {
      deferred.resolve({ Id: containerID });
    })
    .catch(function error(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  service.remove = function(container, removeVolumes) {
    var deferred = $q.defer();

    Container.remove({id: container.Id, v: (removeVolumes) ? 1 : 0, force: true, nodeName: container.NodeName}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      }
      if (container.ResourceControl && container.ResourceControl.Type === 1) {
        return ResourceControlService.deleteResourceControl(container.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove container', err: err });
    });

    return deferred.promise;
  };

  service.createExec = function(execConfig, nodeName) {
    var deferred = $q.defer();

    Container.exec({ nodeName: nodeName }, execConfig).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.containerStats = function(id, nodeName) {
    var deferred = $q.defer();

    Container.stats({ id: id, nodeName: nodeName }).$promise
    .then(function success(data) {
      var containerStats = new ContainerStatsViewModel(data);
      deferred.resolve(containerStats);
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.containerTop = function(id, nodeName) {
    return Container.top({ id: id, nodeName: nodeName }).$promise;
  };

  service.inspect = function(id, nodeName) {
    return Container.inspect({ id: id, nodeName: nodeName }).$promise;
  };

  return service;
}]);
