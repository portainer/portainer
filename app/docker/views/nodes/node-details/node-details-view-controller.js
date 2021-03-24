angular.module('portainer.docker').controller('NodeDetailsViewController', [
  '$q',
  '$stateParams',
  'NodeService',
  'StateManager',
  'AgentService',
  'ContainerService',
  'Authentication',
  function NodeDetailsViewController($q, $stateParams, NodeService, StateManager, AgentService, ContainerService, Authentication) {
    var ctrl = this;

    ctrl.$onInit = initView;

    ctrl.state = {
      isAgent: false,
      isAdmin: false,
    };

    function initView() {
      var applicationState = StateManager.getState();
      ctrl.state.isAgent = applicationState.endpoint.mode.agentProxy;
      ctrl.state.isAdmin = Authentication.isAdmin();
      ctrl.state.enableHostManagementFeatures = ctrl.endpoint.SecuritySettings.enableHostManagementFeatures;

      var fetchJobs = ctrl.state.isAdmin && ctrl.state.isAgent;

      var nodeId = $stateParams.id;
      $q.all({
        node: NodeService.node(nodeId),
        jobs: fetchJobs ? ContainerService.containers(true, { label: ['io.portainer.job.endpoint'] }) : [],
      }).then(function (data) {
        var node = data.node;
        ctrl.originalNode = node;
        ctrl.hostDetails = buildHostDetails(node);
        ctrl.engineDetails = buildEngineDetails(node);
        ctrl.nodeDetails = buildNodeDetails(node);
        ctrl.jobs = data.jobs;
        if (ctrl.state.isAgent) {
          var agentApiVersion = applicationState.endpoint.agentApiVersion;
          ctrl.state.agentApiVersion = agentApiVersion;
          if (agentApiVersion < 2) {
            return;
          }

          AgentService.hostInfo(node.Hostname).then(function onHostInfoLoad(agentHostInfo) {
            ctrl.devices = agentHostInfo.PCIDevices;
            ctrl.disks = agentHostInfo.PhysicalDisks;
          });
        }
      });
    }

    function buildHostDetails(node) {
      return {
        os: {
          arch: node.PlatformArchitecture,
          type: node.PlatformOS,
        },
        name: node.Hostname,
        totalCPU: node.CPUs / 1e9,
        totalMemory: node.Memory,
      };
    }

    function buildEngineDetails(node) {
      return {
        releaseVersion: node.EngineVersion,
        volumePlugins: transformPlugins(node.Plugins, 'Volume'),
        networkPlugins: transformPlugins(node.Plugins, 'Network'),
        engineLabels: node.EngineLabels,
      };
    }

    function buildNodeDetails(node) {
      return {
        name: node.Name,
        role: node.Role,
        managerAddress: node.ManagerAddr,
        availability: node.Availability,
        status: node.Status,
        nodeLabels: node.Labels,
      };
    }

    function transformPlugins(pluginsList, type) {
      return pluginsList
        .filter(function (plugin) {
          return plugin.Type === type;
        })
        .map(function (plugin) {
          return plugin.Name;
        });
    }
  },
]);
