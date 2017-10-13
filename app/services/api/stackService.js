angular.module('portainer.services')
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

  service.createStackFromFileContent = function(name, stackFileContent) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return Stack.create({ method: 'string' }, { Name: name, SwarmID: swarm.Id, StackFileContent: stackFileContent }).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.createStackFromGitRepository = function(name, gitRepository, pathInRepository) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return Stack.create({ method: 'repository' }, { Name: name, SwarmID: swarm.Id, GitRepository: gitRepository, PathInRepository: pathInRepository }).$promise;
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.createStackFromFileUpload = function(name, stackFile) {
    var deferred = $q.defer();

    SwarmService.swarm()
    .then(function success(data) {
      var swarm = data;
      return FileUploadService.createStack(name, swarm.Id, stackFile);
    })
    .then(function success(data) {
      deferred.resolve(data.data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create the stack', err: err });
    });

    return deferred.promise;
  };

  service.updateStack = function(id, stackFile) {
    return Stack.update({ id: id, StackFileContent: stackFile }).$promise;
  };

  //
  // service.stackV3 = function(name) {
  //   var deferred = $q.defer();
  //
  //   var filters = {
  //     label: ['com.docker.stack.namespace=' + name]
  //   };
  //
  //   $q.all({
  //     services: ServiceService.services(filters)
  //   })
  //   .then(function success(data) {
  //     var services = data.services;
  //     var stack = new StackV3ViewModel(name, services);
  //     deferred.resolve(stack);
  //   })
  //   .catch(function error(err) {
  //     deferred.reject({ msg: 'Unable to retrieve stack details', err: err });
  //   });
  //
  //   return deferred.promise;
  // };

  // service.retrieveStacksAndAnonymousStacks = function(includeServices) {
  //   var deferred = $q.defer();
  //
  //   $q.all({
  //     stacks: service.stacks(),
  //     discoveredStacks: service.discoverStacks(includeServices)
  //   })
  //   .then(function success(data) {
  //     var stacks = data.stacks;
  //     var discoveredStacks = data.discoveredStacks;
  //     var anonymousStacks = StackHelper.mergeStacksAndDiscoveredStacks(stacks, discoveredStacks);
  //     deferred.resolve({ stacks: stacks, anonymousStacks: anonymousStacks });
  //   })
  //   .catch(function error(err) {
  //     deferred.reject({ msg: 'Unable to retrieve stacks', err: err });
  //   });
  //
  //   return deferred.promise;
  // };

  // service.discoverStacks = function(includeServices) {
  //   var deferred = $q.defer();
  //
  //   $q.all({
  //     containers: ContainerService.containers(1),
  //     services: includeServices ? ServiceService.services() : []
  //   })
  //   .then(function success(data) {
  //     var containers = data.containers;
  //     var composeV2Stacks = StackHelper.getComposeV2StacksFromContainers(containers);
  //     var services = data.services;
  //     var composeV3Stacks = StackHelper.getComposeV3StacksFromServices(services);
  //
  //     var stacks = composeV2Stacks.concat(composeV3Stacks);
  //     deferred.resolve(stacks);
  //   })
  //   .catch(function error(err) {
  //     deferred.reject({ msg: 'Stack discovery failure', err: err });
  //   });
  //
  //   return deferred.promise;
  // };

  // service.getStackV2ServicesAndContainers = function(name) {
  //   var deferred = $q.defer();
  //
  //   var filters = {
  //     label: ['com.docker.compose.project=' + name]
  //   };
  //
  //   ContainerService.containers(1, filters)
  //   .then(function success(data) {
  //     var containers = data;
  //     var services = StackHelper.getComposeV2ServicesFromContainers(containers);
  //     deferred.resolve({services: services, containers: containers});
  //   })
  //   .catch(function error(err) {
  //     deferred.reject({ msg: 'Unable to retrieve stack details', err: err });
  //   });
  //
  //   return deferred.promise;
  // };

  // service.stackV2 = function(name) {
  //   var deferred = $q.defer();
  //
  //   var filters = {
  //     label: ['com.docker.compose.project=' + name]
  //   };
  //
  //   ContainerService.containers(1, filters)
  //   .then(function success(data) {
  //     var containers = data;
  //     var services = StackHelper.getComposeV2ServicesFromContainers(containers);
  //     var stack = new StackV2ViewModel(name, services, containers);
  //     deferred.resolve(stack);
  //   })
  //   .catch(function error(err) {
  //     deferred.reject({ msg: 'Unable to retrieve stack details', err: err });
  //   });

    // return deferred.promise;
  // };

  return service;
}]);
