angular.module('portainer.docker').controller('NodeDetailsViewController', [
  '$stateParams',
  'NodeService',
  function NodeDetailsViewController($stateParams, NodeService) {
    var ctrl = this;

    ctrl.$onInit = initView;

    function initView() {
      NodeService.node($stateParams.id).then(function(node) {
        console.log(node)
        ctrl.hostDetails = buildHostDetails(node);
        ctrl.engineDetails = buildEngineDetails(node);
        ctrl.nodeDetails = buildNodeDetails(node);
      });
    }

    function buildHostDetails(node) {
      return {
        os: {
          arch: node.PlatformArchitecture,
          type: node.PlatformOS
          // name: node.OperatingSystem TODO
        },
        name: node.Hostname,
        // kernelVersion: node.KernelVersion,
        totalCPU: node.CPUs / 1e9,
        totalMemory: node.Memory
      };
    }

    function buildEngineDetails(node) {
      return {
        releaseVersion: node.EngineVersion,
        // apiVersion: versionDetails.ApiVersion, TODO
        // rootDirectory: node.DockerRootDir, TODO
        // storageDriver: node.Driver,
        // loggingDriver: node.LoggingDriver,
        volumePlugins: getPlugins(node.Plugins, 'Volume'),
        networkPlugins: getPlugins(node.Plugins, 'Network')
      };
    }

    function buildNodeDetails(node) {
      return {
        name: node.Name,
        role: node.Role,
        managerAddress: node.ManagerAddr,
        availability: node.Availability,
        status: node.Status,
        engineLabels: node.EngineLabels,
        nodeLabels: node.Labels
      };
    }

    function getPlugins(pluginsList, type) {
      return pluginsList
        .filter(function(plugin) {
          return plugin.Type === type;
        })
        .map(function(plugin) {
          return plugin.Name;
        });
    }
  }
]);
