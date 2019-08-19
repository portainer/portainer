import _ from 'lodash-es';
export default function RegistryRepositoryViewModel(item) {
  if (item.name && item.tags) {
    this.Name = item.name;
    this.TagsCount = _.without(item.tags, null).length;
  } else {
    this.Name = item;
    this.TagsCount = 0;
  }
}