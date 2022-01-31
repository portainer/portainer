import angular from 'angular';
import {
  killContainer,
  pauseContainer,
  removeContainer,
  renameContainer,
  restartContainer,
  resumeContainer,
  startContainer,
  stopContainer,
} from '@/docker/containers/containers.service';
import { ContainerDetailsViewModel, ContainerStatsViewModel, ContainerViewModel } from '../models/container';

angular.module('portainer.docker').factory('ContainerService', ContainerServiceFactory);

/* @ngInject */
function ContainerServiceFactory($q, Container, LogHelper, $timeout, EndpointProvider) {
  const service = {
    killContainer: withEndpointId(killContainer),
    pauseContainer: withEndpointId(pauseContainer),
    renameContainer: withEndpointId(renameContainer),
    restartContainer: withEndpointId(restartContainer),
    resumeContainer: withEndpointId(resumeContainer),
    startContainer: withEndpointId(startContainer),
    stopContainer: withEndpointId(stopContainer),
    remove: withEndpointId(removeContainer),
    updateRestartPolicy,
    updateLimits,
  };

  service.container = function (id) {
    var deferred = $q.defer();

    Container.get({ id: id })
      .$promise.then(function success(data) {
        var container = new ContainerDetailsViewModel(data);
        deferred.resolve(container);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve container information', err: err });
      });

    return deferred.promise;
  };

  service.containers = function (all, filters) {
    var deferred = $q.defer();
    Container.query({ all: all, filters: filters })
      .$promise.then(function success(data) {
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

  service.resizeTTY = function (id, width, height, timeout) {
    var deferred = $q.defer();

    $timeout(function () {
      Container.resize({}, { id: id, height: height, width: width })
        .$promise.then(function success(data) {
          if (data.message) {
            deferred.reject({ msg: 'Unable to resize tty of container ' + id, err: data.message });
          } else {
            deferred.resolve(data);
          }
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to resize tty of container ' + id, err: err });
        });
    }, timeout);

    return deferred.promise;
  };

  function updateRestartPolicy(id, restartPolicy, maximumRetryCounts) {
    return Container.update({ id: id }, { RestartPolicy: { Name: restartPolicy, MaximumRetryCount: maximumRetryCounts } }).$promise;
  }

  function updateLimits(id, config) {
    return Container.update(
      { id: id },
      {
        // MemorySwap: must be set
        // -1: non limits, 0: treated as unset(cause update error).
        MemoryReservation: config.HostConfig.MemoryReservation,
        Memory: config.HostConfig.Memory,
        MemorySwap: -1,
        NanoCpus: config.HostConfig.NanoCpus,
      }
    ).$promise;
  }

  service.createContainer = function (configuration) {
    var deferred = $q.defer();
    Container.create(configuration)
      .$promise.then(function success(data) {
        deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to create container', err: err });
      });
    return deferred.promise;
  };

  service.createAndStartContainer = function (configuration) {
    var deferred = $q.defer();
    var container;
    service
      .createContainer(configuration)
      .then(function success(data) {
        container = data;
        return service.startContainer(container.Id);
      })
      .then(function success() {
        deferred.resolve(container);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });
    return deferred.promise;
  };

  service.createExec = function (execConfig) {
    var deferred = $q.defer();

    Container.exec({}, execConfig)
      .$promise.then(function success(data) {
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

  service.logs = function (id, stdout, stderr, timestamps, since, tail, stripHeaders) {
    var deferred = $q.defer();

    var parameters = {
      id: id,
      stdout: stdout || 0,
      stderr: stderr || 0,
      timestamps: timestamps || 0,
      since: since || 0,
      tail: tail || 'all',
    };

    Container.logs(parameters)
      .$promise.then(function success(data) {
        var logs = LogHelper.formatLogs(data.logs, stripHeaders);
        deferred.resolve(logs);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  service.containerStats = function (id) {
    var deferred = $q.defer();

    Container.stats({ id: id })
      .$promise.then(function success(data) {
        var containerStats = new ContainerStatsViewModel(data);
        deferred.resolve(containerStats);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  service.containerTop = function (id) {
    return Container.top({ id: id }).$promise;
  };

  service.inspect = function (id) {
    return Container.inspect({ id: id }).$promise;
  };

  service.prune = function (filters) {
    return Container.prune({ filters: filters }).$promise;
  };

  return service;

  function withEndpointId(func) {
    return function (...args) {
      const endpointId = EndpointProvider.endpointID();

      return func(endpointId, ...args);
    };
  }
}
