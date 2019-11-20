angular.module('portainer.app')
.controller('ExtensionController', ['$q', '$scope', '$transition$', '$state', 'ExtensionService', 'Notifications', 'ModalService',
function ($q, $scope, $transition$, $state, ExtensionService, Notifications, ModalService) {

  $scope.state = {
    onlineUpdateInProgress: false,
    offlineUpdateInProgress: false,
    deleteInProgress: false,
    offlineUpdate: false,
  };

  $scope.formValues = {
    instances: 1,
    extensionFile: null,
  };

  $scope.updateExtensionOnline = updateExtensionOnline;
  $scope.updateExtensionOffline = updateExtensionOffline;
  $scope.deleteExtension = deleteExtension;
  $scope.enlargeImage = enlargeImage;

  function enlargeImage(image) {
    ModalService.enlargeImage(image);
  }

  function deleteExtension(extension) {
    $scope.state.deleteInProgress = true;
    ExtensionService.delete(extension.Id)
    .then(function onSuccess() {
      Notifications.success('Extension successfully deleted');
      $state.go('portainer.extensions');
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to delete extension');
    })
    .finally(function final() {
      $scope.state.deleteInProgress = false;
    });
  }

  function updateExtensionOnline(extension) {
    $scope.state.onlineUpdateInProgress = true;
    ExtensionService.update(extension.Id, extension.Version)
    .then(function onSuccess() {
      Notifications.success('Extension successfully updated');
      $state.reload();
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to update extension');
    })
    .finally(function final() {
      $scope.state.onlineUpdateInProgress = false;
    });
  }

  function updateExtensionOffline(extension) {
    $scope.state.offlineUpdateInProgress = true;
    const extensionFile = $scope.formValues.ExtensionFile;

    ExtensionService.enable(extension.License.LicenseKey, extensionFile)
    .then(function onSuccess() {
      Notifications.success('Extension successfully updated');
      $state.reload();
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to update extension');
    })
    .finally(function final() {
      $scope.state.offlineUpdateInProgress = false;
    });
  }

  function initView() {
    ExtensionService.extension($transition$.params().id)
    .then(function onSuccess(extension) {
      $scope.extension = extension;
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to retrieve extension information');
    });
  }

  initView();
}]);
