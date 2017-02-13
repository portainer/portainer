angular.module('portainer.services')
.factory('EntityListService', [function EntityListServiceFactory() {
  'use strict';
  return {
    rememberPreviousSelection: function(oldContainerList, model, onSelectCallback) {
      var oldModel = _.find(oldContainerList, function(item){
        return item.Id === model.Id;
      });
      if (oldModel && oldModel.Checked) {
        model.Checked = true;
        onSelectCallback(model);
      }
    }
  };
}]);
