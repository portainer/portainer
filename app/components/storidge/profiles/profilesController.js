angular.module('extension.storidge')
.controller('StoridgeProfilesController', ['$q', '$scope', '$state', 'Notifications', 'Pagination',
function ($q, $scope, $state, Notifications, Pagination) {

  $scope.state = {
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('storidge_profiles')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  // $scope.formValues = {
  //   Name: '',
  //   Leaders: []
  // };

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

  function initView() {
    $('#loadingViewSpinner').show();
    $scope.profiles = [
      {
        Id: 1,
        Name: 'profileA'
      },
      {
        Id: 2,
        Name: 'profileB'
      }
    ];
    // var userDetails = Authentication.getUserDetails();
    // var isAdmin = userDetails.role === 1 ? true: false;
    // $scope.isAdmin = isAdmin;
    // $q.all({
    //   users: UserService.users(false),
    //   profiles: isAdmin ? ProfileService.profiles() : UserService.userLeadingProfiles(userDetails.ID)
    // })
    // .then(function success(data) {
    //   $scope.profiles = data.profiles;
    //   $scope.users = data.users;
    // })
    // .catch(function error(err) {
    //   $scope.profiles = [];
    //   $scope.users = [];
    //   Notifications.error('Failure', err, 'Unable to retrieve profiles');
    // })
    // .finally(function final() {
    //   $('#loadingViewSpinner').hide();
    // });
  }

  initView();
}]);
