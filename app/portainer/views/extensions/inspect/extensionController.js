angular.module('portainer.app')
.controller('ExtensionController', ['$q', '$scope', '$transition$', '$state', 'ExtensionService', 'Notifications',
function ($q, $scope, $transition$, $state, ExtensionService, Notifications) {

  $scope.state = {
    updateInProgress: false,
    deleteInProgress: false
  };

  $scope.formValues = {
    instances: 1
  };

  $scope.updateExtension = updateExtension;
  $scope.deleteExtension = deleteExtension;

  function deleteExtension(extension) {
    $scope.state.deleteInProgress = true;
    ExtensionService.delete(extension.Id)
    .then(function onSuccess() {
      Notifications.success('Extension successfully deleted');
      $state.reload();
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to delete extension');
    })
    .finally(function final() {
      $scope.state.deleteInProgress = false;
    });
  }

  function updateExtension(extension) {
    $scope.state.updateInProgress = true;
    ExtensionService.update(extension.Id, extension.Version)
    .then(function onSuccess() {
      Notifications.success('Extension successfully updated');
      $state.reload();
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to update extension');
    })
    .finally(function final() {
      $scope.state.updateInProgress = false;
    });
  }

  function initView() {
    ExtensionService.extension($transition$.params().id, true)
    .then(function onSuccess(extension) {
      $scope.extension = extension;
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to retrieve extension information');
    });
  }

  initView();
}]);
