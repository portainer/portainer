angular.module('users', [])
.controller('UsersController', ['$scope', '$state', 'UserService', 'ModalService', 'Messages', 'Pagination',
function ($scope, $state, UserService, ModalService, Messages, Pagination) {
  $scope.state = {
    userCreationError: '',
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('users')
  };
  $scope.sortType = 'Username';
  $scope.sortReverse = true;

  $scope.formValues = {
    Username: '',
    Password: '',
    ConfirmPassword: '',
    Role: 'user',
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredUsers, function (user) {
      if (user.Checked !== allSelected) {
        user.Checked = allSelected;
        $scope.selectItem(user);
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

  $scope.addUser = function() {
    $scope.state.userCreationError = '';
    var username = $scope.formValues.Username;
    Messages.send("User created", username);
    $scope.state.userCreationError = 'An error occured';
    // var URL = $scope.formValues.URL;
    // var TLS = $scope.formValues.TLS;
    // var TLSCAFile = $scope.formValues.TLSCACert;
    // var TLSCertFile = $scope.formValues.TLSCert;
    // var TLSKeyFile = $scope.formValues.TLSKey;
    // UserService.createRemoteUser(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, false).then(function success(data) {
    //   Messages.send("User created", name);
    //   $state.reload();
    // }, function error(err) {
    //   $scope.state.uploadInProgress = false;
    //   $scope.state.error = err.msg;
    // }, function update(evt) {
    //   if (evt.upload) {
    //     $scope.state.uploadInProgress = evt.upload;
    //   }
    // });
  };

  function deleteSelectedUsers() {
    $('#loadUsersSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadUsersSpinner').hide();
      }
    };
    angular.forEach($scope.users, function (user) {
      if (user.Checked) {
        counter = counter + 1;
        Messages.send('User successfully deleted', user.Username);
      }
    });
  }

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to delete the selected users? They will not be able to login into Portainer anymore.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedUsers();
      }
    );
  };

  function fetchUsers() {
    $scope.users = [
      {Id: 1, Username: "okenobi", Role: "administrator", Checked: false},
      {Id: 2, Username: "yabon", Role: "user", Checked: false},
      {Id: 3, Username: "rbelmont", Role: "administrator", Checked: false}
    ];
    // $('#loadUsersSpinner').show();
    // UserService.endpoints().then(function success(data) {
    //   $scope.endpoints = data;
    //   UserService.getActive().then(function success(data) {
    //     $scope.activeUser = data;
    //     $('#loadUsersSpinner').hide();
    //   }, function error(err) {
    //     $('#loadUsersSpinner').hide();
    //     Messages.error("Failure", err, "Unable to retrieve active endpoint");
    //   });
    // }, function error(err) {
    //   $('#loadUsersSpinner').hide();
    //   Messages.error("Failure", err, "Unable to retrieve endpoints");
    //   $scope.endpoints = [];
    // });
  }

  fetchUsers();
}]);
