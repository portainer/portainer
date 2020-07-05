import _ from 'lodash-es';

export function RegistryRepositoryViewModel(item) {
  if (item.name && item.tags) {
    this.Name = item.name;
    this.TagsCount = _.without(item.tags, null).length;
  } else {
    this.Name = item;
    this.TagsCount = 0;
  }
}

export function RegistryRepositoryGitlabViewModel(data) {
  this.Name = data.path;
  this.TagsCount = data.tags.length;
}
