angular.module('portainer.helpers')
.factory('StackHelper', [function StackHelperFactory() {
  'use strict';
  var helper = {};

  helper.getExternalStackNamesFromServices = function(services) {
    var stackNames = [];

    for (var i = 0; i < services.length; i++) {
      var service = services[i];
      if (!service.Labels || !service.Labels['com.docker.stack.namespace']) continue;

      var stackName = service.Labels['com.docker.stack.namespace'];
      stackNames.push(stackName);
    }

    return _.uniq(stackNames);
  };

  // function mapValuesToArray(stackMap) {
  //   var stacks = [];
  //   for (var key in stackMap) {
  //     if (stackMap.hasOwnProperty(key)) {
  //       stacks.push(stackMap[key]);
  //     }
  //   }
  //   return stacks;
  // }
  //
  // function mergeStack(stack, discoveredStack) {
  //   stack.ServiceCount = discoveredStack.ServiceCount;
  //   stack.Status = discoveredStack.Status;
  //   stack.Deployment = discoveredStack.Deployment;
  // }
  //
  // helper.mergeStacksAndDiscoveredStacks = function(stacks, discoveredStacks) {
  //   var remainingStacks = [];
  //
  //   for (var i = 0; i < discoveredStacks.length; i++) {
  //     var discoveredStack = discoveredStacks[i];
  //     var merge = false;
  //     for (var j = 0; j < stacks.length; j++) {
  //       var stack = stacks[j];
  //       if (stack.Name === discoveredStack.Name) {
  //         mergeStack(stack, discoveredStack);
  //         merge = true;
  //         break;
  //       }
  //     }
  //
  //     if (!merge) {
  //       remainingStacks.push(discoveredStack);
  //     }
  //   }
  //
  //   return remainingStacks;
  // };
  //
  // helper.getComposeV2StacksFromContainers = function(containers) {
  //   var stackMap = {};
  //
  //   for (var i = 0; i < containers.length; i++) {
  //     var container = containers[i];
  //     if (!container.Labels || !container.Labels['com.docker.compose.project']) continue;
  //
  //     var projectName = container.Labels['com.docker.compose.project'];
  //     if (!stackMap[projectName]) {
  //       stackMap[projectName] = new AnonymousStackViewModel({ Name: projectName, Deployment: 'host', ServiceCount: 1 });
  //     } else {
  //       stackMap[projectName].ServiceCount++;
  //     }
  //   }
  //
  //   return mapValuesToArray(stackMap);
  // };
  //
  // helper.getComposeV2ServicesFromContainers = function(containers) {
  //   var serviceMap = {};
  //
  //   for (var i = 0; i < containers.length; i++) {
  //     var container = containers[i];
  //     if (!container.Labels || !container.Labels['com.docker.compose.service']) continue;
  //
  //     var serviceName = container.Labels['com.docker.compose.service'];
  //     if (!serviceMap[serviceName]) {
  //       serviceMap[serviceName] = { Name: serviceName, 'ContainerCount': 1 };
  //     } else {
  //       serviceMap[serviceName].ContainerCount++;
  //     }
  //   }
  //
  //   return mapValuesToArray(serviceMap);
  // };

  return helper;
}]);
