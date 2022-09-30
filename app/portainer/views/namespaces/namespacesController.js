angular.module('portainer.app').controller('NamespacesController', NamespacesController);
// import _ from 'lodash';


function NamespacesController($scope) {
  $scope.state = {
    actionInProgress: false,
  };

  $scope.formValues = {
    Name: '',
  };

  function initView() {
    return;
  }

  initView();
}


