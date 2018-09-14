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

  ctrl.change = function(publickeypath){      
    ctrl.selectsshIdvalue = publickeypath; 
    console.log(publickeypath);
  }


  ctrl.createNewkey = function() {
    var createKeyName = StackService.getStackName() + '_deploy_key';
    var userName = Authentication.getUserDetails().username;
    SshkeyService.createNewsshkey(createKeyName,userName)
    .then(function success() {      
      Notifications.success('Key successfully created', createKeyName);
      $state.reload();
    })
    .catch(function error(err) {      
      Notifications.error('Failure', err, 'Unable to create key');
    });
  }

  function initComponent() {
    var userDetails = Authentication.getUserDetails();
    console.log(userDetails);
    var isAdmin = userDetails.role === 1 ? true: false;
    ctrl.isAdmin = isAdmin;
    
    if (isAdmin) {
      ctrl.formData.Ownership = 'administrators';
    }
    SshkeyService.sshkeys()
    .then(function success(data) {
      ctrl.categories = data;      
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      ctrl.categories = [];
    });
  }

  initComponent();
}]);
