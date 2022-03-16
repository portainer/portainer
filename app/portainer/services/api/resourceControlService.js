angular.module('portainer.app').factory('ResourceControlService', [
  '$q',
  'ResourceControl',
  'UserService',
  'TeamService',
  'ResourceControlHelper',
  function ResourceControlServiceFactory($q, ResourceControl, UserService, TeamService, ResourceControlHelper) {
    'use strict';
    const service = {};

    service.duplicateResourceControl = duplicateResourceControl;
    service.applyResourceControl = applyResourceControl;
    service.retrieveOwnershipDetails = retrieveOwnershipDetails;

    /**
     * PRIVATE SECTION
     */

    /**
     * Update a ResourceControl
     * @param {String} rcID ID of involved resource
     * @param {ResourceControlOwnershipParameters} ownershipParameters Transcient type from view data to payload
     */
    function updateResourceControl(rcID, ownershipParameters) {
      const payload = {
        AdministratorsOnly: ownershipParameters.AdministratorsOnly,
        Public: ownershipParameters.Public,
        Users: ownershipParameters.Users,
        Teams: ownershipParameters.Teams,
      };

      return ResourceControl.update({ id: rcID }, payload).$promise;
    }

    /**
     * END PRIVATE SECTION
     */

    /**
     * PUBLIC SECTION
     */

    /**
     * Apply a ResourceControl after Resource creation
     * @param {int} userId ID of User performing the action
     * @param {AccessControlFormData} accessControlData ResourceControl to apply
     * @param {ResourceControlViewModel} resourceControl ResourceControl to update
     * @param {[]int} subResources SubResources managed by the ResourceControl
     */
    function applyResourceControl(userId, accessControlData, resourceControl, subResources = []) {
      const ownershipParameters = ResourceControlHelper.RCFormDataToOwnershipParameters(userId, accessControlData, subResources);
      return updateResourceControl(resourceControl.Id, ownershipParameters);
    }

    /**
     * Duplicate an existing ResourceControl (default to AdministratorsOnly if undefined)
     * @param {int} userId ID of User performing the action
     * @param {ResourceControlViewModel} oldResourceControl ResourceControl to duplicate
     * @param {ResourceControlViewModel} newResourceControl ResourceControl to apply duplication to
     */
    function duplicateResourceControl(userId, oldResourceControl, newResourceControl) {
      const ownershipParameters = ResourceControlHelper.RCViewModelToOwnershipParameters(userId, oldResourceControl);
      return updateResourceControl(newResourceControl.Id, ownershipParameters);
    }

    /**
     * Retrieve users and team details for ResourceControlViewModel
     * @param {ResourceControlViewModel} resourceControl ResourceControl view model
     */
    function retrieveOwnershipDetails(resourceControl) {
      var deferred = $q.defer();

      if (!resourceControl) {
        deferred.resolve({ authorizedUsers: [], authorizedTeams: [] });
        return deferred.promise;
      }

      $q.all({
        users: resourceControl.UserAccesses.length > 0 ? UserService.users(false) : [],
        teams: resourceControl.TeamAccesses.length > 0 ? TeamService.teams() : [],
      })
        .then(function success(data) {
          var authorizedUsers = ResourceControlHelper.retrieveAuthorizedUsers(resourceControl, data.users);
          var authorizedTeams = ResourceControlHelper.retrieveAuthorizedTeams(resourceControl, data.teams);
          deferred.resolve({ authorizedUsers: authorizedUsers, authorizedTeams: authorizedTeams });
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve user and team information', err: err });
        });

      return deferred.promise;
    }

    /**
     * END PUBLIC SECTION
     */

    return service;
  },
]);
