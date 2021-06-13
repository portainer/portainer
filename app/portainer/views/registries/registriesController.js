import _ from 'lodash-es';
import { RegistryTypes } from 'Portainer/models/registryTypes';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';

angular.module('portainer.app').controller('RegistriesController', [
  '$q',
  '$scope',
  '$state',
  'RegistryService',
  'ModalService',
  'Notifications',
  function ($q, $scope, $state, RegistryService, ModalService, Notifications) {
    $scope.state = {
      actionInProgress: false,
    };

    const nonBrowsableTypes = [RegistryTypes.ANONYMOUS, RegistryTypes.DOCKERHUB, RegistryTypes.QUAY];

    $scope.canBrowse = function (item) {
      return !_.includes(nonBrowsableTypes, item.Type);
    };

    $scope.removeAction = function (selectedItems) {
      ModalService.confirmDeletion('Do you want to remove the selected registries?', function onConfirm(confirmed) {
        if (!confirmed) {
          return;
        }
        deleteSelectedRegistries(selectedItems);
      });
    };

    function deleteSelectedRegistries(selectedItems) {
      var actionCount = selectedItems.length;
      angular.forEach(selectedItems, function (registry) {
        RegistryService.deleteRegistry(registry.Id)
          .then(function success() {
            Notifications.success('Registry successfully removed', registry.Name);
            var index = $scope.registries.indexOf(registry);
            $scope.registries.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove registry');
          })
          .finally(function final() {
            --actionCount;
            if (actionCount === 0) {
              $state.reload();
            }
          });
      });
    }

    function initView() {
      $q.all({
        registries: RegistryService.registries(),
      })
        .then(function success(data) {
          $scope.registries = _.concat(new DockerHubViewModel(), data.registries);
        })
        .catch(function error(err) {
          $scope.registries = [];
          Notifications.error('Failure', err, 'Unable to retrieve registries');
        });
    }

    initView();
  },
]);
