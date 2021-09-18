import _ from 'lodash-es';
import { RegistryTypes } from 'Portainer/models/registryTypes';

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
      const regAttrMsg = selectedItems.length > 1 ? 'hese' : 'his';
      const registriesMsg = selectedItems.length > 1 ? 'registries' : 'registry';
      const msg = `T${regAttrMsg} ${registriesMsg} might be used by applications inside one or more environments. Removing the ${registriesMsg} could lead to a service interruption for the applications using t${regAttrMsg} ${registriesMsg}. Do you want to remove the selected ${registriesMsg}?`;

      ModalService.confirmDeletion(msg, function onConfirm(confirmed) {
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
          $scope.registries = data.registries;
        })
        .catch(function error(err) {
          $scope.registries = [];
          Notifications.error('Failure', err, 'Unable to retrieve registries');
        });
    }

    initView();
  },
]);
