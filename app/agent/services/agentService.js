angular.module('portainer.agent').factory('AgentService', [
  '$q', 'Agent',
  function AgentServiceFactory($q, Agent) {
    'use strict';
    var service = {};

    service.agents = agents;
    service.hostInfo = hostInfo;

    function hostInfo() {
      return $q.when({
        PhysicalDeviceVendor: 'hello',
        DeviceVersion: '1.9',
        DeviceSerialNumber: '144f',
        InstalledPCIDevices: ['usb', 'printer'],
        PhysicalDisk: 'none'
      });
    }

    function agents() {
      var deferred = $q.defer();

      Agent.query({})
        .$promise.then(function success(data) {
          var agents = data.map(function(item) {
            return new AgentViewModel(item);
          });
          deferred.resolve(agents);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve agents', err: err });
        });

      return deferred.promise;
    }

    return service;
  }
]);
