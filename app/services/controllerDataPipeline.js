// ControllerDataPipeline is used to transfer data between multiple controllers.
angular.module('portainer.services')
.factory('ControllerDataPipeline', [function ControllerDataPipelineFactory() {
  'use strict';

  var pipeline = {};

  // accessControlData is used to manage the data required by the accessControlPanelController.
  var accessControlData = {};

  pipeline.setAccessControlData = function (type, resourceId, resourceControl) {
    accessControlData.resourceType = type;
    accessControlData.resourceId = resourceId;
    accessControlData.resourceControl = resourceControl;
  };

  pipeline.getAccessControlData = function() {
    return accessControlData;
  };

  // accessControlFormData is used to manage the data available in the scope of the accessControlFormController.
  var accessControlFormData = {};

  pipeline.setAccessControlFormData = function(accessControlEnabled, ownership, authorizedUsers, authorizedTeams) {
    accessControlFormData.accessControlEnabled = accessControlEnabled;
    accessControlFormData.ownership = ownership;
    accessControlFormData.authorizedUsers = authorizedUsers;
    accessControlFormData.authorizedTeams = authorizedTeams;
  };

  pipeline.getAccessControlFormData = function() {
    return accessControlFormData;
  };

  return pipeline;
}]);
