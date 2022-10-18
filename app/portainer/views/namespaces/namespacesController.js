import './namespaces.css'

angular.module('portainer.app').controller('NamespacesController', NamespacesController);
import _, { isNull } from 'lodash';

function NamespacesController($scope, $state, $async, ModalService, NamespaceService, Notifications) {
  $scope.state = {
    actionInProgress: false,
    namespaces: [],
    containers: {},
    subContainers: '',
    subEndpointIds: []
  };

  $scope.handleClick = (item) => {
    Notifications.success('Namespaces =', item.Name)
    $scope.state.subEndpointIds = []

    $scope.state.subContainers = item.Containers

    if (!isNull($scope.state.subContainers)) {
      // eval('debugger')
      $scope.state.subEndpointIds = Object.values($scope.state.subContainers)
                                      .map(v => v.EndpointId)
                                      .filter((x, index, self) => self.indexOf(x) === index)
    }
    
    console.log('subContainers = ',  $scope.state.subContainers)
    console.log('Ids = ', $scope.state.subEndpointIds)
  };

  $scope.removeAction = removeAction;

  function removeAction(item) {
    ModalService.confirmDeletion(
      'Are you sure that you want to remove the selected ?',
      (confirmed) => {
        if (confirmed) {
          return $async(removeActionAsync, item);
        }
      }
    );
  }

  async function removeActionAsync(item) {
    try {
        await NamespaceService.deleteNamespace(item.Name).then(() => {
        Notifications.success('Namespaces successfully removed', item.Name);
        _.remove($scope.namespaces, item);
      });
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to remove namespaces');
    }
    $state.reload();
  }

  // function uniques(array) {
  //   var x = new Set(array);
  //   return [...x];
  // }

  function initView() {
    NamespaceService.namespaces()
      .then((data) => {
        console.log('namespaces = ', data);
        $scope.state.namespaces = data;
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to retrieve namespaces');
        $scope.state.namespaces = [];
      });
  }

  initView();
}
