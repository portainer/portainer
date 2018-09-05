angular.module('portainer.docker').controller('HostViewController', [
  '$q',
  '$scope',
  'SystemService',
  'Notifications',
  function HostViewController($q, $scope, SystemService, Notifications) {
    var ctrl = this;
    this.$onInit = initView;

    this.engineDetails = {};
    this.hostDetails = {};

    function initView() {
      $q.all({
        version: SystemService.version(),
        info: SystemService.info()
      })
        .then(function success(data) {
          ctrl.engineDetails = buildEngineDetails(data);
          ctrl.hostDetails = buildHostDetails(data.info);
        })
        .catch(function error(err) {
          Notifications.error(
            'Failure',
            err,
            'Unable to retrieve engine details'
          );
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
        networkPlugins: info.Plugins.Network
      };
    }

    function buildHostDetails(info) {
      return {
        os: {
          arch: info.Architecture,
          type: info.OSType,
          name: info.OperatingSystem
        },
        name: info.Name,
        kernelVersion: info.KernelVersion,
        totalCPU: info.NCPU,
        totalMemory: info.MemTotal
      };
    }
  }
]);
