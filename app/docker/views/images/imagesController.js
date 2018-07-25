angular.module('portainer.docker')
.controller('ImagesController', ['$scope', '$state', 'ImageService', 'Notifications', 'ModalService', 'HttpRequestHelper', 'FileSaver',
function ($scope, $state, ImageService, Notifications, ModalService, HttpRequestHelper, FileSaver) {
  $scope.state = {
    actionInProgress: false,
    exportInProgress: false
  };

  $scope.formValues = {
    Image: '',
    Registry: '',
    NodeName: null
  };

  $scope.pullImage = function() {
    var image = $scope.formValues.Image;
    var registry = $scope.formValues.Registry;

    var nodeName = $scope.formValues.NodeName;
    HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

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

  function isAuthorizedToDownload(selectedItems) {
    var isFromDifferentNode = selectedItems.map(function(item) {
        return item.NodeName === selectedItems[0].NodeName;
      }).includes(false);

    var hasNoneTag = selectedItems.map(function(item) {
      return item.RepoTags.map(function(tag) {
        return tag.includes('<none>');
      }).includes(true);
    }).includes(true);

    if (isFromDifferentNode) {
      Notifications.error('Failure', '', 'Can\'t download images from different nodes at the same time');
      return false;
    }
    if (hasNoneTag) {
      Notifications.error('Failure', '', 'Can\'t download images with none tags');
      return false;
    }
    return true;
  }

  $scope.downloadAction = function (selectedItems) {
    if (!isAuthorizedToDownload(selectedItems))
      return;

    HttpRequestHelper.setPortainerAgentTargetHeader(selectedItems[0].NodeName);
    $scope.state.exportInProgress = true;
    ImageService.downloadImages(selectedItems)
    .then(function success(data) {
      var downloadData = new Blob([data.file], { type: 'application/x-tar' });
      FileSaver.saveAs(downloadData, 'images.tar');
      Notifications.success('Images successfully downloaded');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to download images');
    })
    .finally(function final() {
      $scope.state.exportInProgress = false;
    });
  };

  $scope.removeAction = function (selectedItems, force) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (image) {
      HttpRequestHelper.setPortainerAgentTargetHeader(image.NodeName);
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
