import angular from 'angular';
import EndpointHelper from 'Portainer/helpers/endpointHelper';

angular.module('portainer.app').controller('EndpointsController', EndpointsController);

function EndpointsController($q, $scope, $state, $async, EndpointService, GroupService, ModalService, Notifications, EndpointProvider, StateManager) {
  $scope.state = {
    loadingMessage: '',
  };

  $scope.setLoadingMessage = setLoadingMessage;
  function setLoadingMessage(message) {
    $scope.state.loadingMessage = message;
  }

  $scope.removeAction = removeAction;
  function removeAction(endpoints) {
    ModalService.confirmDeletion('This action will remove all configurations associated to your environment(s). Continue?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      return $async(removeActionAsync, endpoints);
    });
  }

  async function removeActionAsync(endpoints) {
    for (let endpoint of endpoints) {
      try {
        await EndpointService.deleteEndpoint(endpoint.Id);

        Notifications.success('Environment successfully removed', endpoint.Name);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to remove environment');
      }
    }

    const endpointId = EndpointProvider.endpointID();
    // If the current endpoint was deleted, then clean endpoint store
    if (endpoints.some((item) => item.Id === endpointId)) {
      StateManager.cleanEndpoint();
      // trigger sidebar rerender
      $scope.applicationState.endpoint = {};
    }

    $state.reload();
  }

  $scope.getPaginatedEndpoints = getPaginatedEndpoints;
  function getPaginatedEndpoints(lastId, limit, search) {
    const deferred = $q.defer();
    $q.all({
      endpoints: EndpointService.endpoints(lastId, limit, { search }),
      groups: GroupService.groups(),
    })
      .then(function success(data) {
        var endpoints = data.endpoints.value;
        var groups = data.groups;
        EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
        deferred.resolve({ endpoints: endpoints, totalCount: data.endpoints.totalCount });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve environment information');
      });
    return deferred.promise;
  }
}
