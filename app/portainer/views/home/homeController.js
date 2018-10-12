angular.module('portainer.app')
  .controller('HomeController', ['$q', '$scope', '$state', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'ExtensionManager', 'ModalService', 'MotdService',
    function ($q, $scope, $state, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, ExtensionManager, ModalService, MotdService) {

      $scope.goToDashboard = function (endpoint) {
        var status = 1;

        EndpointService.checkEndpointStatus(endpoint.Id)
          .then(function sucess() {
            status = 1;
          }).catch(function error() {
            status = 2;
          }).finally(function () {
            if (endpoint.Status !== status) {
              EndpointService.updateEndpoint(endpoint.Id, {
                Status: status
              });
              endpoint.Status = status;
            }
            if (status === 1) {
              if (endpoint.Type === 3) {
                switchToAzureEndpoint(endpoint);
              } else {
                switchToDockerEndpoint(endpoint);
              }
            } else {
              if (endpoint.Type === 3) {
                Notifications.error('Failure', '', 'Endpoint is unreachable. Offline browsing disabled for Azure endpoints.');
              } else if (endpoint.Snapshots[0] && endpoint.Snapshots[0].Swarm === true) {
                Notifications.error('Failure', '', 'Endpoint is unreachable. Connect to another swarm manager.');
              } else if (!endpoint.Snapshots[0]) {
                Notifications.error('Failure', '', 'Endpoint is unreachable and there is no snapshot available for offline browsing.');
              } else {
                switchToDockerEndpoint(endpoint);
              }
            }
          });
      };

      $scope.dismissImportantInformation = function (hash) {
        StateManager.dismissImportantInformation(hash);
      };

      $scope.dismissInformationPanel = function (id) {
        StateManager.dismissInformationPanel(id);
      };

      function triggerSnapshot() {
        EndpointService.snapshot()
          .then(function success() {
            Notifications.success('Success', 'Endpoints updated');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'An error occured during endpoint snapshot');
          });
      }

      $scope.triggerSnapshot = function () {
        ModalService.confirmEndpointSnapshot(function (result) {
          if (!result) {
            return;
          }
          triggerSnapshot();
        });
      };

      function switchToAzureEndpoint(endpoint) {
        EndpointProvider.setEndpointID(endpoint.Id);
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        EndpointProvider.setEndpointStatus(endpoint.Status);
        StateManager.updateEndpointState(endpoint.Name, endpoint.Type, [])
          .then(function success() {
            $state.go('azure.dashboard');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
          });
      }

      function switchToDockerEndpoint(endpoint) {
        EndpointProvider.setEndpointID(endpoint.Id);
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        EndpointProvider.setEndpointStatus(endpoint.Status);
        ExtensionManager.initEndpointExtensions(endpoint.Id)
          .then(function success(data) {
            var extensions = data;
            return StateManager.updateEndpointState(endpoint.Name, endpoint.Type, extensions);
          })
          .then(function success() {
            $state.go('docker.dashboard');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
          });
      }

      $scope.goToEdit = goToEdit;

      function goToEdit(id) {
        $state.go('portainer.endpoints.endpoint', {
          id: id
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
    }
  ]);