import angular from 'angular';
import _ from 'lodash-es';

class TagSelectorController {
  /* @ngInject */
  constructor() {
    this.state = {
      selectedValue: '',
      selectedTags: [],
      noResult: false,
    };
  }

  removeTag(tag) {
    _.remove(this.model, (id) => tag.Id === id);
    _.remove(this.state.selectedTags, { Id: tag.Id });
  }

  selectTag($item) {
    this.state.selectedValue = '';
    if ($item.create && this.allowCreate) {
      this.onCreate($item.value);
      return;
    }
    this.state.selectedTags.push($item);
    this.model.push($item.Id);
  }

  filterTags(searchValue) {
    let filteredTags = _.filter(this.tags, (tag) => !_.includes(this.model, tag.Id));
    if (!searchValue) {
      return filteredTags;
    }

    const exactTag = _.find(this.tags, (tag) => tag.Name === searchValue);
    filteredTags = _.filter(filteredTags, (tag) => _.includes(tag.Name.toLowerCase(), searchValue.toLowerCase()));
    if (exactTag || !this.allowCreate) {
      return filteredTags;
    }

    return filteredTags.concat({ Name: `Create "${searchValue}"`, create: true, value: searchValue });
  }

  generateSelectedTags(model, tags) {
    this.state.selectedTags = _.map(model, (id) => _.find(tags, (t) => t.Id === id));
  }

  $onInit() {
    this.generateSelectedTags(this.model, this.tags);
  }

  $onChanges({ tags, model }) {
    const tagsValue = tags && tags.currentValue ? tags.currentValue : this.tags;
    const modelValue = model && model.currentValue ? model.currentValue : this.model;
    if (modelValue && tagsValue) {
      this.generateSelectedTags(modelValue, tagsValue);
    }
  }
}

export default TagSelectorController;
angular.module('portainer.app').controller('TagSelectorController', TagSelectorController);
