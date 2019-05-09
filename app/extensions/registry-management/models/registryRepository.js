export function RegistryRepositoryViewModel(data) {
  this.Name = data.name;
  this.TagsCount = data.tags.length;
}