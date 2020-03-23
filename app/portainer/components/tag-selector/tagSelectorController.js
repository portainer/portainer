angular.module('portainer.app').controller('TagSelectorController', function() {
  this.$onChanges = function(changes) {
    if (changes.model && changes.model.currentValue) {
      this.state.selectedTags = changes.model.currentValue.map(id => this.tags.find(t => t.Id === id))
    }
  };

  this.state = {
    selectedValue: '',
    selectedTags: [],
    noResult: false,
  };

  this.selectTag = function($item) {
    this.state.selectedValue = '';
    this.onChange(this.model.concat($item.Id));
  };

  this.removeTag = function removeTag(tag) {
    this.onChange(this.model.filter(id => tag.Id !== id));
  };

  this.filterSelected = filterSelected.bind(this);

  function filterSelected($item) {
    return !this.model.includes($item.Id);
  }
});
