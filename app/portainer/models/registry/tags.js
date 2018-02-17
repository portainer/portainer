function RegistryTagsViewModel(data) {
  this.RegistryName = data.name;
  this.Tags = [];
  if (data.tags) {
    this.Tags = data.tags;
  }
  this.TagsCount = this.Tags.length;
}
