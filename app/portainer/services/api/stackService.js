angular.module('portainer.app')
.factory('StackService', ['$q', 'Stack', 'ResourceControlService', 'FileUploadService', 'StackHelper', 'ServiceService', 'ContainerService', 'SwarmService',
function StackServiceFactory($q, Stack, ResourceControlService, FileUploadService, StackHelper, ServiceService, ContainerService, SwarmService) {
  'use strict';
  var service = {};

  service.stack = function(id) {
    var deferred = $q.defer();

    Stack.get({ id: id }).$promise
    .then(function success(data) {
      var stack = new StackViewModel(data);
      deferred.resolve(stack);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stack details', err: err });
    });

    return deferred.promise;
  };

  service.getStackFile = function(id) {
    var deferred = $q.defer();

    Stack.getStackFile({ id: id }).$promise
    .then(function success(data) {
      deferred.resolve(data.StackFileContent);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stack content', err: err });
    });

    return deferred.promise;
  };

  service.stacks = function(compose, swarm, endpointId) {
    var deferred = $q.defer();

    var queries = [];
    if (compose) {
      queries.push(service.composeStacks(true, { EndpointID: endpointId }));
    }
    if (swarm) {
      queries.push(service.swarmStacks(true));
    }

    $q.all(queries)
    .then(function success(data) {
      var stacks = [];
      if (data[0]) {
        stacks = stacks.concat(data[0]);
      }
      if (data[1]) {
        stacks = stacks.concat(data[1]);
      }
      deferred.resolve(stacks);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stacks', err: err });
    });

    return deferred.promise;
  };

  service.externalSwarmStacks = function() {
    var deferred = $q.defer();

    ServiceService.services()
    .then(function success(data) {
      var services = data;
      var stackNames = StackHelper.getExternalStackNamesFromServices(services);
      var stacks = stackNames.map(function (name) {
        return new ExternalStackViewModel(name, 1);
      });
      deferred.resolve(stacks);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve external stacks', err: err });
    });

    return deferred.promise;
  };

  service.externalComposeStacks = function() {
    var deferred = $q.defer();

    ContainerService.containers(1)
    .then(function success(data) {
      var containers = data;
      var stackNames = StackHelper.getExternalStackNamesFromContainers(containers);
      var stacks = stackNames.map(function (name) {
        return new ExternalStackViewModel(name, 2);
      });
      deferred.resolve(stacks);

    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve external stacks', err: err });
    });

    return deferred.promise;
  };

  service.composeStacks = function(includeExternalStacks, filters) {
    var deferred = $q.defer();

    $q.all({
      stacks: Stack.query({filters: filters}).$promise,
      externalStacks: includeExternalStacks ? service.externalComposeStacks() : []
    })
    .then(function success(data) {
      var stacks = data.stacks.map(function (item) {
        item.External = false;
        return new StackViewModel(item);
      });
      var externalStacks = data.externalStacks;

      var result = _.unionWith(stacks, externalStacks, function(a, b) { return a.Name === b.Name; });
      deferred.resolve(result);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stacks', err: err });
    });

    return deferred.promise;
  };

  service.swarmStacks = function(includeExternalStacks) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var filters = { SwarmID: swarm.Id };

      return $q.all({
        stacks: Stack.query({ filters: filters }).$promise,
        externalStacks: includeExternalStacks ? service.externalSwarmStacks() : []
      });
    })
    .then(function success(data) {
      var stacks = data.stacks.map(function (item) {
        item.External = false;
        return new StackViewModel(item);
      });
      var externalStacks = data.externalStacks;

      var result = _.unionWith(stacks, externalStacks, function(a, b) { return a.Name === b.Name; });
      deferred.resolve(result);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve stacks', err: err });
    });

    return deferred.promise;
  };

  service.remove = function(stack, external, endpointId) {
    var deferred = $q.defer();

    Stack.remove({ id: stack.Id ? stack.Id : stack.Name, external: external, endpointId: endpointId }).$promise
    .then(function success(data) {
      if (stack.ResourceControl && stack.ResourceControl.Id) {
        return ResourceControlService.deleteResourceControl(stack.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove the stack', err: err });
    });

    return deferred.promise;
  };

  service.updateStack = function(id, stackFile, env, prune) {
    return Stack.update({ id: id, StackFileContent: stackFile, Env: env, Prune: prune}).$promise;
  };

  service.createComposeStackFromFileUpload = function(name, stackFile, endpointId) {
    return FileUploadService.createComposeStack(name, stackFile, endpointId);
  };

  service.createSwarmStackFromFileUpload = function(name, stackFile, env, endpointId) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return FileUploadService.createSwarmStack(name, swarm.Id, stackFile, env, endpointId);
    })
    .then(function success(data) {
      deferred.resolve(data.data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.createComposeStackFromFileContent = function(name, stackFileContent, endpointId) {
    var payload = {
      Name: name,
      StackFileContent: stackFileContent
    };
    return Stack.create({ method: 'string', type: 2, endpointId: endpointId }, payload).$promise;
  };

  service.createSwarmStackFromFileContent = function(name, stackFileContent, env, endpointId) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var payload = {
        Name: name,
        SwarmID: swarm.Id,
        StackFileContent: stackFileContent,
        Env: env
      };
      return Stack.create({ method: 'string', type: 1, endpointId: endpointId }, payload).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.createComposeStackFromGitRepository = function(name, repositoryOptions, endpointId) {
    var payload = {
      Name: name,
      RepositoryURL: repositoryOptions.RepositoryURL,
      ComposeFilePathInRepository: repositoryOptions.ComposeFilePathInRepository,
      RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
      RepositoryUsername: repositoryOptions.RepositoryUsername,
      RepositoryPassword: repositoryOptions.RepositoryPassword
    };
    return Stack.create({ method: 'repository', type: 2, endpointId: endpointId }, payload).$promise;
  };

  service.createSwarmStackFromGitRepository = function(name, repositoryOptions, env, endpointId) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var payload = {
        Name: name,
        SwarmID: swarm.Id,
        RepositoryURL: repositoryOptions.RepositoryURL,
        ComposeFilePathInRepository: repositoryOptions.ComposeFilePathInRepository,
        RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
        RepositoryUsername: repositoryOptions.RepositoryUsername,
        RepositoryPassword: repositoryOptions.RepositoryPassword,
        Env: env
      };
      return Stack.create({ method: 'repository', type: 1, endpointId: endpointId }, payload).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
