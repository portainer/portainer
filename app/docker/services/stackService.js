angular.module('portainer.docker')
.factory('StackService', ['$q', 'Stack', 'ResourceControlService', 'FileUploadService', 'StackHelper', 'ServiceService', 'SwarmService',
function StackServiceFactory($q, Stack, ResourceControlService, FileUploadService, StackHelper, ServiceService, SwarmService) {
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

  service.externalStacks = function() {
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

  service.stacks = function(includeExternalStacks) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;

      return $q.all({
        stacks: Stack.query({ swarmId: swarm.Id }).$promise,
        externalStacks: includeExternalStacks ? service.externalStacks() : []
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

  service.createStackFromFileContent = function(name, stackFileContent, env) {
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
      return Stack.create({ method: 'string' }, payload).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.createStackFromGitRepository = function(name, gitRepository, pathInRepository, env) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      var payload = {
        Name: name,
        SwarmID: swarm.Id,
        GitRepository: gitRepository,
        PathInRepository: pathInRepository,
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
  };

  service.createStackFromFileUpload = function(name, stackFile, env) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return FileUploadService.createStack(name, swarm.Id, stackFile, env);
    })
    .then(function success(data) {
      deferred.resolve(data.data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.updateStack = function(id, stackFile, env, prune) {
    return Stack.update({ id: id, StackFileContent: stackFile, Env: env, Prune: prune}).$promise;
  };

  return service;
}]);
