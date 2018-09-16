angular.module('portainer.docker').controller('NodeDetailsViewController', [
  '$stateParams', 'NodeService', 'StateManager', 'AgentService',
  function NodeDetailsViewController($stateParams, NodeService, StateManager, AgentService) {
    var ctrl = this;

    ctrl.$onInit = initView;

    ctrl.state = {
      isAgent: false
    };

    function initView() {
      var applicationState = StateManager.getState();
      ctrl.state.isAgent = applicationState.endpoint.mode.agentProxy;

      var nodeId = $stateParams.id;
      NodeService.node(nodeId).then(function(node) {
        ctrl.originalNode = node;
        ctrl.hostDetails = buildHostDetails(node);
        ctrl.engineDetails = buildEngineDetails(node);
        ctrl.nodeDetails = buildNodeDetails(node);
        if (ctrl.state.isAgent) {
          AgentService.hostInfo(node.Hostname).then(function onHostInfoLoad(agentHostInfo) {
            enhanceHostDetails(ctrl.hostDetails, agentHostInfo);
          });
        }
      });

      
    }

    function enhanceHostDetails(hostDetails, agentHostInfo) {
      hostDetails.physicalDeviceInfo = agentHostInfo.PhysicalDeviceInfo;
      hostDetails.pciDevices = agentHostInfo.InstalledPCIDevices;
      hostDetails.physicalDisk = agentHostInfo.PhysicalDisk;
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
        volumePlugins: transformPlugins(node.Plugins, 'Volume'),
        networkPlugins: transformPlugins(node.Plugins, 'Network')
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

    

   

    function transformPlugins(pluginsList, type) {
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
