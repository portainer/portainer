import angular from 'angular';
import _ from 'lodash-es';
import PortainerEndpointTagHelper from 'Portainer/helpers/tagHelper';

class EndpointItemController {
  /* @ngInject */
  constructor() {
    this.editEndpoint = this.editEndpoint.bind(this);
  }

  editEndpoint(event) {
    event.stopPropagation();
    this.onEdit(this.model.Id);
  }

  joinTags() {
    if (!this.tags) {
      return 'Loading tags...';
    }

    if (!this.model.TagIds || !this.model.TagIds.length) {
      return '';
    }

    const tagNames = PortainerEndpointTagHelper.idsToTagNames(this.tags, this.model.TagIds);
    return _.join(tagNames, ',');
  }

  isEdgeEndpoint() {
    return this.model.Type === 4 || this.model.Type === 7;
  }

  calcIsCheckInValid() {
    if (!this.isEdgeEndpoint()) {
      return false;
    }
    const checkInInterval = this.model.EdgeCheckinInterval;
    const now = Date.now() / 1000;
    return now - this.model.LastCheckInDate < checkInInterval;
  }

  $onInit() {
    this.endpointTags = this.joinTags();
    this.isCheckInValid = this.calcIsCheckInValid();
  }

  $onChanges({ tags, model }) {
    if ((!tags && !model) || (!tags.currentValue && !model.currentValue)) {
      return;
    }
    this.endpointTags = this.joinTags();

    if (model) {
      this.isCheckInValid = this.calcIsCheckInValid();
    }
  }
}

angular.module('portainer.app').controller('EndpointItemController', EndpointItemController);
export default EndpointItemController;
