import { ContainerGroupDefaultModel } from '../../../models/container_group';

angular.module('portainer.azure').controller('AzureCreateContainerInstanceController', [
  '$q',
  '$scope',
  '$state',
  'AzureService',
  'Notifications',
  function ($q, $scope, $state, AzureService, Notifications) {
    var allResourceGroups = [];
    var allProviders = [];
    let allNetworkProfiles = [];

    $scope.state = {
      actionInProgress: false,
      selectedSubscription: null,
      selectedResourceGroup: null,
    };

    $scope.changeSubscription = function () {
      var selectedSubscription = $scope.state.selectedSubscription;
      updateSubscriptionResources(selectedSubscription, allResourceGroups, allProviders);
    };

    $scope.addPortBinding = function () {
      $scope.model.Ports.push({ host: '', container: '', protocol: 'TCP' });
    };

    $scope.removePortBinding = function (index) {
      $scope.model.Ports.splice(index, 1);
    };

    $scope.create = function () {
      var model = $scope.model;
      var subscriptionId = $scope.state.selectedSubscription.Id;
      var resourceGroupName = $scope.state.selectedResourceGroup.Name;

      $scope.state.actionInProgress = true;
      AzureService.createContainerGroup(model, subscriptionId, resourceGroupName)
        .then(function success() {
          Notifications.success('Container successfully created', model.Name);
          $state.go('azure.containerinstances');
        })
        .catch(function error(err) {
          err = err.data ? err.data.error : err;
          Notifications.error('Failure', err, 'Unable to create container');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function updateSubscriptionResources(subscription, resourceGroups, providers, networkProfiles) {
      $scope.state.selectedResourceGroup = resourceGroups[subscription.Id][0];
      $scope.resourceGroups = resourceGroups[subscription.Id];

      var currentSubLocations = providers[subscription.Id].Locations;
      $scope.model.Location = currentSubLocations[0];
      $scope.locations = currentSubLocations;

      $scope.networkProfiles = networkProfiles[subscription.Id];
      const hasNetworks = $scope.networkProfiles.length > 0;
      $scope.model.Network = hasNetworks ? $scope.networkProfiles[0].Id : null;
      $scope.hasNetworks = hasNetworks;
    }

    function initView() {
      var model = new ContainerGroupDefaultModel();

      AzureService.subscriptions()
        .then(function success(data) {
          var subscriptions = data;
          $scope.state.selectedSubscription = subscriptions[0];
          $scope.subscriptions = subscriptions;

          return $q.all({
            resourceGroups: AzureService.resourceGroups(subscriptions),
            containerInstancesProviders: AzureService.containerInstanceProvider(subscriptions),
            networkProfiles: AzureService.networkProfiles(subscriptions),
          });
        })
        .then(function success(data) {
          var resourceGroups = data.resourceGroups;
          allResourceGroups = resourceGroups;

          var containerInstancesProviders = data.containerInstancesProviders;
          allProviders = containerInstancesProviders;

          allNetworkProfiles = data.networkProfiles;

          $scope.model = model;

          var selectedSubscription = $scope.state.selectedSubscription;
          updateSubscriptionResources(selectedSubscription, resourceGroups, containerInstancesProviders, allNetworkProfiles);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve Azure resources');
        });
    }

    initView();
  },
]);
