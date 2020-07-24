angular.module('portainer.docker').controller('NetworkMacvlanFormController', [
  '$q',
  'NodeService',
  'NetworkService',
  'Notifications',
  'StateManager',
  'Authentication',
  function ($q, NodeService, NetworkService, Notifications, StateManager, Authentication) {
    var ctrl = this;

    ctrl.requiredNodeSelection = function () {
      if (ctrl.data.Scope !== 'local' || ctrl.data.DatatableState === undefined) {
        return false;
      }
      return ctrl.data.DatatableState.selectedItemCount === 0;
    };

    ctrl.requiredConfigSelection = function () {
      if (ctrl.data.Scope !== 'swarm') {
        return false;
      }
      return !ctrl.data.SelectedNetworkConfig;
    };

    this.$onInit = $onInit;
    function $onInit() {
      var isAdmin = Authentication.isAdmin();
      ctrl.isAdmin = isAdmin;

      var provider = ctrl.applicationState.endpoint.mode.provider;
      var apiVersion = ctrl.applicationState.endpoint.apiVersion;
      $q.all({
        nodes: provider !== 'DOCKER_SWARM_MODE' || NodeService.nodes(),
        networks: NetworkService.networks(provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE', false, provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25),
      })
        .then(function success(data) {
          if (data.nodes !== true) {
            ctrl.nodes = data.nodes;
          }
          ctrl.availableNetworks = data.networks.filter(function (item) {
            return item.ConfigOnly === true;
          });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve informations for macvlan');
        });
    }
  },
]);
