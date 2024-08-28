import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { fullURIIntoRepoAndTag } from '@/react/docker/images/utils';

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
        const image = ImageHelper.createImageConfigForContainer(registryModel);
        const { repo, tag } = fullURIIntoRepoAndTag(image.fromImage);
        try {
          await ImageService.tagImage(id, repo, tag);
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to tag image');
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
          Notifications.error('Failure', data.error, 'Unable to upload image');
        } else if (data.stream) {
          // docker has /n at the end of the stream, podman doesn't
          var regex = /Loaded.*?: (.*?)(?:\n|$)/g;
          var imageIds = regex.exec(data.stream);
          if (imageIds && imageIds.length == 2) {
            await tagImage(imageIds[1]);
            $state.go('docker.images.image', { id: imageIds[1] }, { reload: true });
          }
          Notifications.success('Success', 'Images successfully uploaded');
        } else {
          Notifications.success('Success', 'The uploaded tar file contained multiple images. The provided tag therefore has been ignored.');
        }
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to upload image');
      } finally {
        $scope.state.actionInProgress = false;
      }
    }
  },
]);
