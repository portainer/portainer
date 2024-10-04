import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { confirmImageExport } from '@/react/docker/images/common/ConfirmExportModal';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';

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

      $scope.state.actionInProgress = true;
      ImageService.pullImage(registryModel, nodeName)
        .then(function success() {
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

    /**
     *
     * @param {Array<import('@/react/docker/images/queries/useImages').ImagesListResponse>} selectedItems
     * @param {boolean} force
     */
    $scope.confirmRemovalAction = async function (selectedItems, force) {
      const confirmed = await (force ? confirmImageForceRemoval() : confirmRegularRemove());

      if (!confirmed) {
        return;
      }

      $scope.removeAction(selectedItems, force);
    };

    /**
     *
     * @param {Array<import('@/react/docker/images/queries/useImages').ImagesListResponse>} selectedItems
     */
    function isAuthorizedToDownload(selectedItems) {
      for (var i = 0; i < selectedItems.length; i++) {
        var image = selectedItems[i];

        var untagged = _.find(image.tags, function (item) {
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

    /**
     *
     * @param {Array<import('@/react/docker/images/queries/useImages').ImagesListResponse>} images
     */
    function exportImages(images) {
      HttpRequestHelper.setPortainerAgentTargetHeader(images[0].nodeName);
      $scope.state.exportInProgress = true;
      ImageService.downloadImages(images)
        .then(function success(data) {
          var downloadData = new Blob([data], { type: 'application/x-tar' });
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

    /**
     *
     * @param {Array<import('@/react/docker/images/queries/useImages').ImagesListResponse>} selectedItems
     */
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

    $scope.removeAction = removeAction;

    /**
     *
     * @param {Array<import('@/react/docker/images/queries/useImages').ImagesListResponse>} selectedItems
     * @param {boolean} force
     */
    async function removeAction(selectedItems, force) {
      async function doRemove(image) {
        HttpRequestHelper.setPortainerAgentTargetHeader(image.nodeName);
        return ImageService.deleteImage(image.id, force)
          .then(function success() {
            Notifications.success('Image successfully removed', image.id);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove image');
          });
      }

      await processItemsInBatches(selectedItems, doRemove);
      $state.reload();
    }

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      $scope.state.pullRateValid = validity;
    }
  },
]);
