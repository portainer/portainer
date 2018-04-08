angular.module('portainer.app')
.controller('RegistryBrowseController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications', 'ModalService',
function ($q, $scope, $transition$, RegistryService, Notifications, ModalService) {

  $scope.state = {};
  var registryID = $transition$.params().id;

  function initView() {
    RegistryService.catalog(registryID)
    .then(function success(catalog) {
      $scope.repositories = catalog.Repositories.map(function (elem) {
        return {'Name': elem};
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry catalog');
    });

    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  $scope.removeAction = function(selectedItems) {
    var message = 'Do you want to delete this repository?';
    if (selectedItems.length > 1) {
      message = 'Do you want to delete these repositories?';
    }
    ModalService.confirmDeletion(
      message + ' All associated tags will be removed.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeRepositories(selectedItems);
      }
    );
  };

  function removeRepositories(repositories) {
    for (var r in repositories) {
      var repository = repositories[r].Name;
      RegistryService.deleteRepository(registryID, repository)
      .then(function success(data) {
        Notifications.success('Repository deleted', data);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove repository');
      });
    }
    // Reload view
    //initView();
  }

  initView();
}]);
