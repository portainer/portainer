import _ from 'lodash-es';
import { RepositoryTagViewModel, RepositoryShortTag } from '../../../models/repositoryTag';

angular.module('portainer.app')
  .controller('RegistryRepositoryController', ['$q', '$async', '$scope', '$transition$', '$state', 'RegistryV2Service', 'RegistryService', 'ModalService', 'Notifications',
    function ($q, $async, $scope, $transition$, $state, RegistryV2Service, RegistryService, ModalService, Notifications) {

      $scope.state = {
        actionInProgress: false,
        loading: false,
        tagsRetrieval: {
          auto: true,
          running: false,
          limit: 500,
          progression: 0,
          elapsedTime: 0,
          asyncGenerator: null
        }
      };
      $scope.formValues = {
        Tag: ''
      };
      $scope.tags = [];
      $scope.short = {
        Tags: [],
        Images: []
      };
      $scope.repository = {
        Name: [],
        Tags: [],
      };

      $scope.createAsyncGenerator = function () {
        $scope.state.tagsRetrieval.asyncGenerator =
          RegistryV2Service.shortTagsWithProgression($scope.registryId, $scope.repository.Name, $scope.repository.Tags);
      };

      function resetTagsRetrievalState() {
        $scope.state.tagsRetrieval.running = false;
        $scope.state.tagsRetrieval.progression = 0;
        $scope.state.tagsRetrieval.elapsedTime = 0;
      }

      function computeImages() {
        const images = _.map($scope.short.Tags, 'ImageId');
        $scope.short.Images = _.without(_.uniq(images), '');
      }

      $scope.startStopRetrieval = function () {
        if ($scope.state.tagsRetrieval.running) {
          $scope.state.tagsRetrieval.asyncGenerator.return();
        } else {
          $scope.retrieveTags().then(() => {
            $scope.createAsyncGenerator();
            if ($scope.short.Tags.length === 0) {
              resetTagsRetrievalState();
            } else {
              computeImages();
            }
          });
        }
      };

      $scope.retrieveTags = function() {
        return $async(retrieveTagsAsync);
      }

      async function retrieveTagsAsync() {
        $scope.state.tagsRetrieval.running = true;
        const startTime = Date.now();
        for await (const partialResult of $scope.state.tagsRetrieval.asyncGenerator) { 
          if (typeof partialResult === 'number') {
            $scope.state.tagsRetrieval.progression = partialResult;
            $scope.state.tagsRetrieval.elapsedTime = Date.now() - startTime;
          } else {
            $scope.short.Tags = partialResult;
          }
        }
        $scope.state.tagsRetrieval.running = false;
      }

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

      $scope.addTag = function () {
        const tag = $scope.short.Tags.find((item) => item.ImageId === $scope.formValues.SelectedImage);
        const manifest = tag.ManifestV2;
        RegistryV2Service.addTag($scope.registryId, $scope.repository.Name, $scope.formValues.Tag, manifest)
          .then(function success() {
            Notifications.success('Success', 'Tag successfully added');
            $scope.short.Tags.push(new RepositoryShortTag($scope.formValues.Tag, tag.ImageId, tag.ImageDigest, tag.ManifestV2));
            return $async(loadRepositoryDetails);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to add tag');
          });
      };

      async function retagActionAsync() {
        try {
          const modifiedTags = _.filter($scope.tags, (item) => item.Modified === true);
          const modifiedDigests = _.uniq(_.map(modifiedTags, 'ImageDigest'));

          const impactedTags = _.filter($scope.short.Tags, (item) => _.includes(modifiedDigests, item.ImageDigest));

          const deletePromises = [];
          _.map(modifiedDigests, (item) => deletePromises.push(RegistryV2Service.deleteManifest($scope.registryId, $scope.repository.Name, item)));
          await Promise.all(deletePromises);

          const addPromises = [];
          _.map(impactedTags, (item) => {
            const tagFromTable = _.find(modifiedTags, { 'Name': item.Name });
            const name = tagFromTable && tagFromTable.Name !== tagFromTable.NewName ? tagFromTable.NewName : item.Name;
            addPromises.push(RegistryV2Service.addTag($scope.registryId, $scope.repository.Name, name, item.ManifestV2))
          });
          await Promise.all(addPromises);
          Notifications.success('Success', 'Tags successfully renamed');

          _.map(modifiedTags, (item) => {
            const idx = _.findIndex($scope.short.Tags, (i) => i.Name === item.Name);
            $scope.short.Tags[idx].Name = item.NewName;
          });
          await loadRepositoryDetails();
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to rename tags');
        }
      }

      $scope.retagAction = function() {
        return $async(retagActionAsync);
      }

      // TODO: FIX TO WORK WITH PAGINATION AND LARGE REPOSITORIES
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

      async function loadRepositoryDetails() {
        try {
          const registryId = $scope.registryId;
          const repository = $scope.repository.Name;
          const tags = await RegistryV2Service.tags(registryId, repository)
          $scope.tags = [];
          $scope.repository.Tags = _.sortBy(_.concat([], tags || []), 'Name');
          _.map($scope.repository.Tags, (item) => $scope.tags.push(new RepositoryTagViewModel(item)));
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to retrieve tags details');
        }
      }

      async function initView() {
        try {
          const registryId = $scope.registryId = $transition$.params().id;
          $scope.repository.Name = $transition$.params().repository;

          $scope.registry = await RegistryService.registry(registryId);
          await loadRepositoryDetails();
          if ($scope.repository.Tags.length > $scope.state.tagsRetrieval.limit) {
            $scope.state.tagsRetrieval.auto = false;
          }
          $scope.createAsyncGenerator();
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to retrieve repository information');
        }
      }

      $scope.$on('$destroy', () => {
        $scope.state.tagsRetrieval.asyncGenerator.return();
      });

      this.$onInit = function() {
        $async(initView)
        .then(() => {
          if ($scope.state.tagsRetrieval.auto) {
            $scope.startStopRetrieval();
          }
        });
      };
    }
  ]);