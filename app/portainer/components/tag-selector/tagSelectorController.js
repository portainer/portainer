import _ from 'lodash-es';

angular.module('portainer.app').controller('TagSelectorController', function() {
  this.$onInit = function() {
    this.state.selectedTags = _.map(this.model, id => _.find(this.tags, t => t.Id === id));
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
    _.remove(this.model, tag.Id);
  };

  this.filterSelected = filterSelected.bind(this);

  function filterSelected($item) {
    if (!this.model) {
      return true;
    }
    return !_.includes(this.model, $item.Id);
  }
});
