angular.module('portainer.app')
.controller('porStackauthControlFormController', ['$q', '$state','$scope','SshkeyService','StackService', 'UserService', 'TeamService', 'Notifications', 'Authentication', 'ResourceControlService',
function ($q,$state,$scope, SshkeyService, StackService, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
  var ctrl = this;

  ctrl.existingsshKey = [];
  ctrl.newgenratesshkey = [];
  ctrl.selectsshIdvalue = '';
  ctrl.newSSHkeyvalues = '';
  ctrl.newsshkeydiv = false;
  ctrl.SSHRepositoryAuthentication = '1';

  
  var data = [
    {
      "sshId":"1",
      "name":"Hello"
    },
    {
      "sshId":"2",
      "name":"Good"
    },
    {
      "sshId":"3",
      "name":"Best"
    },
    {
      "sshId":"4",
      "name":"Dev"
    }
    ];
    
  ctrl.categories = data;

  ctrl.change = function(id){      
    ctrl.selectsshIdvalue = id; 
  }
  /*ctrl.generateNewKey = function(){    
    ctrl.newSSHkeyvalues = StackService.getStackName() + '_deploy_key';        
    ctrl.newsshkeydiv = true;     
  }*/


  ctrl.createNewkey = function() {
    var createKeyName = StackService.getStackName() + '_deploy_key';
    SshkeyService.createNewsshkey(createKeyName)
    .then(function success() {
      alert(createKeyName);
      Notifications.success('Key successfully created', createKeyName);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create key');
    });
  }

  function initComponent() {
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    ctrl.isAdmin = isAdmin;
    
    if (isAdmin) {
      ctrl.formData.Ownership = 'administrators';
    }
    SshkeyService.sshkeys()
    .then(function success(data) {
      $scope.sshkeys = data;
      console.log(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      $scope.sshkeys = [];
    });
  }

  initComponent();
}]);
