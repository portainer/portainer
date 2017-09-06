angular.module('extension.storidge')
.controller('StoridgeProfilesController', ['$q', '$scope', '$state', 'Notifications', 'Pagination', 'StoridgeProfileService',
function ($q, $scope, $state, Notifications, Pagination, StoridgeProfileService) {

  $scope.state = {
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('storidge_profiles')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.formValues = {
    Name: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('profiles', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredProfiles, function (profile) {
      if (profile.Checked !== allSelected) {
        profile.Checked = allSelected;
        $scope.selectItem(profile);
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

  $scope.remove = function() {
    Notifications.success('Profile successfully removed');
  };

  $scope.createProfile = function() {
    $('#createResourceSpinner').show();
    var model = new StoridgeProfileDefaultModel();
    model.Name = $scope.formValues.Name;

    StoridgeProfileService.create(model)
    .then(function success(data) {
      Notifications.success('Profile successfully created');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create profile');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();

    StoridgeProfileService.profiles()
    .then(function success(data) {
      $scope.profiles = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve profiles');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
