angular.module('users', [])
.controller('UsersController', ['$scope', '$state', 'UserService', 'Messages', 'Pagination',
function ($scope, $state, UserService, Messages, Pagination) {
  $scope.state = {
    error: '',
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('endpoints')
  };
  $scope.sortType = 'Username';
  $scope.sortReverse = true;

  $scope.formValues = {
    Name: '',
    Password: '',
    ConfirmPassword: '',
    isAdmin: false,
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  // $scope.addUser = function() {
  //   $scope.state.error = '';
  //   var name = $scope.formValues.Name;
  //   var URL = $scope.formValues.URL;
  //   var TLS = $scope.formValues.TLS;
  //   var TLSCAFile = $scope.formValues.TLSCACert;
  //   var TLSCertFile = $scope.formValues.TLSCert;
  //   var TLSKeyFile = $scope.formValues.TLSKey;
  //   UserService.createRemoteUser(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, false).then(function success(data) {
  //     Messages.send("User created", name);
  //     $state.reload();
  //   }, function error(err) {
  //     $scope.state.uploadInProgress = false;
  //     $scope.state.error = err.msg;
  //   }, function update(evt) {
  //     if (evt.upload) {
  //       $scope.state.uploadInProgress = evt.upload;
  //     }
  //   });
  // };
  //
  // $scope.removeAction = function () {
  //   $('#loadUsersSpinner').show();
  //   var counter = 0;
  //   var complete = function () {
  //     counter = counter - 1;
  //     if (counter === 0) {
  //       $('#loadUsersSpinner').hide();
  //     }
  //   };
  //   angular.forEach($scope.endpoints, function (endpoint) {
  //     if (endpoint.Checked) {
  //       counter = counter + 1;
  //       UserService.deleteUser(endpoint.Id).then(function success(data) {
  //         Messages.send("User deleted", endpoint.Name);
  //         var index = $scope.endpoints.indexOf(endpoint);
  //         $scope.endpoints.splice(index, 1);
  //         complete();
  //       }, function error(err) {
  //         Messages.error("Failure", err, 'Unable to remove endpoint');
  //         complete();
  //       });
  //     }
  //   });
  // };
  //
  function fetchUsers() {
    $scope.users = [
      {Id: 1, Username: "okenobi", Role: "administrator", Checked: false},
      {Id: 2, Username: "yabon", Role: "user", Checked: false},
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
