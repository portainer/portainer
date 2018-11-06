import { ContainerGroupDefaultModel } from '../../../models/container_group';

angular.module('portainer.azure')
.controller('AzureCreateContainerInstanceController', ['$q', '$scope', '$state', 'AzureService', 'Notifications',
function ($q, $scope, $state, AzureService, Notifications) {

  var allResourceGroups = [];
  var allProviders = [];

  $scope.state = {
    actionInProgress: false,
    selectedSubscription: null,
    selectedResourceGroup: null
  };

  $scope.changeSubscription = function() {
    var selectedSubscription = $scope.state.selectedSubscription;
    updateResourceGroupsAndLocations(selectedSubscription, allResourceGroups, allProviders);
  };

  $scope.addPortBinding = function() {
    $scope.model.Ports.push({ host: '', container: '', protocol: 'TCP' });
  };

  $scope.removePortBinding = function(index) {
    $scope.model.Ports.splice(index, 1);
  };

  $scope.create = function() {
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
      Notifications.error('Failure', err, 'Unable to create container');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function updateResourceGroupsAndLocations(subscription, resourceGroups, providers) {
    $scope.state.selectedResourceGroup = resourceGroups[subscription.Id][0];
    $scope.resourceGroups = resourceGroups[subscription.Id];

    var currentSubLocations = providers[subscription.Id].Locations;
    $scope.model.Location = currentSubLocations[0];
    $scope.locations = currentSubLocations;
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
        containerInstancesProviders: AzureService.containerInstanceProvider(subscriptions)
      });
    })
    .then(function success(data) {
      var resourceGroups = data.resourceGroups;
      allResourceGroups = resourceGroups;

      var containerInstancesProviders = data.containerInstancesProviders;
      allProviders = containerInstancesProviders;

      $scope.model = model;

      var selectedSubscription = $scope.state.selectedSubscription;
      updateResourceGroupsAndLocations(selectedSubscription, resourceGroups, containerInstancesProviders);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve Azure resources');
    });
  }

  initView();
}]);
