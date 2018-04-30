angular.module('portainer.azure')
.controller('AzureCreateContainerInstanceController', ['$q', '$scope', '$state', 'SubscriptionService', 'ContainerGroupService', 'AzureResourceService', 'Notifications',
function ($q, $scope, $state, SubscriptionService, ContainerGroupService, AzureResourceService, Notifications) {

  $scope.state = {
    actionInProgress: false,
    selectedSubscription: null,
    selectedResourceGroup: null
  };

  $scope.create = function() {
    var model = $scope.model;
    var subscriptionId = $scope.state.selectedSubscription.Id;
    var resourceGroupName = $scope.state.selectedResourceGroup.Name;

    $scope.state.actionInProgress = true;
    ContainerGroupService.create(model, subscriptionId, resourceGroupName)
    .then(function success(data) {
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

  $scope.addPortBinding = function() {
    $scope.model.Ports.push({ host: '', container: '', protocol: 'TCP' });
  };

  $scope.removePortBinding = function(index) {
    $scope.model.Ports.splice(index, 1);
  };

  function initView() {
    var model = new ContainerGroupDefaultModel();

    $q.all({
      subscriptions: SubscriptionService.subscriptions(),
      resourceGroups: AzureResourceService.resourceGroups(),
      locations: AzureResourceService.locations()
    })
    .then(function success(data) {
      var subscriptions = data.subscriptions;
      var resourceGroups = data.resourceGroups;
      var locations = data.locations;

      // TODO: resource groups and locations should be based on the selected subscription.
      // Should be updated when the subscription is changed as well.

      $scope.state.selectedSubscription = subscriptions[0];
      $scope.state.selectedResourceGroup = resourceGroups[0];
      model.Location = locations[0].Name;

      $scope.subscriptions = subscriptions;
      $scope.resourceGroups = resourceGroups;
      $scope.locations = locations;
      $scope.model = model;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve Azure resources');
    });
  }

  initView();
}]);
