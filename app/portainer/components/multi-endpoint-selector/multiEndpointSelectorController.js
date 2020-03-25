import _ from 'lodash-es';
import PortainerEndpointTagHelper from 'Portainer/helpers/tagHelper';

import angular from 'angular';

class MultiEndpointSelectorController {
  /* @ngInject */
  constructor() {
    this.sortGroups = this.sortGroups.bind(this);
    this.groupEndpoints = this.groupEndpoints.bind(this);
    this.tagIdsToTagNames = this.tagIdsToTagNames.bind(this);
  }

  sortGroups(groups) {
    return _.sortBy(groups, ['name']);
  }

  groupEndpoints(endpoint) {
    for (var i = 0; i < this.availableGroups.length; i++) {
      var group = this.availableGroups[i];

      if (endpoint.GroupId === group.Id) {
        return group.Name;
      }
    }
  }

  tagIdsToTagNames(tagIds) {
    return PortainerEndpointTagHelper.idsToTagNames(this.tags, tagIds);
  }

  $onInit() {
    this.availableGroups = filterEmptyGroups(this.groups, this.endpoints);
  }
}

export default MultiEndpointSelectorController;
angular.module('portainer.app').controller('MultiEndpointSelectorController', MultiEndpointSelectorController);

function filterEmptyGroups(groups, endpoints) {
  return _.filter(groups, group => _.some(endpoints, endpoint => endpoint.GroupId == group.Id));
}
