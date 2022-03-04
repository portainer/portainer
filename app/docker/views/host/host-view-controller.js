import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';

angular.module('portainer.docker').controller('HostViewController', [
  '$q',
  'SystemService',
  'Notifications',
  'StateManager',
  'AgentService',
  'ContainerService',
  'Authentication',
  function HostViewController($q, SystemService, Notifications, StateManager, AgentService, ContainerService, Authentication) {
    var ctrl = this;

    this.$onInit = initView;

    ctrl.state = {
      isAgent: false,
      isAdmin: false,
      offlineMode: false,
    };

    this.engineDetails = {};
    this.hostDetails = {};
    this.devices = null;
    this.disks = null;

    function initView() {
      var applicationState = StateManager.getState();
      ctrl.state.isAgent = applicationState.endpoint.mode.agentProxy;
      ctrl.state.isAdmin = Authentication.isAdmin();
      var agentApiVersion = applicationState.endpoint.agentApiVersion;
      ctrl.state.agentApiVersion = agentApiVersion;
      ctrl.state.enableHostManagementFeatures = ctrl.endpoint.SecuritySettings.enableHostManagementFeatures;

      $q.all({
        version: SystemService.version(),
        info: SystemService.info(),
        jobs: ctrl.state.isAdmin ? ContainerService.containers(true, { label: ['io.portainer.job.endpoint'] }) : [],
      })
        .then(function success(data) {
          ctrl.engineDetails = buildEngineDetails(data);
          ctrl.hostDetails = buildHostDetails(data.info);
          ctrl.state.offlineMode = isOfflineEndpoint(ctrl.endpoint);
          ctrl.jobs = data.jobs;

          if (ctrl.state.isAgent && agentApiVersion > 1) {
            return AgentService.hostInfo(data.info.Hostname).then(function onHostInfoLoad(agentHostInfo) {
              ctrl.devices = agentHostInfo.PCIDevices;
              ctrl.disks = agentHostInfo.PhysicalDisks;
            });
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve engine details');
        });
    }

    function buildEngineDetails(data) {
      var versionDetails = data.version;
      var info = data.info;
      return {
        releaseVersion: versionDetails.Version,
        apiVersion: versionDetails.ApiVersion,
        rootDirectory: info.DockerRootDir,
        storageDriver: info.Driver,
        loggingDriver: info.LoggingDriver,
        volumePlugins: info.Plugins.Volume,
        networkPlugins: info.Plugins.Network,
      };
    }

    function buildHostDetails(info) {
      return {
        os: {
          arch: info.Architecture,
          type: info.OSType,
          name: info.OperatingSystem,
        },
        name: info.Name,
        kernelVersion: info.KernelVersion,
        totalCPU: info.NCPU,
        totalMemory: info.MemTotal,
      };
    }
  },
]);
