angular.module('portainer.app').controller('EndpointItemController', 
  function EndpointItemController() {
    var ctrl = this;

    ctrl.editEndpoint = editEndpoint;

    function editEndpoint(event) {
      event.stopPropagation();
      ctrl.onEdit(ctrl.model.Id);
    }


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

    this.joinTags = function joinTags() {
      if (!this.tags) {
        return 'Loading tags...'
      }
      if (!this.model.TagIds) {
        return '';
      }
      const findTagName = tagId => {
        const tag = this.tags.find(tag => tag.Id === tagId);
        if (!tag) {
          return null;
        }
        return tag.Name;
      }
      return this.model.TagIds.map(findTagName).filter(Boolean).join(',');
    }
  });
