angular.module('portainer.app')
.controller('porStackauthControlFormController', ['$q', '$state','$scope','DeploykeyService','StackService', 'UserService', 'TeamService', 'Notifications', 'Authentication', 'ResourceControlService',
function ($q,$state,$scope, DeploykeyService, StackService, UserService, TeamService, Notifications, Authentication, ResourceControlService) {
  var ctrl = this;

  ctrl.formData.existingsshKey = [];
  ctrl.formData.newgenratedeploykey = [];
  ctrl.enableGenratekey = false;    
  
  ctrl.formData.copytoclipboard = function (){
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($('#selPKey').val()).select();
    document.execCommand("copy");
    $temp.remove();
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(2000);   
    
  }

  ctrl.formData.change = function(key){
    if(key != ''){
      $('.copyToClip').removeAttr("disabled")
    }
   else{
    $('.copyToClip').attr('disabled','disabled');
    }   
  }

  ctrl.formData.createNewkey = function() {    
    if(StackService.getStackName() == ''){
      $('#stack_name').focus();
    } else {
      var createKeyName = 'deploykey_' + StackService.getStackName();
      var userID = Authentication.getUserDetails().ID;
      DeploykeyService.createNewdeploykey(createKeyName,userID)
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
      ctrl.formData.GenrateSshkey = data;                       
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      ctrl.formData.GenrateSshkey = [];
    });
  }

  function getAlldeploykeydata(getdata){
    DeploykeyService.deploykeys()
    .then(function success(data) {
      ctrl.formData.GenrateSshkey = data;                 
      ctrl.formData.GenrateSshkey.selected = getdata;//{value : ctrl.formData.GenrateSshkey[data.length - 1]}
      
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      ctrl.formData.GenrateSshkey = [];
    });      
  }
    
  initComponent();
}]);
