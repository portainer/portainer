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
  recreateContainer,
} from '@/react/docker/containers/containers.service';
import { ContainerDetailsViewModel, ContainerStatsViewModel, ContainerViewModel } from '../models/container';
import { formatLogs } from '../helpers/logHelper';

angular.module('portainer.docker').factory('ContainerService', ContainerServiceFactory);

/* @ngInject */
function ContainerServiceFactory($q, Container, $timeout) {
  const service = {
    killContainer,
    pauseContainer,
    renameContainer,
    restartContainer,
    resumeContainer,
    startContainer,
    stopContainer,
    recreateContainer,
    remove: removeContainer,
    updateRestartPolicy,
    updateLimits,
  };

  service.container = function (environmentId, id) {
    var deferred = $q.defer();

    Container.get({ environmentId, id })
      .$promise.then(function success(data) {
        var container = new ContainerDetailsViewModel(data);
        deferred.resolve(container);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve container information', err: err });
      });

    return deferred.promise;
  };

  service.containers = function (environmentId, all, filters) {
    var deferred = $q.defer();
    Container.query({ environmentId, all, filters })
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

  service.resizeTTY = function (environmentId, id, width, height, timeout) {
    var deferred = $q.defer();

    $timeout(function () {
      Container.resize({}, { environmentId, id, width, height })
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

  function updateRestartPolicy(environmentId, id, restartPolicy, maximumRetryCounts) {
    return Container.update({ environmentId, id }, { RestartPolicy: { Name: restartPolicy, MaximumRetryCount: maximumRetryCounts } }).$promise;
  }

  function updateLimits(environmentId, id, config) {
    return Container.update(
      { environmentId, id },
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

  service.createContainer = function (environmentId, configuration) {
    var deferred = $q.defer();
    Container.create({ environmentId }, configuration)
      .$promise.then(function success(data) {
        deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to create container', err: err });
      });
    return deferred.promise;
  };

  service.createExec = function (environmentId, execConfig) {
    var deferred = $q.defer();

    Container.exec({ environmentId }, execConfig)
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

  service.logs = function (environmentId, id, stdout, stderr, timestamps, since, tail, stripHeaders) {
    var deferred = $q.defer();

    var parameters = {
      id: id,
      stdout: stdout || 0,
      stderr: stderr || 0,
      timestamps: timestamps || 0,
      since: since || 0,
      tail: tail || 'all',
      environmentId,
    };

    Container.logs(parameters)
      .$promise.then(function success(data) {
        var logs = formatLogs(data.logs, { stripHeaders, withTimestamps: !!timestamps });
        deferred.resolve(logs);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  service.containerStats = function (environmentId, id) {
    var deferred = $q.defer();

    Container.stats({ environmentId, id })
      .$promise.then(function success(data) {
        var containerStats = new ContainerStatsViewModel(data);
        deferred.resolve(containerStats);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  service.containerTop = function (environmentId, id) {
    return Container.top({ environmentId, id }).$promise;
  };

  service.inspect = function (environmentId, id) {
    return Container.inspect({ environmentId, id }).$promise;
  };

  service.prune = function (environmentId, filters) {
    return Container.prune({ environmentId, filters }).$promise;
  };

  return service;
}
