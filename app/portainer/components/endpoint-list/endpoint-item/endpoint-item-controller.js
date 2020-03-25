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
    return _.join(tagNames, ',')
  }

  $onInit() {
    this.endpointTags = this.joinTags();
  }

  $onChanges({ tags, model }) {
    if ((!tags && !model) || (!tags.currentValue && !model.currentValue)) {
      return;
    }
    this.endpointTags = this.joinTags();
  }
}

angular.module('portainer.app').controller('EndpointItemController', EndpointItemController);
export default EndpointItemController;
