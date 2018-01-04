angular.module('extension.storidge')
.controller('StoridgeProfilesController', ['$q', '$scope', '$state', 'Notifications', 'PaginationService', 'StoridgeProfileService',
function ($q, $scope, $state, Notifications, PaginationService, StoridgeProfileService) {

  $scope.state = {
    selectedItemCount: 0
    // pagination_count: PaginationService.getPaginationCount('storidge_profiles')
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
    PaginationService.setPaginationCount('storidge_profiles', $scope.state.pagination_count);
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

  $scope.removeProfiles = function() {
    $('#loadingViewSpinner').show();

    var profiles = $scope.profiles;
    var deleteRequests = [];
    for (var i = 0; i < profiles.length; i++) {
      var profile = profiles[i];
      if (profile.Checked) {
        deleteRequests.push(StoridgeProfileService.delete(profile.Name));
      }
    }

    $q.all(deleteRequests)
    .then(function success(data) {
      Notifications.success('Selected profiles successfully removed');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured when deleting selected profiles');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.createProfile = function() {
    $('#createResourceSpinner').show();
    var model = new StoridgeProfileDefaultModel();
    model.Name = $scope.formValues.Name;
    model.Directory = model.Directory + model.Name;

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
