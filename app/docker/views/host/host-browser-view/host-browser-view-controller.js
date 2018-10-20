angular
  .module('portainer.docker')
  .controller('HostBrowserViewController', [
    'SystemService', 'HttpRequestHelper',
    function HostBrowserViewController(SystemService, HttpRequestHelper) {
      var ctrl = this;

      ctrl.$onInit = $onInit;

      function $onInit() {
        loadInfo();
      }

      function loadInfo() {
        SystemService.info().then(function onInfoLoaded(host) {
          HttpRequestHelper.setPortainerAgentTargetHeader(host.Name);
          ctrl.host = host;
        });
      }
    }
  ]);
