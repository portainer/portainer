export function RegistryRepositoryViewModel(item) {
  if (item.name && item.tags) {
    this.Name = item.name;
    this.TagsCount = item.tags.length;
  } else {
    this.Name = item;
    this.TagsCount = 0;
  }
}