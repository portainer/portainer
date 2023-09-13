import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { confirmImageExport } from '@/react/docker/images/common/ConfirmExportModal';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

angular.module('portainer.docker').controller('ImagesController', [
  '$scope',
  '$state',
  'Authentication',
  'ImageService',
  'Notifications',
  'HttpRequestHelper',
  'FileSaver',
  'Blob',
  'endpoint',
  '$async',
  function ($scope, $state, Authentication, ImageService, Notifications, HttpRequestHelper, FileSaver, Blob, endpoint) {
    $scope.endpoint = endpoint;
    $scope.isAdmin = Authentication.isAdmin();

    $scope.state = {
      actionInProgress: false,
      exportInProgress: false,
      pullRateValid: false,
    };

    $scope.formValues = {
      RegistryModel: new PorImageRegistryModel(),
      NodeName: null,
    };

    $scope.pullImage = function () {
      const registryModel = $scope.formValues.RegistryModel;

      var nodeName = $scope.formValues.NodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

      $scope.state.actionInProgress = true;
      ImageService.pullImage(registryModel, false)
        .then(function success(data) {
          var err = data[data.length - 1].errorDetail;
          if (err) {
            return Notifications.error('Failure', err, 'Unable to pull image');
          }
          Notifications.success('Image successfully pulled', registryModel.Image);
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to pull image');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function confirmImageForceRemoval() {
      return confirmDestructive({
        title: 'Are you sure?',
        message:
          "Forcing removal of an image will remove it even if it's used by stopped containers, and delete all associated tags. Are you sure you want to remove the selected image(s)?",
        confirmButton: buildConfirmButton('Remove the image', 'danger'),
      });
    }

    function confirmRegularRemove() {
      return confirmDestructive({
        title: 'Are you sure?',
        message: 'Removing an image will also delete all associated tags. Are you sure you want to remove the selected image(s)?',
        confirmButton: buildConfirmButton('Remove the image', 'danger'),
      });
    }

    $scope.confirmRemovalAction = async function (selectedItems, force) {
      const confirmed = await (force ? confirmImageForceRemoval() : confirmRegularRemove());

      if (!confirmed) {
        return;
      }

      $scope.removeAction(selectedItems, force);
    };

    function isAuthorizedToDownload(selectedItems) {
      for (var i = 0; i < selectedItems.length; i++) {
        var image = selectedItems[i];

        var untagged = _.find(image.RepoTags, function (item) {
          return item.indexOf('<none>') > -1;
        });

        if (untagged) {
          Notifications.warning('', 'Cannot download a untagged image');
          return false;
        }
      }

      if (_.uniqBy(selectedItems, 'NodeName').length > 1) {
        Notifications.warning('', 'Cannot download images from different nodes at the same time');
        return false;
      }

      return true;
    }

    function exportImages(images) {
      HttpRequestHelper.setPortainerAgentTargetHeader(images[0].NodeName);
      $scope.state.exportInProgress = true;
      ImageService.downloadImages(images)
        .then(function success(data) {
          var downloadData = new Blob([data.file], { type: 'application/x-tar' });
          FileSaver.saveAs(downloadData, 'images.tar');
          Notifications.success('Success', 'Image(s) successfully downloaded');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to download image(s)');
        })
        .finally(function final() {
          $scope.state.exportInProgress = false;
        });
    }

    $scope.downloadAction = function (selectedItems) {
      if (!isAuthorizedToDownload(selectedItems)) {
        return;
      }

      confirmImageExport(function (confirmed) {
        if (!confirmed) {
          return;
        }
        exportImages(selectedItems);
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

    $scope.getImages = getImages;
    function getImages() {
      ImageService.images(true)
        .then(function success(data) {
          $scope.images = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve images');
          $scope.images = [];
        });
    }

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      $scope.state.pullRateValid = validity;
    }

    function initView() {
      getImages();
    }

    initView();
  },
]);
