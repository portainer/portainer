angular.module('portainer.app')
  .controller('HomeController', ['$q', '$scope', '$state', '$interval', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'LegacyExtensionManager', 'ModalService', 'MotdService', 'SystemService',
    function($q, $scope, $state, $interval, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, LegacyExtensionManager, ModalService, MotdService, SystemService) {

      $scope.state = {
        connectingToEdgeEndpoint: false,
      };

      $scope.goToEdit = function(id) {
        $state.go('portainer.endpoints.endpoint', { id: id });
      };

      $scope.goToDashboard = function(endpoint) {
        if (endpoint.Type === 3) {
          return switchToAzureEndpoint(endpoint);
        } else if (endpoint.Type === 4) {
          return switchToEdgeEndpoint(endpoint);
        }

        checkEndpointStatus(endpoint)
          .then(function sucess() {
            return switchToDockerEndpoint(endpoint);
          }).catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to verify endpoint status');
          });
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

      function checkEndpointStatus(endpoint) {
        var deferred = $q.defer();

        var status = 1;
        SystemService.ping(endpoint.Id)
          .then(function success() {
            status = 1;
          }).catch(function error() {
            status = 2;
          }).finally(function() {
            if (endpoint.Status === status) {
              deferred.resolve(endpoint);
              return deferred.promise;
            }

            EndpointService.updateEndpoint(endpoint.Id, { Status: status })
              .then(function sucess() {
                deferred.resolve(endpoint);
              }).catch(function error(err) {
                deferred.reject({ msg: 'Unable to update endpoint status', err: err });
              });
          });

        return deferred.promise;
      }

      function switchToAzureEndpoint(endpoint) {
        EndpointProvider.setEndpointID(endpoint.Id);
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
        StateManager.updateEndpointState(endpoint, [])
          .then(function success() {
            $state.go('azure.dashboard');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
          });
      }

      // TODO: refactor?
      // Update status to REQUIRED
      // start a 10sec timeout loop
      // send ping request
      function switchToEdgeEndpoint(endpoint) {
        // EndpointProvider.setEndpointID(endpoint.Id);
        // EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        // EndpointProvider.setOfflineModeFromStatus(endpoint.Status);

        let connectionAttempts = 0;
        let maxConnectionAttempts = 5;

        EndpointService.updateStatus(endpoint.Id, "REQUIRED")
          .then(function success() {
            $scope.state.connectingToEdgeEndpoint = true;
            return checkEndpointStatus(endpoint);
          })
          .then(function success(data) {
            if (data.Status === 1) {
              $scope.state.connectingToEdgeEndpoint = false;
              switchToDockerEndpoint(endpoint);
            } else {
              connectionAttempts++;
              let repeater = $interval(function() {
                checkEndpointStatus(endpoint)
                  .then(function(data2) {
                    if (data2.Status === 1) {
                      $interval.cancel(repeater);
                      $scope.state.connectingToEdgeEndpoint = false;
                      switchToDockerEndpoint(endpoint);
                    } else {
                      connectionAttempts++;
                      if (connectionAttempts === maxConnectionAttempts) {
                        $interval.cancel(repeater);
                        Notifications.error('Failure', {}, 'Unable to connect to Edge endpoint');
                        $scope.state.connectingToEdgeEndpoint = false;
                      }
                    }
                  });
              }, 2000, 5, false);
            }
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to access endpoint');
          });
      }


      function switchToDockerEndpoint(endpoint) {
        if (endpoint.Status === 2 && endpoint.Snapshots[0] && endpoint.Snapshots[0].Swarm === true) {
          Notifications.error('Failure', '', 'Endpoint is unreachable. Connect to another swarm manager.');
          return;
        } else if (endpoint.Status === 2 && !endpoint.Snapshots[0]) {
          Notifications.error('Failure', '', 'Endpoint is unreachable and there is no snapshot available for offline browsing.');
          return;
        }

        EndpointProvider.setEndpointID(endpoint.Id);
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
        LegacyExtensionManager.initEndpointExtensions(endpoint)
          .then(function success(data) {
            var extensions = data;
            return StateManager.updateEndpointState(endpoint, extensions);
          })
          .then(function success() {
            $state.go('docker.dashboard');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
          });
      }

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
        $scope.isAdmin = Authentication.isAdmin();

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
