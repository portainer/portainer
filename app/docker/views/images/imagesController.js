angular.module('portainer.docker')
.controller('ImagesController', ['$scope', '$state', 'ImageService', 'Notifications', 'ModalService',
function ($scope, $state, ImageService, Notifications, ModalService) {
  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Image: '',
    Registry: ''
  };

  $scope.pullImage = function() {
    var image = $scope.formValues.Image;
    var registry = $scope.formValues.Registry;

    $scope.state.actionInProgress = true;
    ImageService.pullImage(image, registry, false)
    .then(function success(data) {
      Notifications.success('Image successfully pulled', image);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to pull image');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.confirmRemovalAction = function (selectedItems, force) {
    ModalService.confirmImageForceRemoval(function (confirmed) {
      if(!confirmed) { return; }
      $scope.removeAction(selectedItems, force);
    });
  };

  $scope.removeAction = function (selectedItems, force) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (image) {
      ImageService.deleteImage(image.Id, force)
      .then(function success() {
        Notifications.success('Image successfully removed', image.Id);
        var index = $scope.images.indexOf(image);
        $scope.images.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove image');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function initView() {
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;

    ImageService.images(true)
    .then(function success(data) {
      $scope.images = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve images');
      $scope.images = [];
    });
  }

  initView();
}]);
