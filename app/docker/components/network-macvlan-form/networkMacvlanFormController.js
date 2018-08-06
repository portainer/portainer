angular.module('portainer.docker')
  .controller('NetworkMacvlanFormController', ['$q', 'NodeService', 'NetworkService', 'Notifications', 'StateManager', 'Authentication',
    function ($q, NodeService, NetworkService, Notifications, StateManager, Authentication) {
      var ctrl = this;

      ctrl.formValidation = function () {
        if (ctrl.data.Scope === 'local') {
          if (ctrl.data.DatatableState === undefined) return false;
          return ctrl.data.DatatableState.selectedItemCount === 0;
        } else {
          return !ctrl.data.SelectedNetworkConfig;
        }
      };

      function initComponent() {
        if (StateManager.getState().application.authentication) {
          var userDetails = Authentication.getUserDetails();
          var isAdmin = userDetails.role === 1 ? true : false;
          ctrl.isAdmin = isAdmin;
        }

        var provider = ctrl.applicationState.endpoint.mode.provider;
        $q.all({
            nodes: provider !== 'DOCKER_SWARM_MODE' || NodeService.nodes()
          })
          .then(function success(data) {
            if (data.nodes !== true)
              ctrl.nodes = data.nodes;
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve cluster details');
          });

        var apiVersion = ctrl.applicationState.endpoint.apiVersion;
        NetworkService.networks(
            provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
            false,
            provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25
          )
          .then(function success(data) {
            ctrl.availableNetworks = data.filter(function (item) {
              return item.ConfigOnly === true;
            });
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve networks');
          });

      }

      initComponent();
    }
  ]);