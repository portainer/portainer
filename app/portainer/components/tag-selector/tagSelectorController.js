import _ from 'lodash-es';

angular.module('portainer.app').controller('TagSelectorController', function() {
  this.$onInit = function() {
    this.state.selectedTags = _.map(this.model, (id) => _.find(this.tags, (t) => t.Id === id));
  };

  this.$onChanges = function({ model }) {
    if (model && model.currentValue) {
      this.state.selectedTags = model.currentValue.map((id) => this.tags.find((t) => t.Id === id));
    }
  };

  this.state = {
    selectedValue: '',
    selectedTags: [],
    noResult: false,
  };

  this.selectTag = function($item) {
    this.state.selectedValue = '';
    this.model.push($item.Id);
    this.state.selectedTags.push($item);
  };

  this.removeTag = function removeTag(tag) {
    _.remove(this.state.selectedTags, { Id: tag.Id });
    _.remove(this.model, (id) => id === tag.Id);
  };

  this.addNew = function addNew() {
    if (this.allowCreate) {
      this.onCreate(this.state.selectedValue);
      this.state.selectedValue = '';
      angular.element('#tags').focus();
    }
  };

  this.filterSelected = filterSelected.bind(this);

  function filterSelected($item) {
    if (!this.model) {
      return true;
    }
    return !_.includes(this.model, $item.Id);
  }
  window._remove = _.remove;
});
