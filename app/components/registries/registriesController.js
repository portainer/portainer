angular.module('registries', [])
.controller('RegistriesController', ['$scope', '$state', 'RegistryService', 'ModalService', 'Notifications', 'Pagination',
function ($scope, $state, RegistryService, ModalService, Notifications, Pagination) {

  $scope.state = {
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('registries')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = true;

  $scope.formValues = {
    Name: '',
    URL: '',
    Authentication: false,
    Username: '',
    Password: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredRegistries, function (registry) {
      if (registry.Checked !== allSelected) {
        registry.Checked = allSelected;
        $scope.selectItem(registry);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function() {
    ModalService.confirmDeletion(
      'Do you want to remove the selected registries?',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeRegistries();
      }
    );
  };

  function removeRegistries() {
    $('#loadingViewSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadingViewSpinner').hide();
      }
    };

    var registries = $scope.registries;
    angular.forEach(registries, function (registry) {
      if (registry.Checked) {
        counter = counter + 1;
        RegistryService.deleteRegistry(registry.Id)
        .then(function success(data) {
          var index = registries.indexOf(registry);
          registries.splice(index, 1);
          Notifications.success('Registry deleted', registry.Name);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove registry');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  }

  $scope.addRegistry = function() {
    $('#createRegistrySpinner').show();
    var registryName = $scope.formValues.Name;
    var registryURL = $scope.formValues.URL;
    var authentication = $scope.formValues.Authentication;
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;
    RegistryService.createRegistry(registryName, registryURL, authentication, username, password)
    .then(function success(data) {
      Notifications.success('Registry successfully created');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create registry');
    })
    .finally(function final() {
      $('#createRegistrySpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    RegistryService.registries()
    .then(function success(data) {
      $scope.registries = data;
    })
    .catch(function error(err) {
      $scope.registries = [];
      Notifications.error('Failure', err, 'Unable to retrieve registries');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
