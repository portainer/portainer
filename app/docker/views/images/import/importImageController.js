import { PorImageRegistryModel } from '@/docker/models/porImageRegistry';
import i18n from '@/i18n';

angular.module('portainer.docker').controller('ImportImageController', [
  '$scope',
  '$state',
  '$async',
  'ImageService',
  'Notifications',
  'HttpRequestHelper',
  'Authentication',
  'ImageHelper',
  'endpoint',
  function ($scope, $state, $async, ImageService, Notifications, HttpRequestHelper, Authentication, ImageHelper, endpoint) {
    $scope.state = {
      actionInProgress: false,
    };

    $scope.endpoint = endpoint;

    $scope.isAdmin = Authentication.isAdmin();

    $scope.formValues = {
      UploadFile: null,
      NodeName: null,
      RegistryModel: new PorImageRegistryModel(),
    };

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      $scope.state.pullImageValidity = validity;
    }

    async function tagImage(id) {
      const registryModel = $scope.formValues.RegistryModel;
      if (registryModel.Image) {
        const { repo, tag } = ImageHelper.createImageConfigForContainer(registryModel);
        try {
          await ImageService.tagImage(id, repo, tag);
        } catch (err) {
          Notifications.error(i18n.t('docker.images.import.failure'), err, i18n.t('docker.images.import.unableToTagImage'));
        }
      }
    }

    $scope.uploadImage = function () {
      return $async(uploadImageAsync);
    };

    async function uploadImageAsync() {
      $scope.state.actionInProgress = true;

      var nodeName = $scope.formValues.NodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      var file = $scope.formValues.UploadFile;
      try {
        const { data } = await ImageService.uploadImage(file);
        if (data.error) {
          Notifications.error(i18n.t('docker.images.import.failure'), data.error, i18n.t('docker.images.import.unableToUploadImage'));
        } else if (data.stream) {
          // docker has /n at the end of the stream, podman doesn't
          var regex = /Loaded.*?: (.*?)(?:\n|$)/g;
          var imageIds = regex.exec(data.stream);
          if (imageIds && imageIds.length == 2) {
            await tagImage(imageIds[1]);
            $state.go('docker.images.image', { id: imageIds[1] }, { reload: true });
          }
          Notifications.success(i18n.t('docker.images.import.success'), i18n.t('docker.images.import.imagesUploadedSuccess'));
        } else {
          Notifications.success(i18n.t('docker.images.import.success'), i18n.t('docker.images.import.multipleImagesIgnoredTag'));
        }
      } catch (err) {
        Notifications.error(i18n.t('docker.images.import.failure'), err, i18n.t('docker.images.import.unableToUploadImage'));
      } finally {
        $scope.state.actionInProgress = false;
      }
    }
  },
]);
