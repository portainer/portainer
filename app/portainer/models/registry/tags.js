function RegistryTagsViewModel(data) {
  this.RegistryName = data.name;
  this.Tags = data.tags;
  this.TagsCount = data.tags.length;
}
