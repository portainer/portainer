import _ from 'lodash-es';

angular.module('portainer.app')
.controller('TagSelectorController', function () {

  this.$onChanges = function(changes) {
    if(angular.isDefined(changes.tags.currentValue)) {
      this.tags = _.difference(changes.tags.currentValue, this.model);
    }
  };

  this.state = {
    selectedValue: '',
    noResult: false
  };

  this.selectTag = function($item) {
    this.state.selectedValue = '';
    this.model.push($item);
    this.tags = _.remove(this.tags, function(item) {
      return item !== $item;
    });
  };

  this.removeTag = function(tag) {
    var idx = this.model.indexOf(tag);
    if (idx > -1) {
      this.model.splice(idx, 1);
      this.tags.push(tag);
    }
  };
});
