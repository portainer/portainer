angular.module('portainer.app')
  .controller('HomeController', ['$q', '$scope', '$state', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'ModalService', 'MotdService',
    function($q, $scope, $state, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, ModalService, MotdService) {

      $scope.goToEdit = function(id) {
        $state.go('portainer.endpoints.endpoint', { id: id });
      };

      $scope.goToDashboard = function(endpoint) {
        EndpointHelper.activateEndpointAndRedirect(endpoint);
      };

      $scope.dismissImportantInformation = function(hash) {
        StateManager.dismissImportantInformation(hash);
      };

      $scope.dismissInformationPanel = function(id) {
        StateManager.dismissInformationPanel(id);
      };

      $scope.triggerSnapshot = function() {
        ModalService.confirmEndpointSnapshot(function(result) {
          if (!result) {
            return;
          }
          triggerSnapshot();
        });
      };

      function triggerSnapshot() {
        EndpointService.snapshotEndpoints()
          .then(function success() {
            Notifications.success('Success', 'Endpoints updated');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'An error occured during endpoint snapshot');
          });
      }

      function initView() {
        $scope.isAdmin = Authentication.getUserDetails().role === 1;

        MotdService.motd()
          .then(function success(data) {
            $scope.motd = data;
          });

        $q.all({
          endpoints: EndpointService.endpoints(),
          groups: GroupService.groups()
        })
          .then(function success(data) {
            var endpoints = data.endpoints;
            var groups = data.groups;
            EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
            $scope.endpoints = endpoints;
            EndpointProvider.setEndpoints(endpoints);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
          });
      }

      initView();
    }]);
