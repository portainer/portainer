angular.module('portainer.docker')
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

  service.externalSwarmStacks = function() {
    var deferred = $q.defer();

    ServiceService.services()
    .then(function success(data) {
      var services = data;
      var stackNames = StackHelper.getExternalStackNamesFromServices(services);
      var stacks = stackNames.map(function (item) {
        return new StackViewModel({ Name: item, External: true });
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
      var stacks = stackNames.map(function (item) {
        return new StackViewModel({ Name: item, External: true });
      });
      deferred.resolve(stacks);

    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve external stacks', err: err });
    });

    return deferred.promise;
  };

  service.composeStacks = function(includeExternalStacks) {
    var deferred = $q.defer();

    $q.all({
      stacks: Stack.query().$promise,
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

      return $q.all({
        stacks: Stack.query({ swarmId: swarm.Id }).$promise,
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

  service.remove = function(stack) {
    var deferred = $q.defer();

    Stack.remove({ id: stack.Id }).$promise
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

  service.createStackFromFileContent = function(name, type, stackFileContent, env) {
    if (type === 1) {
      return createSwarmStackFromFileContent(name, stackFileContent, env);
    }
    return createComposeStackFromFileContent(name, stackFileContent, env);
  };

  service.createStackFromGitRepository = function(name, type, repositoryOptions, env) {
    if (type === 1) {
      return createSwarmStackFromGitRepository(name, repositoryOptions, env);
    }
    return createComposeStackFromGitRepository(name, repositoryOptions, env);
  };

  service.createStackFromFileUpload = function(name, type, stackFile, env) {
    if (type === 1) {
      return createSwarmStackFromFileUpload(name, stackFile, env);
    }
    return createComposeStackFromFileUpload(name, stackFile, env);
  };

  service.updateStack = function(id, stackFile, env, prune) {
    return Stack.update({ id: id, StackFileContent: stackFile, Env: env, Prune: prune}).$promise;
  };

  function createSwarmStackFromFileUpload(name, stackFile, env) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return FileUploadService.createSwarmStack(name, swarm.Id, stackFile, env);
    })
    .then(function success(data) {
      deferred.resolve(data.data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  }

  function createComposeStackFromGitRepository(name, repositoryOptions, env) {
    var payload = {
      Name: name,
      Type: 2,
      RepositoryURL: repositoryOptions.RepositoryURL,
      ComposeFilePathInRepository: repositoryOptions.ComposeFilePathInRepository,
      RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
      RepositoryUsername: repositoryOptions.RepositoryUsername,
      RepositoryPassword: repositoryOptions.RepositoryPassword,
      Env: env
    };
    return Stack.create({ method: 'repository' }, payload).$promise;
  }

  function createSwarmStackFromGitRepository(name, repositoryOptions, env) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var payload = {
        Name: name,
        Type: 1,
        SwarmID: swarm.Id,
        RepositoryURL: repositoryOptions.RepositoryURL,
        ComposeFilePathInRepository: repositoryOptions.ComposeFilePathInRepository,
        RepositoryAuthentication: repositoryOptions.RepositoryAuthentication,
        RepositoryUsername: repositoryOptions.RepositoryUsername,
        RepositoryPassword: repositoryOptions.RepositoryPassword,
        Env: env
      };
      return Stack.create({ method: 'repository' }, payload).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  }

  function createComposeStackFromFileUpload(name, stackFile, env) {
    return FileUploadService.createComposeStack(name, stackFile, env);
  }

  function createComposeStackFromFileContent(name, stackFileContent, env) {
    var payload = {
      Name: name,
      Type: 2,
      StackFileContent: stackFileContent,
      Env: env
    };
    return Stack.create({ method: 'string' }, payload).$promise;
  }

  function createSwarmStackFromFileContent(name, stackFileContent, env) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var payload = {
        Name: name,
        Type: 1,
        SwarmID: swarm.Id,
        StackFileContent: stackFileContent,
        Env: env
      };
      return Stack.create({ method: 'string' }, payload).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  }

  return service;
}]);
