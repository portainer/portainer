angular.module('portainer.app')
  .controller('RegistryRepositoryController', ['$q', '$scope', '$transition$', '$state', 'LocalRegistryService', 'RegistryService', 'LocalRegistryHelper', 'ModalService', 'Notifications',
    function ($q, $scope, $transition$, $state, LocalRegistryService, RegistryService, LocalRegistryHelper, ModalService, Notifications) {

      $scope.state = {
        actionInProgress: false
      };
      $scope.formValues = {
        Tag: ''
      };
      $scope.tags = [];
      $scope.repository = {
        Name: [],
        Tags: [],
        Images: []
      };

      $scope.$watch('tags.length', function () {
        console.log('watch');
        var images = $scope.tags.map(function (item) {
          return item.ImageId;
        });
        $scope.repository.Images = _.uniq(images);
      });

      $scope.addTag = function () {
        var manifest = $scope.tags.find(function (item) {
          return item.ImageId === $scope.formValues.SelectedImage;
        }).ManifestV2;
        LocalRegistryService.addTag($scope.registryId, $scope.repository.Name, $scope.formValues.Tag, manifest)
          .then(function success(data) {
            Notifications.success('Success', 'Tag successfully added');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to add tag');
          });
      };

      $scope.retagAction = function (tag) {
        LocalRegistryService.deleteManifest($scope.registryId, $scope.repository.Name, tag.Digest)
          .then(function success() {
            var promises = [];
            var tagsToAdd = $scope.tags.filter(function (item) {
              return item.Digest === tag.Digest;
            });
            tagsToAdd.map(function (item) {
              var tagValue = item.Modified && item.Name !== item.NewName ? item.NewName : item.Name;
              promises.push(LocalRegistryService.addTag($scope.registryId, $scope.repository.Name, tagValue, item.ManifestV2));
            });
            return $q.all(promises);
          })
          .then(function success() {
            Notifications.success('Success', 'Tag successfully modified');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to modify tag');
            tag.Modified = false;
            tag.NewValue = tag.Value;
          });
      };

      // $scope.removeTags = function (selectedItems) {
      //   ModalService.confirmDeletion(
      //     'Are you sure you want to remove the selected tags ?',
      //     function onConfirm(confirmed) {
      //       if (!confirmed) {
      //         return;
      //       }
      //       var promises = [];
      //       var uniqItems = _.uniqBy(selectedItems, 'Digest');
      //       uniqItems.map(function (item) {
      //         promises.push(LocalRegistryService.deleteManifest($scope.registryId, $scope.image.Name, item.Digest));
      //       });
      //       $q.all(promises)
      //         .then(function success() {
      //           var promises = [];
      //           var tagsToReupload = _.differenceBy($scope.image.Tags, selectedItems, 'Value');
      //           tagsToReupload.map(function (item) {
      //             promises.push(LocalRegistryService.addTag($scope.registryId, $scope.image.Name, item.Value, $scope.image.ManifestV2));
      //           });
      //           return $q.all(promises);
      //         })
      //         .then(function success(data) {
      //           Notifications.success('Success', 'Tags successfully deleted');
      //           $state.reload();
      //         })
      //         .catch(function error(err) {
      //           Notifications.error('Failure', err, 'Unable to delete tags');
      //         });
      //     });
      // };

      // $scope.removeImage = function () {
      //   ModalService.confirmDeletion(
      //     'This action will only remove the manifests linked to this image. You need to manually trigger a garbage collector pass on your registry to remove orphan layers and really remove the image content.',
      //     function onConfirm(confirmed) {
      //       if (!confirmed) {
      //         return;
      //       }
      //       LocalRegistryService.deleteManifest($scope.registryId, $scope.image.Name, $scope.image.Digest)
      //         .then(function success(data) {
      //           Notifications.success('Success', 'Image sucessfully removed');
      //           $state.go('portainer.registries.registry.images', {
      //             id: $scope.registryId
      //           }, {
      //             reload: true
      //           });
      //         }).catch(function error(err) {
      //           Notifications.error('Failure', err, 'Unable to delete image');
      //         });
      //     }
      //   );
      // };

      function initView() {
        var registryId = $scope.registryId = $transition$.params().id;
        var repository = $scope.repository.Name = $transition$.params().repository;
        $q.all({
            registry: RegistryService.registry(registryId),
            tags: LocalRegistryService.tags(registryId, repository)
          })
          .then(function success(data) {
            $scope.registry = data.registry;
            $scope.repository.Tags = data.tags;
            $scope.tags = [];
            for (var i = 0; i < data.tags.length; i++) {
              var tag = data.tags[i];
              LocalRegistryService.tag(registryId, repository, tag)
                .then(function success(data) {
                  $scope.tags.push(data);
                })
                .catch(function error(err) {
                  Notifications.error('Failure', err, 'Unable to retrieve tag information');
                });
            }
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve repository information');
          });
      }

      initView();
    }
  ]);