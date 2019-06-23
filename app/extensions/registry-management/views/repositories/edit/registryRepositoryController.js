import _ from 'lodash-es';
import RepositoryTagViewModel from '../../../models/repositoryTag';

angular.module('portainer.app')
  .controller('RegistryRepositoryController', ['$q', '$async', '$scope', '$transition$', '$state', 'RegistryV2Service', 'RegistryService', 'ModalService', 'Notifications',
    function ($q, $async, $scope, $transition$, $state, RegistryV2Service, RegistryService, ModalService, Notifications) {

      $scope.state = {
        actionInProgress: false,
        loading: false,
        imageRetrieval: {
          running: false,
          progression: 0,
          asyncIterator: null
        }
      };
      $scope.formValues = {
        Tag: ''
      };
      $scope.tags = [];
      $scope.backgroundTags = [];
      $scope.repository = {
        Name: [],
        Tags: [],
        Images: []
      };

      $scope.test = function() {
        return $async($scope.asyncTest);
      }

      $scope.asyncTest = async function() {
        $scope.state.imageRetrieval.running = true;
        $scope.state.imageRetrieval.asyncIterator = RegistryV2Service.test($scope.registryId, $scope.repository.Name, $scope.repository.Tags);
        for await (const partialResult of $scope.state.imageRetrieval.asyncIterator) { 
          if (typeof partialResult === 'number') {
            $scope.state.imageRetrieval.progression = partialResult;
          } else {
            $scope.backgroundTags = partialResult;
          }
        }
        $scope.state.imageRetrieval.running = false;
        console.log('end of loop', $scope.backgroundTags);
      };

      // $scope.test = async function() {
      //   const startTime = Date.now();
      //   let steps = 100;
      //   $scope.state.imageRetrieval.running = true;
      //   let start = $scope.state.imageRetrieval.start = 0;
      //   let end = $scope.state.imageRetrieval.end = $scope.state.imageRetrieval.start + steps;
      //   let max = $scope.state.imageRetrieval.max = $scope.repository.Tags.length;
      //   while (start < max) {
      //     const tags = _.slice($scope.repository.Tags, start, end);
      //     for await (const partialResult of RegistryV2Service.test($scope.registryId, $scope.repository.Name, tags)) {
      //       $scope.backgroundTags = partialResult;
      //     }
      //     start = $scope.state.imageRetrieval.start = $scope.state.imageRetrieval.end;
      //     end = $scope.state.imageRetrieval.end = start + steps;
      //   }
      //   $scope.state.imageRetrieval.running = false;
      //   const endTime = Date.now();
      //   console.log('elapsed time', endTime - startTime);
      //   console.log($scope.tags);
      // };

      $scope.paginationAction = function (tags) {
        $scope.state.loading = true;
        RegistryV2Service.getTagsDetails($scope.registryId, $scope.repository.Name, tags)
        .then(function success(data) {
          for (var i = 0; i < data.length; i++) {
            var idx = _.findIndex($scope.tags, {'Name': data[i].Name});
            if (idx !== -1) {
              $scope.tags[idx] = data[i];
            }
          }
          $scope.state.loading = false;
        }).catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve tags details');
        });
      };

      $scope.$watchCollection('tags', function () {
        var images = $scope.tags.map(function (item) {
          return item.ImageId;
        });
        $scope.repository.Images = _.without(_.uniq(images), '');
      });

      $scope.addTag = function () {
        var manifest = $scope.tags.find(function (item) {
          return item.ImageId === $scope.formValues.SelectedImage;
        }).ManifestV2;
        RegistryV2Service.addTag($scope.registryId, $scope.repository.Name, $scope.formValues.Tag, manifest)
          .then(function success() {
            Notifications.success('Success', 'Tag successfully added');
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to add tag');
          });
      };

      $scope.retagAction = function (tag) {
        RegistryV2Service.deleteManifest($scope.registryId, $scope.repository.Name, tag.Digest)
          .then(function success() {
            var promises = [];
            var tagsToAdd = $scope.tags.filter(function (item) {
              return item.Digest === tag.Digest;
            });
            tagsToAdd.map(function (item) {
              var tagValue = item.Modified && item.Name !== item.NewName ? item.NewName : item.Name;
              promises.push(RegistryV2Service.addTag($scope.registryId, $scope.repository.Name, tagValue, item.ManifestV2));
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
              promises.push(RegistryV2Service.deleteManifest($scope.registryId, $scope.repository.Name, item.Digest));
            });
            $q.all(promises)
              .then(function success() {
                var promises = [];
                var tagsToReupload = _.differenceBy($scope.tags, selectedItems, 'Name');
                tagsToReupload.map(function (item) {
                  promises.push(RegistryV2Service.addTag($scope.registryId, $scope.repository.Name, item.Name, item.ManifestV2));
                });
                return $q.all(promises);
              })
              .then(function success(data) {
                Notifications.success('Success', 'Tags successfully deleted');
                if (data.length === 0) {
                  $state.go('portainer.registries.registry.repositories', {
                    id: $scope.registryId
                  }, {
                    reload: true
                  });
                } else {
                  $state.reload();
                }
              })
              .catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to delete tags');
              });
          });
      };

      $scope.removeRepository = function () {
        ModalService.confirmDeletion(
          'This action will only remove the manifests linked to this repository. You need to manually trigger a garbage collector pass on your registry to remove orphan layers and really remove the images content. THIS ACTION CAN NOT BE UNDONE',
          function onConfirm(confirmed) {
            if (!confirmed) {
              return;
            }
            var promises = [];
            var uniqItems = _.uniqBy($scope.tags, 'Digest');
            uniqItems.map(function (item) {
              promises.push(RegistryV2Service.deleteManifest($scope.registryId, $scope.repository.Name, item.Digest));
            });
            $q.all(promises)
              .then(function success() {
                Notifications.success('Success', 'Repository sucessfully removed');
                $state.go('portainer.registries.registry.repositories', {
                  id: $scope.registryId
                }, {
                  reload: true
                });
              }).catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to delete repository');
              });
          }
        );
      };

      async function initView() {
        var registryId = $scope.registryId = $transition$.params().id;
        var repository = $scope.repository.Name = $transition$.params().repository;
        try {
          const data = await $q.all({
            registry: RegistryService.registry(registryId),
            tags: RegistryV2Service.tags(registryId, repository)
          });
          $scope.registry = data.registry;
          $scope.repository.Tags = [].concat(data.tags || []).sort();
          for (var i = 0; i < $scope.repository.Tags.length; i++) {
            $scope.tags.push(new RepositoryTagViewModel($scope.repository.Tags[i]));
          }
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to retrieve repository information');
        }
      }

      // TODO: refactor this to class to can have controllers lifecycle hooks

      // $scope.$on('destroy', () => {
      //   console.log('destroyedddddddddd');
      //   $scope.state.imageRetrieval.asyncIterator.return();
      // });

      // this.$onDestroy = function() {
      //   console.log('destroying');
      //   $scope.state.imageRetrieval.asyncIterator.return();
      // };

      this.$onInit = function() {
        $async(initView)
        .then(() => $scope.test());
      };
    }
  ]);
