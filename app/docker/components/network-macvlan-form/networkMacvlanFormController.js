import { getOptions } from '@/react/docker/networks/CreateView/macvlanOptions';

angular.module('portainer.docker').controller('NetworkMacvlanFormController', [
  '$q',
  'NodeService',
  'NetworkService',
  'Notifications',
  '$scope',
  'Authentication',
  function ($q, NodeService, NetworkService, Notifications, $scope, Authentication) {
    var ctrl = this;

    this.options = [];

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

    this.onChangeScope = onChangeScope.bind(this);
    function onChangeScope(value) {
      return $scope.$evalAsync(() => {
        this.data.Scope = value;
      });
    }

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

          ctrl.options = getOptions(ctrl.availableNetworks.length > 0);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve informations for macvlan');
        });
    }
  },
]);
