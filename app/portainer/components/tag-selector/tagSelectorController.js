angular.module('portainer.app').controller('TagSelectorController', function() {
  this.$onInit = function() {
    this.state.selectedTags = this.model.map(id => this.tags.find(t => t.Id === id));
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
    const index = this.model.findIndex(id => tag.Id === id);
    if (index > -1) {
      this.model.splice(index, 1);
      this.state.selectedTags.splice(index, 1);
    }
  };

  this.filterSelected = filterSelected.bind(this);

  function filterSelected($item) {
    if (!this.model) {
      return true;
    }
    return !this.model.includes($item.Id);
  }
});
