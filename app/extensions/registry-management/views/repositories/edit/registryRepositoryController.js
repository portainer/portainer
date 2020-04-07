import _ from 'lodash-es';
import { RepositoryTagViewModel, RepositoryShortTag } from '../../../models/repositoryTag';

angular.module('portainer.app')
  .controller('RegistryRepositoryController', ['$q', '$async', '$scope', '$uibModal', '$interval', '$transition$', '$state', 'RegistryServiceSelector', 'RegistryService', 'ModalService', 'Notifications', 'ImageHelper',
    function ($q, $async, $scope, $uibModal, $interval, $transition$, $state, RegistryServiceSelector, RegistryService, ModalService, Notifications, ImageHelper) {

      $scope.state = {
        actionInProgress: false,
        loading: false,
        tagsRetrieval: {
          auto: true,
          running: false,
          limit: 100,
          progression: 0,
          elapsedTime: 0,
          asyncGenerator: null,
          clock: null
        },
        tagsRetag: {
          running: false,
          progression: 0,
          elapsedTime: 0,
          asyncGenerator: null,
          clock: null
        },
        tagsDelete: {
          running: false,
          progression: 0,
          elapsedTime: 0,
          asyncGenerator: null,
          clock: null
        },
      };
      $scope.formValues = {
        Tag: '' // new tag name on add feature
      };
      $scope.tags = []; // RepositoryTagViewModel (for datatable)
      $scope.short = {
        Tags: [], // RepositoryShortTag
        Images: [] // strings extracted from short.Tags
      };
      $scope.repository = {
        Name: '',
        Tags: [], // string list
      };

      function toSeconds(time) {
        return time / 1000;
      }
      function toPercent(progress, total) {
        return (progress / total * 100).toFixed();
      }

      function openModal(resolve) {
        return $uibModal.open({
          component: 'progressionModal',
          backdrop: 'static',
          keyboard: false,
          resolve: resolve
        });
      }

      $scope.paginationAction = function (tags) {
        $scope.state.loading = true;
        RegistryServiceSelector.getTagsDetails($scope.registry, $scope.repository.Name, tags)
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

      /**
       * RETRIEVAL SECTION
       */
      function updateRetrievalClock(startTime) {
        $scope.state.tagsRetrieval.elapsedTime = toSeconds(Date.now() - startTime);
      }

      function createRetrieveAsyncGenerator() {
        $scope.state.tagsRetrieval.asyncGenerator =
          RegistryServiceSelector.shortTagsWithProgress($scope.registry, $scope.repository.Name, $scope.repository.Tags);
      }

      function resetTagsRetrievalState() {
        $scope.state.tagsRetrieval.running = false;
        $scope.state.tagsRetrieval.progression = 0;
        $scope.state.tagsRetrieval.elapsedTime = 0;
        $scope.state.tagsRetrieval.clock = null;
      }

      function computeImages() {
        const images = _.map($scope.short.Tags, 'ImageId');
        $scope.short.Images = _.without(_.uniq(images), '');
      }

      $scope.startStopRetrieval = function () {
        if ($scope.state.tagsRetrieval.running) {
          $scope.state.tagsRetrieval.asyncGenerator.return();
          $interval.cancel($scope.state.tagsRetrieval.clock);
        } else {
          retrieveTags().then(() => {
            createRetrieveAsyncGenerator();
            if ($scope.short.Tags.length === 0) {
              resetTagsRetrievalState();
            } else {
              computeImages();
            }
          });
        }
      };

      function retrieveTags() {
        return $async(retrieveTagsAsync);
      }

      async function retrieveTagsAsync() {
        $scope.state.tagsRetrieval.running = true;
        const startTime = Date.now();
        $scope.state.tagsRetrieval.clock = $interval(updateRetrievalClock, 1000, 0, true, startTime);
        for await (const partialResult of $scope.state.tagsRetrieval.asyncGenerator) {
          if (typeof partialResult === 'number') {
            $scope.state.tagsRetrieval.progression = toPercent(partialResult, $scope.repository.Tags.length);
          } else {
            $scope.short.Tags = _.sortBy(partialResult, 'Name');
          }
        }
        $scope.state.tagsRetrieval.running = false;
        $interval.cancel($scope.state.tagsRetrieval.clock);
      }
      /**
       * !END RETRIEVAL SECTION
       */

      /**
       * ADD TAG SECTION
       */

      async function addTagAsync() {
        try {
          $scope.state.actionInProgress = true;
          if (!ImageHelper.isValidTag($scope.formValues.Tag)) {
            throw {msg: 'Invalid tag pattern, see info for more details on format.'}
          }
          const tag = $scope.short.Tags.find((item) => item.ImageId === $scope.formValues.SelectedImage);
          const manifest = tag.ManifestV2;
          await RegistryServiceSelector.addTag($scope.registry, $scope.repository.Name, $scope.formValues.Tag, manifest)

          Notifications.success('Success', 'Tag successfully added');
          $scope.short.Tags.push(new RepositoryShortTag($scope.formValues.Tag, tag.ImageId, tag.ImageDigest, tag.ManifestV2));

          await loadRepositoryDetails();
          $scope.formValues.Tag = '';
          delete $scope.formValues.SelectedImage;
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to add tag');
        } finally {
          $scope.state.actionInProgress = false;
        }
      }

      $scope.addTag = function () {
        return $async(addTagAsync);
      };
      /**
       * !END ADD TAG SECTION
       */

      /**
       * RETAG SECTION
       */
      function updateRetagClock(startTime) {
        $scope.state.tagsRetag.elapsedTime = toSeconds(Date.now() - startTime);
      }

      function createRetagAsyncGenerator(modifiedTags, modifiedDigests, impactedTags) {
        $scope.state.tagsRetag.asyncGenerator =
          RegistryServiceSelector.retagWithProgress($scope.registry, $scope.repository.Name, modifiedTags, modifiedDigests, impactedTags);
      }

      async function retagActionAsync() {
        let modal = null;
        try {
          $scope.state.tagsRetag.running = true;

          const modifiedTags = _.filter($scope.tags, (item) => item.Modified === true);
          for (const tag of modifiedTags) {
            if (!ImageHelper.isValidTag(tag.NewName)) {
              throw {msg: 'Invalid tag pattern, see info for more details on format.'}
            }
          }
          modal = await openModal({
            message: () => 'Retag is in progress! Closing your browser or refreshing the page while this operation is in progress will result in loss of tags.',
            progressLabel: () => 'Retag progress',
            context: () => $scope.state.tagsRetag
          });
          const modifiedDigests = _.uniq(_.map(modifiedTags, 'ImageDigest'));
          const impactedTags = _.filter($scope.short.Tags, (item) => _.includes(modifiedDigests, item.ImageDigest));

          const totalOps = modifiedDigests.length + impactedTags.length;

          createRetagAsyncGenerator(modifiedTags, modifiedDigests, impactedTags);

          const startTime = Date.now();
          $scope.state.tagsRetag.clock = $interval(updateRetagClock, 1000, 0, true, startTime);
          for await (const partialResult of $scope.state.tagsRetag.asyncGenerator) {
            if (typeof partialResult === 'number') {
              $scope.state.tagsRetag.progression = toPercent(partialResult, totalOps);
            }
          }

          _.map(modifiedTags, (item) => {
            const idx = _.findIndex($scope.short.Tags, (i) => i.Name === item.Name);
            $scope.short.Tags[idx].Name = item.NewName;
          });

          Notifications.success('Success', 'Tags successfully renamed');

          await loadRepositoryDetails();
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to rename tags');
        } finally {
          $interval.cancel($scope.state.tagsRetag.clock);
          $scope.state.tagsRetag.running = false;
          if (modal) {
            modal.close();
          }
        }
      }

      $scope.retagAction = function() {
        return $async(retagActionAsync);
      }
      /**
       * !END RETAG SECTION
       */

      /**
       * REMOVE TAGS SECTION
       */

      function updateDeleteClock(startTime) {
        $scope.state.tagsDelete.elapsedTime = toSeconds(Date.now() - startTime);
      }

      function createDeleteAsyncGenerator(modifiedDigests, impactedTags) {
        $scope.state.tagsDelete.asyncGenerator =
          RegistryServiceSelector.deleteTagsWithProgress($scope.registry, $scope.repository.Name, modifiedDigests, impactedTags);
      }

      async function removeTagsAsync(selectedTags) {
        let modal = null;
        try {
          $scope.state.tagsDelete.running = true;
          modal = await openModal({
            message: () => 'Tag delete is in progress! Closing your browser or refreshing the page while this operation is in progress will result in loss of tags.',
            progressLabel: () => 'Deletion progress',
            context: () => $scope.state.tagsDelete
          });

          const deletedTagNames = _.map(selectedTags, 'Name');
          const deletedShortTags = _.filter($scope.short.Tags, (item) => _.includes(deletedTagNames, item.Name));
          const modifiedDigests = _.uniq(_.map(deletedShortTags, 'ImageDigest'));
          const impactedTags = _.filter($scope.short.Tags, (item) => _.includes(modifiedDigests, item.ImageDigest));
          const tagsToKeep = _.without(impactedTags, ...deletedShortTags);

          const totalOps = modifiedDigests.length + tagsToKeep.length;

          createDeleteAsyncGenerator(modifiedDigests, tagsToKeep);

          const startTime = Date.now();
          $scope.state.tagsDelete.clock = $interval(updateDeleteClock, 1000, 0, true, startTime);
          for await (const partialResult of $scope.state.tagsDelete.asyncGenerator) {
            if (typeof partialResult === 'number') {
              $scope.state.tagsDelete.progression = toPercent(partialResult, totalOps);
            }
          }

          _.pull($scope.short.Tags, ...deletedShortTags);
          $scope.short.Images = _.map(_.uniqBy($scope.short.Tags, 'ImageId'), 'ImageId');

          Notifications.success('Success', 'Tags successfully deleted');

          if ($scope.short.Tags.length === 0) {
            $state.go('portainer.registries.registry.repositories', {id: $scope.registry.Id}, {reload: true});
          }
          await loadRepositoryDetails();
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to delete tags');
        } finally {
          $interval.cancel($scope.state.tagsDelete.clock);
          $scope.state.tagsDelete.running = false;
          modal.close();
        }
      }

      $scope.removeTags = function(selectedItems) {
        ModalService.confirmDeletion(
          'Are you sure you want to remove the selected tags ?',
          (confirmed) => {
            if (!confirmed) {
              return;
            }
            return $async(removeTagsAsync, selectedItems);
          });
      }
      /**
       * !END REMOVE TAGS SECTION
       */

      /**
       * REMOVE REPOSITORY SECTION
       */
      async function removeRepositoryAsync() {
        try {
          const digests = _.uniqBy($scope.short.Tags, 'ImageDigest');
          const promises = [];
          _.map(digests, (item) => promises.push(RegistryServiceSelector.deleteManifest($scope.registry, $scope.repository.Name, item.ImageDigest)));
          await Promise.all(promises);
          Notifications.success('Success', 'Repository sucessfully removed');
          $state.go('portainer.registries.registry.repositories', {id: $scope.registry.Id}, {reload: true});
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to delete repository');
        }
      }

      $scope.removeRepository = function () {
        ModalService.confirmDeletion(
          'This action will only remove the manifests linked to this repository. You need to manually trigger a garbage collector pass on your registry to remove orphan layers and really remove the images content. THIS ACTION CAN NOT BE UNDONE',
          function onConfirm(confirmed) {
            if (!confirmed) {
              return;
            }
            return $async(removeRepositoryAsync);
          }
        );
      };
      /**
       * !END REMOVE REPOSITORY SECTION
       */

      /**
       * INIT SECTION
       */
      async function loadRepositoryDetails() {
        try {
          const registry = $scope.registry;
          const repository = $scope.repository.Name;
          const tags = await RegistryServiceSelector.tags(registry, repository);
          $scope.tags = [];
          $scope.repository.Tags = [];
          $scope.repository.Tags = _.sortBy(_.concat($scope.repository.Tags, _.without(tags.tags, null)));
          _.map($scope.repository.Tags, (item) => $scope.tags.push(new RepositoryTagViewModel(item)));
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to retrieve tags details');
        }
      }

      async function initView() {
        try {
          const registryId = $transition$.params().id;
          $scope.repository.Name = $transition$.params().repository;
          $scope.state.loading = true;

          $scope.registry = await RegistryService.registry(registryId);
          await loadRepositoryDetails();
          if ($scope.repository.Tags.length > $scope.state.tagsRetrieval.limit) {
            $scope.state.tagsRetrieval.auto = false;
          }
          createRetrieveAsyncGenerator();
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to retrieve repository information');
        } finally {
          $scope.state.loading = false;
        }
      }

      $scope.$on('$destroy', () => {
        if ($scope.state.tagsRetrieval.asyncGenerator) {
          $scope.state.tagsRetrieval.asyncGenerator.return();
        }
        if ($scope.state.tagsRetrieval.clock) {
          $interval.cancel($scope.state.tagsRetrieval.clock);
        }
        if ($scope.state.tagsRetag.asyncGenerator) {
          $scope.state.tagsRetag.asyncGenerator.return();
        }
        if ($scope.state.tagsRetag.clock) {
          $interval.cancel($scope.state.tagsRetag.clock);
        }
        if ($scope.state.tagsDelete.asyncGenerator) {
          $scope.state.tagsDelete.asyncGenerator.return();
        }
        if ($scope.state.tagsDelete.clock) {
          $interval.cancel($scope.state.tagsDelete.clock);
        }
      });

      this.$onInit = function() {
        return $async(initView)
        .then(() => {
          if ($scope.state.tagsRetrieval.auto) {
            $scope.startStopRetrieval();
          }
        });
      };
      /**
       * !END INIT SECTION
       */
    }
  ]);