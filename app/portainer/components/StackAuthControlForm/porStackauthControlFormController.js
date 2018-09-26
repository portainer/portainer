angular.module('portainer.app')
.controller('porStackauthControlFormController', ['$q', '$state','$scope','DeploykeyService','StackService', 'UserService', 'TeamService', 'Notifications', 'Authentication', 'ResourceControlService',
function ($q,$state,$scope, DeploykeyService, StackService, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
  var ctrl = this;

  ctrl.existingsshKey = [];
  ctrl.newgenratedeploykey = [];
  ctrl.enableGenratekey = false;  
  ctrl.textEntered
  
  
  ctrl.copytoclipboard = function (){
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($('#selPKey').val()).select();
    document.execCommand("copy");
    $temp.remove();
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(2000);
    
  }

  ctrl.change = function(key){
    if(key != ''){
      $('.copyToClip').removeAttr("disabled")
    }
   else{
    $('.copyToClip').attr('disabled','disabled');
    }   
  }

  ctrl.createNewkey = function() {    
    if(StackService.getStackName() == ''){
      $('#stack_name').focus();
    } else {
      var createKeyName = 'deploykey_' + StackService.getStackName();
      var userName = Authentication.getUserDetails().username;
      DeploykeyService.createNewdeploykey(createKeyName,userName)
      .then(function success(data) {      
        Notifications.success('Key successfully created', createKeyName);
        //$state.reload();        
        getAlldeploykeydata(data)            
        $('.copyToClip').removeAttr("disabled")       
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
    
    /*Enable / Disable deploykey button based on text entering in stack name textbox*/
    if($('#stack_name').val() !=""){
      $('#btngeneratekey').removeAttr("disabled")
      $('#warningStackname').hide();
    } else {
      $('#btngeneratekey').attr('disabled','disabled');
      $('#warningStackname').show();
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
