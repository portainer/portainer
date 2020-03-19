angular.module('portainer.app').controller('EndpointItemController', function EndpointItemController() {
  var ctrl = this;
  this.endpointTags = '';

  ctrl.editEndpoint = editEndpoint;

  this.$onInit = function $onInit() {
    this.endpointTags = this.joinTags();
  };
  this.$onChanges = function $onChanges(changesObj) {
    this.handleTagsChange(changesObj);
  };
  this.handleTagsChange = function handleTagsChange({ tags, model }) {
    if ((!tags && !model) || (!tags.currentValue && !model.currentValue)) {
      return;
    }
    this.endpointTags = this.joinTags();
  };

  function editEndpoint(event) {
    event.stopPropagation();
    ctrl.onEdit(ctrl.model.Id);
  }

  this.joinTags = function joinTags() {
    return this.model.TagIds.map(tagId => {
      const tag = this.tags.find(tag => tag.Id === tagId);
      if (!tag) {
        return null;
      }
      return tag.Name;
    })
      .filter(Boolean)
      .join(',');
  }
});
