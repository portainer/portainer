import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

angular.module('portainer.docker').controller('ImageController', [
  '$async',
  '$q',
  '$scope',
  '$transition$',
  '$state',
  'Authentication',
  'ImageService',
  'ImageHelper',
  'RegistryService',
  'Notifications',
  'HttpRequestHelper',
  'ModalService',
  'FileSaver',
  'Blob',
  'endpoint',
  'EndpointService',
  'RegistryModalService',
  function (
    $async,
    $q,
    $scope,
    $transition$,
    $state,
    Authentication,
    ImageService,
    ImageHelper,
    RegistryService,
    Notifications,
    HttpRequestHelper,
    ModalService,
    FileSaver,
    Blob,
    endpoint,
    EndpointService,
    RegistryModalService
  ) {
    $scope.endpoint = endpoint;
    $scope.isAdmin = Authentication.isAdmin();

    $scope.formValues = {
      RegistryModel: new PorImageRegistryModel(),
    };

    $scope.state = {
      exportInProgress: false,
      pullImageValidity: false,
    };

    $scope.sortType = 'Order';
    $scope.sortReverse = false;

    $scope.order = function (sortType) {
      $scope.sortReverse = $scope.sortType === sortType ? !$scope.sortReverse : false;
      $scope.sortType = sortType;
    };

    $scope.toggleLayerCommand = function (layerId) {
      $('#layer-command-expander' + layerId + ' span').toggleClass('glyphicon-plus-sign glyphicon-minus-sign');
      $('#layer-command-' + layerId + '-short').toggle();
      $('#layer-command-' + layerId + '-full').toggle();
    };

    $scope.setPullImageValidity = setPullImageValidity;
    function setPullImageValidity(validity) {
      $scope.state.pullImageValidity = validity;
    }

    $scope.tagImage = function () {
      const registryModel = $scope.formValues.RegistryModel;

      const image = ImageHelper.createImageConfigForContainer(registryModel);

      ImageService.tagImage($transition$.params().id, image.fromImage)
        .then(function success() {
          Notifications.success('Image successfully tagged');
          $state.go('docker.images.image', { id: $transition$.params().id }, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to tag image');
        });
    };

    $scope.pushTag = pushTag;

    async function pushTag(repository) {
      return $async(async () => {
        try {
          const registryModel = await RegistryModalService.registryModal(repository, $scope.registries);
          if (registryModel) {
            $('#uploadResourceHint').show();
            await ImageService.pushImage(registryModel);
            Notifications.success('Image successfully pushed', repository);
          }
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to push image to repository');
        } finally {
          $('#uploadResourceHint').hide();
        }
      });
    }

    $scope.pullTag = pullTag;
    async function pullTag(repository) {
      return $async(async () => {
        try {
          const registryModel = await RegistryModalService.registryModal(repository, $scope.registries);
          if (registryModel) {
            $('#downloadResourceHint').show();
            await ImageService.pullImage(registryModel);
            Notifications.success('Image successfully pulled', repository);
          }
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to pull image from repository');
        } finally {
          $('#downloadResourceHint').hide();
        }
      });
    }

    $scope.removeTag = function (repository) {
      ImageService.deleteImage(repository, false)
        .then(function success() {
          if ($scope.image.RepoTags.length === 1) {
            Notifications.success('Image successfully deleted', repository);
            $state.go('docker.images', {}, { reload: true });
          } else {
            Notifications.success('Tag successfully deleted', repository);
            $state.go('docker.images.image', { id: $transition$.params().id }, { reload: true });
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove image');
        });
    };

    $scope.removeImage = function (id) {
      ImageService.deleteImage(id, false)
        .then(function success() {
          Notifications.success('Image successfully deleted', id);
          $state.go('docker.images', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove image');
        });
    };

    function exportImage(image) {
      HttpRequestHelper.setPortainerAgentTargetHeader(image.NodeName);
      $scope.state.exportInProgress = true;
      ImageService.downloadImages([image])
        .then(function success(data) {
          var downloadData = new Blob([data.file], { type: 'application/x-tar' });
          FileSaver.saveAs(downloadData, 'images.tar');
          Notifications.success('Image successfully downloaded');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to download image');
        })
        .finally(function final() {
          $scope.state.exportInProgress = false;
        });
    }

    $scope.exportImage = function (image) {
      if (image.RepoTags.length === 0 || _.includes(image.RepoTags, '<none>')) {
        Notifications.warning('', 'Cannot download a untagged image');
        return;
      }

      ModalService.confirmImageExport(function (confirmed) {
        if (!confirmed) {
          return;
        }
        exportImage(image);
      });
    };

    async function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);

      try {
        $scope.registries = await RegistryService.loadRegistriesForDropdown(endpoint.Id);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to load registries');
      }

      $q.all({
        image: ImageService.image($transition$.params().id),
        history: ImageService.history($transition$.params().id),
      })
        .then(function success(data) {
          $scope.image = data.image;
          $scope.history = data.history;
          $scope.image.Env = _.sortBy($scope.image.Env, _.toLower);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve image details');
          $state.go('docker.images');
        });
    }

    initView();
  },
]);
