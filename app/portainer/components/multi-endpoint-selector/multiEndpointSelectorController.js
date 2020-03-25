import _ from 'lodash-es';
import PortainerEndpointTagHelper from 'Portainer/helpers/tagHelper';

angular.module('portainer.app').controller('MultiEndpointSelectorController', function() {
  var ctrl = this;

  this.sortGroups = function(groups) {
    return _.sortBy(groups, ['name']);
  };

  this.groupEndpoints = function(endpoint) {
    for (var i = 0; i < ctrl.availableGroups.length; i++) {
      var group = ctrl.availableGroups[i];

      if (endpoint.GroupId === group.Id) {
        return group.Name;
      }
    }
  };

  this.tagIdsToTagNames = function tagIdsToTagNames(tagIds) {
    return PortainerEndpointTagHelper.tagIdsToTagNames(this.tags, tagIds)
  }

  this.$onInit = function() {
    this.availableGroups = filterEmptyGroups(this.groups, this.endpoints);
  };

  function filterEmptyGroups(groups, endpoints) {
    return groups.filter(function f(group) {
      for (var i = 0; i < endpoints.length; i++) {
        var endpoint = endpoints[i];
        if (endpoint.GroupId === group.Id) {
          return true;
        }
      }
      return false;
    });
  }
});
