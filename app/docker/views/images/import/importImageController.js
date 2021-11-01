import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

angular.module('portainer.docker').controller('ImportImageController', [
  '$scope',
  '$state',
  'ImageService',
  'Notifications',
  'HttpRequestHelper',
  'Authentication',
  'ImageHelper',
  'endpoint',
  function ($scope, $state, ImageService, Notifications, HttpRequestHelper, Authentication, ImageHelper, endpoint) {
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

    function tagImage(id) {
      const registryModel = $scope.formValues.RegistryModel;
      if (registryModel.Image) {
        const image = ImageHelper.createImageConfigForContainer(registryModel);
        return ImageService.tagImage(id, image.fromImage).catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to tag image');
        });
      }
      return null;
    }

    $scope.uploadImage = async function () {
      $scope.state.actionInProgress = true;

      var nodeName = $scope.formValues.NodeName;
      HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
      var file = $scope.formValues.UploadFile;
      await ImageService.uploadImage(file)
        .then(async function success(res) {
          if (res.data.error) {
            Notifications.error('Failure', res.data.error, 'Unable to upload image');
            return;
          }
          if (res.data.stream) {
            var regex = /Loaded.*?: (.*?)\n$/g;
            var imageIds = regex.exec(res.data.stream);
            if (imageIds && imageIds.length == 2) {
              await tagImage(imageIds[1]);
              $state.go('docker.images.image', { id: imageIds[1] }, { reload: true });
            }
            Notifications.success('Images successfully uploaded');
          } else {
            Notifications.success('The uploaded tar file contained multiple images. The provided tag therefore has been ignored.');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to upload image');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };
  },
]);
