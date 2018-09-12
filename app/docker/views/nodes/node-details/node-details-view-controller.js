angular.module('portainer.docker').controller('NodeDetailsViewController', [
  '$stateParams', 'NodeService',  'LabelHelper', 'Notifications', '$state', 'StateManager',
  function NodeDetailsViewController($stateParams, NodeService, LabelHelper, Notifications, $state, StateManager) {
    var ctrl = this;
    var originalNode;
    
    ctrl.$onInit = initView;
    ctrl.updateLabels = updateLabels;
    ctrl.updateAvailability = updateAvailability;

    ctrl.state = {
      isAgent: false
    };

    function initView() {
      NodeService.node($stateParams.id).then(function(node) {
        originalNode = node;
        ctrl.hostDetails = buildHostDetails(node);
        ctrl.engineDetails = buildEngineDetails(node);
        ctrl.nodeDetails = buildNodeDetails(node);
      });

      var applicationState = StateManager.getState();
      ctrl.state.isAgent = applicationState.endpoint.mode.agentProxy;
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

    function updateLabels(labels) {
      originalNode.Labels = labels;
      updateNode(originalNode);
    }

    function updateAvailability(availability) {
      originalNode.Availability = availability;
      updateNode(originalNode);
    }

    function updateNode(node) {
      var config = {
        Name: node.Name,
        Availability: node.Availability,
        Role: node.Role,
        Labels: LabelHelper.fromKeyValueToLabelHash(node.Labels),
        Id: node.Id,
        Version: node.Version
      };
      
      NodeService.updateNode(config)
        .then(onUpdateSuccess)
        .catch(notifyOnError);

      function onUpdateSuccess() {
        Notifications.success('Node successfully updated', 'Node updated');
        $state.go('docker.nodes.node', { id: node.Id }, { reload: true });
      }

      function notifyOnError(error) {
        Notifications.error('Failure', error, 'Failed to update node');
      }
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
