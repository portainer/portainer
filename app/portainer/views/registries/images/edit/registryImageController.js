angular.module('portainer.app')
  .controller('RegistryImageController', ['$q', '$scope', '$transition$', '$state', 'LocalRegistryService', 'RegistryService', 'LocalRegistryHelper', 'ModalService', 'Notifications',
    function ($q, $scope, $transition$, $state, LocalRegistryService, RegistryService, LocalRegistryHelper, ModalService, Notifications) {

      $scope.state = {
        actionInProgress: false
      };

      $scope.formValues = {
        Tag: ''
      };

      $scope.addTag = function () {
        LocalRegistryService.addTag($scope.registryId, $scope.image.Name, $scope.formValues.Tag, $scope.image.ManifestV2)
          .then(function success(data) {
            Notifications.success('Success', 'Tag successfully added');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to add tag');
          });
      };

      $scope.retagAction = function (tag) {
        var manifest = LocalRegistryHelper.imageToManifest($scope.image);
        manifest.tag = tag.Value;
        LocalRegistryService.deleteManifest($scope.registryId, $scope.image.Name, tag.Digest)
          .then(function success() {
            var promises = [];
            $scope.image.Tags.map(function (item) {
              var tagValue = item.Modified && item.Value !== item.NewValue ? item.NewValue : item.Value;
              promises.push(LocalRegistryService.addTag($scope.registryId, $scope.image.Name, tagValue, $scope.image.ManifestV2));
            });
            return $q.all(promises);
          })
          .then(function success() {
            Notifications.success('Tag successfully modified', 'New tag name: ' + tag.NewValue);
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to modify tag');
            tag.Modified = false;
            tag.NewValue = tag.Value;
          });
      };

      $scope.removeTags = function (selectedItems) {
        ModalService.confirmDeletion(
          'Are you sure you want to remove the selected tags ?',
          function onConfirm(confirmed) {
            if (!confirmed) {
              return;
            }
            var promises = [];
            var uniqItems = _.uniqBy(selectedItems, 'Digest');
            uniqItems.map(function (item) {
              promises.push(LocalRegistryService.deleteManifest($scope.registryId, $scope.image.Name, item.Digest));
            });
            $q.all(promises)
              .then(function success() {
                var promises = [];
                var tagsToReupload = _.differenceBy($scope.image.Tags, selectedItems, 'Value');
                tagsToReupload.map(function (item) {
                  promises.push(LocalRegistryService.addTag($scope.registryId, $scope.image.Name, item.Value, $scope.image.ManifestV2));
                });
                return $q.all(promises);
              })
              .then(function success(data) {
                Notifications.success('Success', 'Tags successfully deleted');
                $state.reload();
              })
              .catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to delete tags');
              });
          });
      };

      $scope.removeImage = function () {
        ModalService.confirmDeletion(
          'This action will only remove the manifests linked to this image. You need to manually trigger a garbage collector pass on your registry to remove orphan layers and really remove the image content.',
          function onConfirm(confirmed) {
            if (!confirmed) {
              return;
            }
            LocalRegistryService.deleteManifest($scope.registryId, $scope.image.Name, $scope.image.Digest)
              .then(function success(data) {
                Notifications.success('Success', 'Image sucessfully removed');
                $state.go('portainer.registries.registry.images', {
                  id: $scope.registryId
                }, {
                  reload: true
                });
              }).catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to delete image');
              });
          }
        );
      };

      function initView() {
        var registryId = $scope.registryId = $transition$.params().id;
        var repositoryName = $transition$.params().repository;
        var imageId = $transition$.params().imageId;

        $q.all({
            registry: RegistryService.registry(registryId),
            image: LocalRegistryService.repositoryImage(registryId, repositoryName, imageId)
          })
          .then(function success(data) {
            $scope.registry = data.registry;
            $scope.image = data.image;
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve image information');
          });
      }

      initView();
    }
  ]);