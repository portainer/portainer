export function ItemViewModel(model, path) {
  this.rawModel = {
    name: (model && model.name) || '',
    path: path,
    type: (model && model.type) || 'file',
    size: model && parseInt(model.size || 0),
    date: model && model.date,
    perms: model && model.rights,
    content: (model && model.content) || '',
    recursive: false,
    fullPath: function () {
      return this.path + '/' + this.name;
    },
  };

  this.error = '';
  this.processing = false;

  this.model = angular.copy(this.rawModel);
  this.tempModel = angular.copy(this.rawModel);

  ItemViewModel.prototype.update = function () {
    angular.extend(this.model, angular.copy(this.tempModel));
  };

  ItemViewModel.prototype.revert = function () {
    angular.extend(this.tempModel, angular.copy(this.model));
    this.error = '';
  };

  ItemViewModel.prototype.isFolder = function () {
    return this.model.type === 'dir';
  };

  ItemViewModel.prototype.isEditable = function () {
    return false;
  };

  ItemViewModel.prototype.isImage = function () {
    return false;
  };

  ItemViewModel.prototype.isCompressible = function () {
    return this.isFolder();
  };

  ItemViewModel.prototype.isExtractable = function () {
    return false;
  };

  ItemViewModel.prototype.isSelectable = function () {
    return false;
  };
}
