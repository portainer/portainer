angular.module('portainer.app')
.controller('porStackauthControlFormController', ['$q', '$state','$scope','DeploykeyService','StackService', 'UserService', 'TeamService', 'Notifications', 'Authentication', 'ResourceControlService',
function ($q,$state,$scope, DeploykeyService, StackService, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
  var ctrl = this;

  ctrl.existingsshKey = [];
  ctrl.newgenratedeploykey = [];
  ctrl.enableGenratekey = false;  


  ctrl.copytoclipboard = function (){
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($('#selPKey').val()).select();
    document.execCommand("copy");
    $temp.remove();
    Notifications.success('Copied!!!');
    
  }

  ctrl.createNewkey = function() {    
    if(StackService.getStackName() == ''){
      Notifications.error('Pleas Enter Stack Name!',''); 
    } else {
      var createKeyName = 'deploykey_' + StackService.getStackName();
      var userName = Authentication.getUserDetails().username;
      DeploykeyService.createNewdeploykey(createKeyName,userName)
      .then(function success(data) {      
        Notifications.success('Key successfully created', createKeyName);
        //$state.reload();        
        getAlldeploykeydata(data)                   
      })
      .catch(function error(err) {      
        Notifications.error('Failure', err, 'Unable to create key');
      });
    }    
  }

  function initComponent() {
    var userDetails = Authentication.getUserDetails();    
    var isAdmin = userDetails.role === 1 ? true: false;
    ctrl.isAdmin = isAdmin;
    
    if (isAdmin) {
      ctrl.formData.Ownership = 'administrators';
    }
    
    DeploykeyService.deploykeys()
    .then(function success(data) {
      ctrl.categories = data;                       
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      ctrl.categories = [];
    });
  }

  function getAlldeploykeydata(getdata){
    DeploykeyService.deploykeys()
    .then(function success(data) {
      ctrl.categories = data;                 
      ctrl.categories.selected = getdata;//{value : ctrl.categories[data.length - 1]}
      
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      ctrl.categories = [];
    });      
  }
    
  initComponent();
}]);
